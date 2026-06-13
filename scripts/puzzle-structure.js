const STRUCTURE_MINIMUMS = {
  beginner: 3,
  intermediate: 3,
  skilled: 4,
  expert: 4
};

function normalizePuzzleLayout(grid) {
  const map = {};
  let nextDigit = 1;

  return String(grid || "").split("").map(function (cell) {
    if (cell === "0") {
      return "0";
    }

    if (!map[cell]) {
      map[cell] = String(nextDigit);
      nextDigit += 1;
    }

    return map[cell];
  }).join("");
}

function groupPuzzlesByDifficulty(sourcePuzzles) {
  return (sourcePuzzles || []).reduce(function (groups, puzzle) {
    if (!puzzle || typeof puzzle !== "object") {
      return groups;
    }

    const difficulty = String(puzzle.difficulty || "unknown");

    if (!groups[difficulty]) {
      groups[difficulty] = [];
    }

    groups[difficulty].push(puzzle);
    return groups;
  }, {});
}

function summarizeStructureClusters(difficultyPuzzles) {
  const buckets = {};

  (difficultyPuzzles || []).forEach(function (puzzle) {
    const key = normalizePuzzleLayout(String(puzzle.puzzle || ""));

    if (!buckets[key]) {
      buckets[key] = [];
    }

    buckets[key].push(String(puzzle.id || "unknown"));
  });

  const clusters = Object.keys(buckets).map(function (key) {
    return {
      size: buckets[key].length,
      ids: buckets[key].slice()
    };
  }).sort(function (left, right) {
    if (right.size !== left.size) {
      return right.size - left.size;
    }

    return left.ids[0].localeCompare(right.ids[0]);
  });

  return {
    normalizedUnique: clusters.length,
    clusters: clusters
  };
}

function findStructureShortfalls(groups, minimums) {
  return Object.keys(minimums || {}).reduce(function (errors, difficulty) {
    const difficultyPuzzles = groups[difficulty] || [];

    if (difficultyPuzzles.length === 0) {
      return errors;
    }

    const summary = summarizeStructureClusters(difficultyPuzzles);

    if (summary.normalizedUnique < minimums[difficulty]) {
      errors.push(
        difficulty + ": normalizedUnique " + summary.normalizedUnique +
        " is below minimum " + minimums[difficulty] + "."
      );
    }

    return errors;
  }, []);
}

module.exports = {
  STRUCTURE_MINIMUMS,
  normalizePuzzleLayout,
  groupPuzzlesByDifficulty,
  summarizeStructureClusters,
  findStructureShortfalls
};
