const { getDifficultyPolicy } = require("./difficulty-policy");
const { isRelatedCell } = require("../utils/sudoku");

function buildResult(mode, issueIndexes, difficulty, t) {
  const sortedIndexes = issueIndexes.slice().sort(function (left, right) {
    return left - right;
  });
  const translate = typeof t === "function"
    ? t
    : function (key) {
        return key;
      };
  const issueKey = "check.hasIssueByDifficulty." + difficulty;
  const cleanKey = "check.cleanByDifficulty." + difficulty;
  const issueMessage = translate(issueKey);
  const cleanMessage = translate(cleanKey);

  return {
    mode: mode,
    hasIssue: sortedIndexes.length > 0,
    message: sortedIndexes.length > 0
      ? (issueMessage === issueKey ? translate("check.hasIssue") : issueMessage)
      : (cleanMessage === cleanKey ? translate("check.clean") : cleanMessage),
    issueIndexes: sortedIndexes
  };
}

function checkConflicts(game, t, difficulty) {
  const issueIndexes = [];

  game.cells.forEach(function (cell) {
    if (!cell.value || cell.given) {
      return;
    }

    const hasConflict = game.cells.some(function (otherCell) {
      return (
        otherCell.index !== cell.index &&
        otherCell.value === cell.value &&
        isRelatedCell(cell.index, otherCell.index)
      );
    });

    if (hasConflict) {
      issueIndexes.push(cell.index);
    }
  });

  return buildResult("conflict", issueIndexes, difficulty || game.difficulty, t);
}

function checkAgainstSolution(game, t, difficulty) {
  const issueIndexes = game.cells
    .filter(function (cell) {
      if (!cell.value || cell.given) {
        return false;
      }

      return game.solution[cell.index] !== cell.value;
    })
    .map(function (cell) {
      return cell.index;
    });

  return buildResult("solution", issueIndexes, difficulty || game.difficulty, t);
}

function runDifficultyCheck(game, difficulty, t) {
  const policy = getDifficultyPolicy(difficulty);

  if (policy.checkMode === "conflict") {
    return checkConflicts(game, t, difficulty);
  }

  return checkAgainstSolution(game, t, difficulty);
}

module.exports = {
  checkConflicts,
  checkAgainstSolution,
  runDifficultyCheck
};
