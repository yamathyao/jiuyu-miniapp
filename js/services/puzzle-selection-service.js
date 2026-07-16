const NORMAL_DIFFICULTIES = ["beginner", "intermediate", "skilled", "expert"];

function createDifficultyRecord() {
  return NORMAL_DIFFICULTIES.reduce(function (record, difficulty) {
    record[difficulty] = [];
    return record;
  }, {});
}

function createEmptyPuzzleSelectionHistory() {
  return {
    completedPuzzleIdsByDifficulty: createDifficultyRecord(),
    recentExamPuzzleIdsByDifficulty: createDifficultyRecord()
  };
}

function getPuzzleIdsByDifficulty(puzzles, difficulty) {
  return (Array.isArray(puzzles) ? puzzles : []).filter(function (puzzle) {
    return puzzle && puzzle.difficulty === difficulty;
  }).map(function (puzzle) {
    return puzzle.id;
  });
}

function normalizeIds(ids, validIds, limit) {
  const normalized = Array.isArray(ids) ? ids.filter(function (id) {
    return typeof id === "string" && validIds.indexOf(id) >= 0;
  }).filter(function (id, index, values) {
    return values.indexOf(id) === index;
  }) : [];

  return limit ? normalized.slice(-limit) : normalized;
}

function normalizePuzzleSelectionHistory(history, puzzles) {
  const normalized = createEmptyPuzzleSelectionHistory();

  NORMAL_DIFFICULTIES.forEach(function (difficulty) {
    const validIds = getPuzzleIdsByDifficulty(puzzles, difficulty);
    const completed = history && history.completedPuzzleIdsByDifficulty;
    const recent = history && history.recentExamPuzzleIdsByDifficulty;

    normalized.completedPuzzleIdsByDifficulty[difficulty] = normalizeIds(
      completed && completed[difficulty],
      validIds
    );
    normalized.recentExamPuzzleIdsByDifficulty[difficulty] = normalizeIds(
      recent && recent[difficulty],
      validIds,
      1
    );
  });

  return normalized;
}

function getDifficultyPuzzles(puzzles, difficulty) {
  return (Array.isArray(puzzles) ? puzzles : []).filter(function (puzzle) {
    return puzzle && puzzle.difficulty === difficulty;
  });
}

function getPreferredCandidates(puzzles, difficulty, history) {
  const normalized = normalizePuzzleSelectionHistory(history, puzzles);
  const difficultyPuzzles = getDifficultyPuzzles(puzzles, difficulty);
  const completedIds = normalized.completedPuzzleIdsByDifficulty[difficulty] || [];
  const unfinishedPuzzles = difficultyPuzzles.filter(function (puzzle) {
    return completedIds.indexOf(puzzle.id) < 0;
  });

  return unfinishedPuzzles.length > 0 ? unfinishedPuzzles : difficultyPuzzles;
}

function selectNormalPuzzle(puzzles, difficulty, history, cursorByDifficulty) {
  const candidates = getPreferredCandidates(puzzles, difficulty, history);

  if (candidates.length === 0) {
    return null;
  }

  const cursor = cursorByDifficulty || {};
  const nextIndex = (cursor[difficulty] || 0) % candidates.length;
  cursor[difficulty] = (nextIndex + 1) % candidates.length;
  return candidates[nextIndex];
}

function selectExamPuzzle(puzzles, difficulty, history, random) {
  const normalized = normalizePuzzleSelectionHistory(history, puzzles);
  const candidates = getPreferredCandidates(puzzles, difficulty, normalized);
  const recentId = (normalized.recentExamPuzzleIdsByDifficulty[difficulty] || [])[0];
  const cooledCandidates = candidates.filter(function (puzzle) {
    return puzzle.id !== recentId;
  });
  const pool = cooledCandidates.length > 0 ? cooledCandidates : candidates;

  if (pool.length === 0) {
    return null;
  }

  const randomValue = (random || Math.random)();
  const index = Math.max(0, Math.min(pool.length - 1, Math.floor(randomValue * pool.length)));
  return pool[index];
}

function recordPuzzleCompletion(history, puzzleId, puzzles) {
  const normalized = normalizePuzzleSelectionHistory(history, puzzles);
  const puzzle = (Array.isArray(puzzles) ? puzzles : []).find(function (item) {
    return item && item.id === puzzleId && NORMAL_DIFFICULTIES.indexOf(item.difficulty) >= 0;
  });

  if (!puzzle || normalized.completedPuzzleIdsByDifficulty[puzzle.difficulty].indexOf(puzzleId) >= 0) {
    return normalized;
  }

  normalized.completedPuzzleIdsByDifficulty[puzzle.difficulty].push(puzzleId);
  return normalized;
}

function recordTimedOutExam(history, puzzleId, puzzles) {
  const normalized = normalizePuzzleSelectionHistory(history, puzzles);
  const puzzle = (Array.isArray(puzzles) ? puzzles : []).find(function (item) {
    return item && item.id === puzzleId && NORMAL_DIFFICULTIES.indexOf(item.difficulty) >= 0;
  });

  if (puzzle) {
    normalized.recentExamPuzzleIdsByDifficulty[puzzle.difficulty] = [puzzleId];
  }

  return normalized;
}

module.exports = {
  NORMAL_DIFFICULTIES,
  createEmptyPuzzleSelectionHistory,
  normalizePuzzleSelectionHistory,
  selectNormalPuzzle,
  selectExamPuzzle,
  recordPuzzleCompletion,
  recordTimedOutExam
};
