const DIFFICULTIES = ["beginner", "intermediate", "skilled", "expert"];

const DIFFICULTY_INDEX = {
  beginner: 0,
  intermediate: 1,
  skilled: 2,
  expert: 3
};

const POINT_REWARDS = {
  beginner: 10,
  intermediate: 20,
  skilled: 30,
  expert: 40
};

const UNLOCK_COSTS = {
  intermediate: 100,
  skilled: 250,
  expert: 450
};

function createExamRecord() {
  return {
    passed: false,
    attempted: false,
    failedCount: 0,
    bestRemainingSeconds: 0
  };
}

function normalizeUnlockedDifficulties(difficulties) {
  return DIFFICULTIES.filter(function (difficulty) {
    return Array.isArray(difficulties) && difficulties.indexOf(difficulty) >= 0;
  });
}

function createEmptyProgress() {
  return {
    unlockedDifficulties: ["beginner"],
    totalPoints: 0,
    examRecordByDifficulty: {
      beginner: createExamRecord(),
      intermediate: createExamRecord(),
      skilled: createExamRecord(),
      expert: createExamRecord()
    }
  };
}

function isDifficultyUnlocked(progress, difficulty) {
  return normalizeUnlockedDifficulties(progress && progress.unlockedDifficulties).indexOf(difficulty) >= 0;
}

function applyExamPassToProgress(progress, difficulty, remainingSeconds) {
  const nextProgress = JSON.parse(JSON.stringify(progress || createEmptyProgress()));
  const unlockIndex = DIFFICULTY_INDEX[difficulty];

  nextProgress.unlockedDifficulties = DIFFICULTIES.filter(function (item) {
    return DIFFICULTY_INDEX[item] <= unlockIndex ||
      nextProgress.unlockedDifficulties.indexOf(item) >= 0;
  });

  if (nextProgress.examRecordByDifficulty[difficulty]) {
    nextProgress.examRecordByDifficulty[difficulty].attempted = true;
    nextProgress.examRecordByDifficulty[difficulty].passed = true;
    nextProgress.examRecordByDifficulty[difficulty].bestRemainingSeconds = Math.max(
      nextProgress.examRecordByDifficulty[difficulty].bestRemainingSeconds,
      remainingSeconds || 0
    );
  }

  return nextProgress;
}

function applyExamFailureToProgress(progress, difficulty) {
  const nextProgress = JSON.parse(JSON.stringify(progress || createEmptyProgress()));

  if (nextProgress.examRecordByDifficulty[difficulty]) {
    nextProgress.examRecordByDifficulty[difficulty].attempted = true;
    nextProgress.examRecordByDifficulty[difficulty].failedCount += 1;
  }

  return nextProgress;
}

function applyPointsToProgress(progress, points) {
  const nextProgress = JSON.parse(JSON.stringify(progress || createEmptyProgress()));
  nextProgress.totalPoints += points;

  ["intermediate", "skilled", "expert"].forEach(function (difficulty) {
    if (
      nextProgress.totalPoints >= getUnlockCost(difficulty) &&
      nextProgress.unlockedDifficulties.indexOf(difficulty) < 0
    ) {
      nextProgress.unlockedDifficulties.push(difficulty);
    }
  });

  nextProgress.unlockedDifficulties = normalizeUnlockedDifficulties(nextProgress.unlockedDifficulties);
  return nextProgress;
}

function getPointsReward(difficulty) {
  return POINT_REWARDS[difficulty] || 0;
}

function getUnlockCost(difficulty) {
  return UNLOCK_COSTS[difficulty] || 0;
}

module.exports = {
  DIFFICULTIES,
  POINT_REWARDS,
  UNLOCK_COSTS,
  createEmptyProgress,
  isDifficultyUnlocked,
  applyExamPassToProgress,
  applyExamFailureToProgress,
  applyPointsToProgress,
  getPointsReward,
  getUnlockCost
};
