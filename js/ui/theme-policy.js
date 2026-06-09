const PLAYFUL_THEME = {
  tone: "playful",
  background: "#f9f1e4",
  boardBase: "#fffaf2",
  selected: "#f7c6d9",
  related: "#f7ebc7",
  sameValue: "#dff4e8",
  hintRelated: "#f1e6c8",
  toolFill: "#f8decb",
  toolText: "#7a3650",
  activeToolFill: "#f08ab0",
  activeToolText: "#ffffff",
  feedbackFill: "#fff1c7",
  feedbackText: "#6f4e1f",
  issueFill: "#ffd7d7",
  buttonHighlight: "#fff4f8",
  buttonShadow: "#c98b6f",
  buttonDepth: "soft",
  surfaceTint: "#fff7eb",
  ornament: "#d9a65a"
};

const PRO_THEME = {
  tone: "pro",
  background: "#f2f1ea",
  boardBase: "#fbfaf5",
  selected: "#bfd5d0",
  related: "#ece8de",
  sameValue: "#dce5df",
  hintRelated: "#e4e0d4",
  toolFill: "#e6e0d6",
  toolText: "#2f403c",
  activeToolFill: "#556c67",
  activeToolText: "#ffffff",
  feedbackFill: "#ece8de",
  feedbackText: "#43524d",
  issueFill: "#ead8d2",
  buttonHighlight: "#fcfbf7",
  buttonShadow: "#8d9187",
  buttonDepth: "sharp",
  surfaceTint: "#f5f3eb",
  ornament: "#647670"
};

function getThemeByDifficulty(difficulty) {
  if (difficulty === "skilled" || difficulty === "expert") {
    return PRO_THEME;
  }

  return PLAYFUL_THEME;
}

module.exports = {
  getThemeByDifficulty
};
