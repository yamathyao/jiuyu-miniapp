const STORAGE_KEYS = {
  settings: "jiuyu.settings",
  currentGame: "jiuyu.currentGame",
  stats: "jiuyu.stats"
};

function readStorage(key, fallbackValue) {
  const value = wx.getStorageSync(key);
  return value || fallbackValue;
}

function writeStorage(key, value) {
  wx.setStorageSync(key, value);
}

module.exports = {
  STORAGE_KEYS,
  readStorage,
  writeStorage
};

