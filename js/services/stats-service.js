function buildCompletionTags(summary) {
  const tags = [];

  if (summary.hintCount === 0) {
    tags.push("零提示");
  }
  if (summary.mistakeCount === 0) {
    tags.push("零错误");
  }
  if (summary.mistakeCount === 0 && summary.checkCount === 0) {
    tags.push("一次完成");
  }

  return tags;
}

function buildCompletionMessage(summary, t) {
  const translate = typeof t === "function"
    ? t
    : function (key) {
        return key;
      };
  const titleKey = "completion.titleByDifficulty." + summary.difficulty;
  const encouragementKey = "completion.encouragementByDifficulty." + summary.difficulty;
  const title = translate(titleKey);
  const encouragement = translate(encouragementKey);

  return {
    title: title === titleKey ? "" : title,
    encouragement: encouragement === encouragementKey ? "" : encouragement
  };
}

function createCompletionSummary(input) {
  const summary = {
    difficulty: input.difficulty,
    elapsedSeconds: input.elapsedSeconds,
    hintCount: input.hintCount,
    checkCount: input.checkCount,
    mistakeCount: input.mistakeCount,
    completedAt: input.completedAt
  };
  const completionMessage = buildCompletionMessage(summary, input.t);

  return Object.assign({}, summary, {
    resultTags: buildCompletionTags(summary),
    title: completionMessage.title,
    encouragement: completionMessage.encouragement
  });
}

function createEmptyStats() {
  return {
    totalCompleted: 0,
    lastCompletedAt: "",
    lastCompletedDifficulty: "",
    lastElapsedSeconds: 0,
    currentStreakDays: 0,
    bestStreakDays: 0,
    bestTimeByDifficulty: {
      beginner: 0,
      intermediate: 0,
      skilled: 0,
      expert: 0
    },
    averageTimeByDifficulty: {
      beginner: 0,
      intermediate: 0,
      skilled: 0,
      expert: 0
    },
    completionCountByDifficulty: {
      beginner: 0,
      intermediate: 0,
      skilled: 0,
      expert: 0
    },
    hintCountByDifficulty: {
      beginner: 0,
      intermediate: 0,
      skilled: 0,
      expert: 0
    },
    totalTimeByDifficulty: {
      beginner: 0,
      intermediate: 0,
      skilled: 0,
      expert: 0
    }
  };
}

function getUtcDayStamp(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate()
  );
}

function applyCompletionToStats(stats, summary) {
  const nextStats = JSON.parse(JSON.stringify(stats));
  const difficulty = summary.difficulty;
  const count = nextStats.completionCountByDifficulty[difficulty] + 1;
  const totalTime = nextStats.totalTimeByDifficulty[difficulty] + summary.elapsedSeconds;
  const previousDayStamp = getUtcDayStamp(nextStats.lastCompletedAt);
  const currentDayStamp = getUtcDayStamp(summary.completedAt);

  nextStats.totalCompleted += 1;
  nextStats.lastCompletedAt = summary.completedAt;
  nextStats.lastCompletedDifficulty = summary.difficulty;
  nextStats.lastElapsedSeconds = summary.elapsedSeconds;
  nextStats.completionCountByDifficulty[difficulty] = count;
  nextStats.hintCountByDifficulty[difficulty] += summary.hintCount;
  nextStats.totalTimeByDifficulty[difficulty] = totalTime;
  nextStats.averageTimeByDifficulty[difficulty] = Math.round(totalTime / count);
  nextStats.bestTimeByDifficulty[difficulty] = nextStats.bestTimeByDifficulty[difficulty] === 0
    ? summary.elapsedSeconds
    : Math.min(nextStats.bestTimeByDifficulty[difficulty], summary.elapsedSeconds);

  if (currentDayStamp === null) {
    nextStats.currentStreakDays = Math.max(nextStats.currentStreakDays, 1);
  } else if (previousDayStamp === null) {
    nextStats.currentStreakDays = 1;
  } else {
    const dayDiff = Math.round((currentDayStamp - previousDayStamp) / 86400000);

    if (dayDiff === 0) {
      nextStats.currentStreakDays = Math.max(nextStats.currentStreakDays, 1);
    } else if (dayDiff === 1) {
      nextStats.currentStreakDays += 1;
    } else {
      nextStats.currentStreakDays = 1;
    }
  }

  nextStats.bestStreakDays = Math.max(nextStats.bestStreakDays, nextStats.currentStreakDays);

  return nextStats;
}

module.exports = {
  buildCompletionTags,
  buildCompletionMessage,
  createCompletionSummary,
  createEmptyStats,
  applyCompletionToStats
};
