function getNextHint() {
  return {
    level: "direction",
    technique: "naked-single",
    message: "先观察候选数最少的格子。"
  };
}

module.exports = {
  getNextHint
};

