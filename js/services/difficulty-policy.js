const POLICIES = {
  beginner: {
    difficulty: "beginner",
    checkMode: "solution",
    hintLevels: ["direction", "cell", "technique", "answer"],
    allowAnswerHint: true,
    copyStyle: "playful"
  },
  intermediate: {
    difficulty: "intermediate",
    checkMode: "solution",
    hintLevels: ["direction", "cell", "technique"],
    allowAnswerHint: false,
    copyStyle: "gentle"
  },
  skilled: {
    difficulty: "skilled",
    checkMode: "conflict",
    hintLevels: ["direction", "technique"],
    allowAnswerHint: false,
    copyStyle: "pro"
  },
  expert: {
    difficulty: "expert",
    checkMode: "conflict",
    hintLevels: ["technique"],
    allowAnswerHint: false,
    copyStyle: "pro"
  }
};

function getDifficultyPolicy(difficulty) {
  return POLICIES[difficulty] || POLICIES.beginner;
}

module.exports = {
  getDifficultyPolicy
};
