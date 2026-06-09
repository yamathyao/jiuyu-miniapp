const { createEmptyStats } = require("./stats-service");

const STORAGE_KEYS = {
  currentGame: "jiuyu.currentGame",
  settings: "jiuyu.settings",
  stats: "jiuyu.stats"
};

function getStorageApi(storageApi) {
  if (storageApi) {
    return storageApi;
  }

  if (typeof wx !== "undefined") {
    return wx;
  }

  return null;
}

function readStorage(key, fallbackValue, storageApi) {
  const api = getStorageApi(storageApi);

  if (!api || typeof api.getStorageSync !== "function") {
    return fallbackValue;
  }

  try {
    const value = api.getStorageSync(key);
    return value === "" || typeof value === "undefined" ? fallbackValue : value;
  } catch (error) {
    return fallbackValue;
  }
}

function writeStorage(key, value, storageApi) {
  const api = getStorageApi(storageApi);

  if (!api || typeof api.setStorageSync !== "function") {
    return false;
  }

  try {
    api.setStorageSync(key, value);
    return true;
  } catch (error) {
    return false;
  }
}

function isValidHistoryEntry(entry) {
  return (
    Boolean(entry) &&
    Number.isInteger(entry.index) &&
    typeof entry.mode === "string" &&
    typeof entry.value === "string" &&
    Array.isArray(entry.notes)
  );
}

function isValidCell(cell) {
  return (
    Boolean(cell) &&
    Number.isInteger(cell.index) &&
    typeof cell.value === "string" &&
    typeof cell.given === "boolean" &&
    Array.isArray(cell.notes)
  );
}

function isValidGame(game) {
  return (
    Boolean(game) &&
    typeof game.puzzleId === "string" &&
    typeof game.difficulty === "string" &&
    typeof game.puzzle === "string" &&
    typeof game.solution === "string" &&
    Array.isArray(game.cells) &&
    game.cells.length === 81 &&
    game.cells.every(isValidCell) &&
    typeof game.elapsedSeconds === "number" &&
    typeof game.mistakes === "number" &&
    typeof game.hintsUsed === "number" &&
    Array.isArray(game.history) &&
    game.history.every(isValidHistoryEntry)
  );
}

function isValidSavedSession(session) {
  return (
    Boolean(session) &&
    isValidGame(session.game) &&
    Number.isInteger(session.selectedIndex) &&
    session.selectedIndex >= -1 &&
    session.selectedIndex < 81 &&
    typeof session.noteMode === "boolean"
  );
}

function loadCurrentGame(defaultGame, storageApi) {
  const fallbackSession = {
    game: defaultGame,
    selectedIndex: -1,
    noteMode: false
  };
  const savedSession = readStorage(STORAGE_KEYS.currentGame, null, storageApi);

  if (!isValidSavedSession(savedSession)) {
    return fallbackSession;
  }

  return savedSession;
}

function saveCurrentGame(session, storageApi) {
  return writeStorage(STORAGE_KEYS.currentGame, session, storageApi);
}

function loadSettings(storageApi) {
  const savedSettings = readStorage(STORAGE_KEYS.settings, null, storageApi);
  const preferredDifficulty = savedSettings &&
    typeof savedSettings.preferredDifficulty === "string"
    ? savedSettings.preferredDifficulty
    : "beginner";
  const language = savedSettings &&
    typeof savedSettings.language === "string"
    ? savedSettings.language
    : "zh-CN";

  return {
    preferredDifficulty: preferredDifficulty,
    language: language
  };
}

function saveSettings(settings, storageApi) {
  return writeStorage(STORAGE_KEYS.settings, settings, storageApi);
}

function isValidStats(stats) {
  return Boolean(stats) &&
    typeof stats.totalCompleted === "number" &&
    typeof stats.lastCompletedAt === "string" &&
    Boolean(stats.bestTimeByDifficulty) &&
    Boolean(stats.averageTimeByDifficulty) &&
    Boolean(stats.completionCountByDifficulty) &&
    Boolean(stats.totalTimeByDifficulty);
}

function loadStats(storageApi) {
  const savedStats = readStorage(STORAGE_KEYS.stats, null, storageApi);
  const emptyStats = createEmptyStats();

  if (!isValidStats(savedStats)) {
    return emptyStats;
  }

  return Object.assign(emptyStats, savedStats, {
    bestTimeByDifficulty: Object.assign(
      {},
      emptyStats.bestTimeByDifficulty,
      savedStats.bestTimeByDifficulty || {}
    ),
    averageTimeByDifficulty: Object.assign(
      {},
      emptyStats.averageTimeByDifficulty,
      savedStats.averageTimeByDifficulty || {}
    ),
    completionCountByDifficulty: Object.assign(
      {},
      emptyStats.completionCountByDifficulty,
      savedStats.completionCountByDifficulty || {}
    ),
    hintCountByDifficulty: Object.assign(
      {},
      emptyStats.hintCountByDifficulty,
      savedStats.hintCountByDifficulty || {}
    ),
    totalTimeByDifficulty: Object.assign(
      {},
      emptyStats.totalTimeByDifficulty,
      savedStats.totalTimeByDifficulty || {}
    )
  });
}

function saveStats(stats, storageApi) {
  return writeStorage(STORAGE_KEYS.stats, stats, storageApi);
}

module.exports = {
  STORAGE_KEYS,
  readStorage,
  writeStorage,
  loadCurrentGame,
  saveCurrentGame,
  loadSettings,
  saveSettings,
  loadStats,
  saveStats
};
