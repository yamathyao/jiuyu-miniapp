function createEmptyStats() {
  return {
    completedGames: 0,
    streakDays: 0,
    bestSeconds: null,
    averageSeconds: null
  };
}

module.exports = {
  createEmptyStats
};

