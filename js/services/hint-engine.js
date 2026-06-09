const { getDifficultyPolicy } = require("./difficulty-policy");
const {
  getRow,
  getColumn,
  getBox,
  isSameRow,
  isSameColumn,
  isSameBox
} = require("../utils/sudoku");

function getCandidateValues(game, targetIndex) {
  const targetCell = game.cells[targetIndex];

  if (!targetCell || targetCell.given || targetCell.value) {
    return [];
  }

  const usedValues = game.cells.reduce(function (result, cell, cellIndex) {
    if (!cell.value || cellIndex === targetIndex) {
      return result;
    }

    if (
      getRow(cellIndex) === getRow(targetIndex) ||
      getColumn(cellIndex) === getColumn(targetIndex) ||
      getBox(cellIndex) === getBox(targetIndex)
    ) {
      result[cell.value] = true;
    }

    return result;
  }, {});

  return ["1", "2", "3", "4", "5", "6", "7", "8", "9"].filter(function (value) {
    return !usedValues[value];
  });
}

function findHintTargetByTechnique(game, technique) {
  if (technique === "naked-pair") {
    let bestIndex = -1;
    let bestCandidateCount = 10;

    game.cells.forEach(function (cell, index) {
      if (cell.given || cell.value) {
        return;
      }

      const candidateCount = getCandidateValues(game, index).length;

      if (
        candidateCount >= 2 &&
        candidateCount < bestCandidateCount
      ) {
        bestIndex = index;
        bestCandidateCount = candidateCount;
      }
    });

    return bestIndex;
  }

  if (technique === "box-line-reduction") {
    return game.cells.findIndex(function (cell, index) {
      return !cell.given && !cell.value;
    });
  }

  if (technique === "xy-wing") {
    let bestIndex = -1;
    let bestCandidateCount = 10;

    game.cells.forEach(function (cell, index) {
      if (cell.given || cell.value) {
        return;
      }

      const candidateCount = getCandidateValues(game, index).length;

      if (candidateCount === 3 && candidateCount < bestCandidateCount) {
        bestIndex = index;
        bestCandidateCount = candidateCount;
      }
    });

    return bestIndex;
  }

  return -1;
}

function findHintTarget(game, technique) {
  const techniqueIndex = findHintTargetByTechnique(game, technique);

  if (techniqueIndex >= 0) {
    return techniqueIndex;
  }

  const singleCandidateIndex = game.cells.findIndex(function (cell, index) {
    return !cell.given &&
      !cell.value &&
      getCandidateValues(game, index).length === 1;
  });

  if (singleCandidateIndex >= 0) {
    return singleCandidateIndex;
  }

  const index = game.cells.findIndex(function (cell) {
    return !cell.given && !cell.value;
  });

  if (index >= 0) {
    return index;
  }

  const fallbackIndex = game.cells.findIndex(function (cell) {
    return !cell.given;
  });

  return fallbackIndex >= 0 ? fallbackIndex : 2;
}

function getRelatedIndexesByTechnique(game, targetIndex, technique) {
  if (targetIndex < 0) {
    return [];
  }

  if (technique === "box-line-reduction") {
    return game.cells.reduce(function (result, cell, index) {
      if (
        index !== targetIndex &&
        !cell.given &&
        !cell.value &&
        isSameBox(index, targetIndex) &&
        isSameColumn(index, targetIndex)
      ) {
        result.push(index);
      }

      return result;
    }, []).slice(0, 2);
  }

  if (technique === "x-wing") {
    const rowIndexes = [];
    const columnIndexes = [];

    game.cells.forEach(function (cell, index) {
      if (index === targetIndex || cell.given || cell.value) {
        return;
      }

      if (isSameRow(index, targetIndex)) {
        rowIndexes.push(index);
      }

      if (isSameColumn(index, targetIndex)) {
        columnIndexes.push(index);
      }
    });

    return rowIndexes.slice(0, 2).concat(columnIndexes.slice(0, 2));
  }

  if (technique === "xy-wing") {
    const targetCandidates = getCandidateValues(game, targetIndex);
    const peerIndexes = [];

    game.cells.forEach(function (cell, index) {
      if (index === targetIndex || cell.given || cell.value) {
        return;
      }

      const candidates = getCandidateValues(game, index);
      const sharedCount = candidates.filter(function (value) {
        return targetCandidates.indexOf(value) >= 0;
      }).length;

      if (sharedCount < 1) {
        return;
      }

      if (isSameRow(index, targetIndex) || isSameBox(index, targetIndex)) {
        peerIndexes.push({
          index: index,
          candidateCount: candidates.length,
          sameRow: isSameRow(index, targetIndex)
        });
      }
    });

    return peerIndexes.sort(function (left, right) {
      if (left.candidateCount !== right.candidateCount) {
        return left.candidateCount - right.candidateCount;
      }

      if (left.sameRow !== right.sameRow) {
        return left.sameRow ? -1 : 1;
      }

      return left.index - right.index;
    }).slice(0, 2).map(function (entry) {
      return entry.index;
    });
  }

  return [];
}

function formatTechniqueLabel(technique) {
  const normalized = String(technique || "naked-single");
  const labelMap = {
    "naked-single": "Naked Single",
    "naked-pair": "Naked Pair",
    "hidden-single": "Hidden Single",
    "pointing-pair": "Pointing Pair",
    "box-line-reduction": "Box-Line Reduction",
    "x-wing": "X-Wing",
    "xy-wing": "XY-Wing"
  };

  if (labelMap[normalized]) {
    return labelMap[normalized];
  }

  return normalized.split("-").map(function (segment) {
    return segment ? segment.charAt(0).toUpperCase() + segment.slice(1) : "";
  }).join("-");
}

function buildHintMessage(level, difficulty, hintMeta, t) {
  const translate = typeof t === "function"
    ? t
    : function (key) {
        return key;
      };

  if (difficulty === "skilled" && level === "technique") {
    const skilledKey = "hint.skilled.techniqueByTechnique." + hintMeta.techniqueKey;

    if (translate(skilledKey) !== skilledKey) {
      return translate(skilledKey, hintMeta);
    }
  }

  if (difficulty === "expert" && level === "technique") {
    const expertKey = "hint.expert.techniqueByTechnique." + hintMeta.techniqueKey;

    if (translate(expertKey) !== expertKey) {
      return translate(expertKey, hintMeta);
    }

    return translate("hint.expert.technique", hintMeta);
  }

  if (translate("hint." + difficulty + "." + level) !== "hint." + difficulty + "." + level) {
    return translate("hint." + difficulty + "." + level, hintMeta);
  }

  if (difficulty === "beginner") {
    return translate("hint.beginner." + level, hintMeta);
  }

  return translate("hint.fallback." + level) !== "hint.fallback." + level
    ? translate("hint.fallback." + level, hintMeta)
    : translate("hint.fallback.technique", hintMeta);
}

function getNextHint(game, difficulty, hintState, t) {
  const policy = getDifficultyPolicy(difficulty);
  const technique = Array.isArray(game.techniques) && game.techniques.length > 0
    ? game.techniques[0]
    : "naked-single";
  const targetIndex = findHintTarget(game, technique);
  const relatedIndexes = getRelatedIndexesByTechnique(game, targetIndex, technique);
  const currentLevelIndex = hintState.currentLevel
    ? policy.hintLevels.indexOf(hintState.currentLevel)
    : -1;
  const safeCurrentLevelIndex = currentLevelIndex >= 0 ? currentLevelIndex : -1;
  const nextLevelIndex = (safeCurrentLevelIndex + 1) % policy.hintLevels.length;
  const level = policy.hintLevels[nextLevelIndex];
  const value = game.solution[targetIndex];
  const hintMeta = {
    row: String(getRow(targetIndex) + 1),
    column: String(getColumn(targetIndex) + 1),
    box: String(getBox(targetIndex) + 1),
    value: value,
    technique: formatTechniqueLabel(technique),
    techniqueKey: technique
  };

  return {
    level: level,
    technique: technique,
    message: buildHintMessage(level, difficulty, hintMeta, t),
    targetIndex: targetIndex,
    relatedIndexes: relatedIndexes,
    progress: {
      current: nextLevelIndex + 1,
      total: policy.hintLevels.length
    },
    value: value
  };
}

module.exports = {
  getNextHint
};
