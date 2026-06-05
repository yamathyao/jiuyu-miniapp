const { getDifficultyPolicy } = require("./difficulty-policy");

function findFirstEditableTarget(game) {
  const index = game.cells.findIndex(function (cell) {
    return !cell.given && cell.index === 2;
  });

  return index >= 0 ? index : 2;
}

function buildHintMessage(level, difficulty, t) {
  const translate = typeof t === "function"
    ? t
    : function (key) {
        return key;
      };

  if (difficulty === "expert" && level === "technique") {
    return translate("hint.expert.technique");
  }

  if (difficulty === "beginner") {
    return translate("hint.beginner." + level);
  }

  return translate("hint.fallback.technique");
}

function getNextHint(game, difficulty, hintState, t) {
  const policy = getDifficultyPolicy(difficulty);
  const targetIndex = findFirstEditableTarget(game);
  const nextLevelIndex = hintState.currentLevel
    ? policy.hintLevels.indexOf(hintState.currentLevel) + 1
    : 0;
  const safeLevelIndex = Math.min(
    Math.max(nextLevelIndex, 0),
    policy.hintLevels.length - 1
  );
  const level = policy.hintLevels[safeLevelIndex];

  return {
    level: level,
    technique: "naked-single",
    message: buildHintMessage(level, difficulty, t),
    targetIndex: targetIndex,
    value: "4"
  };
}

module.exports = {
  getNextHint
};
