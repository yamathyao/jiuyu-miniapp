const PLAYFUL_THEME = {
  tone: "playful",
  background: "#f9f1e4",
  boardBase: "#fffaf2",
  selected: "#f7c6d9",
  related: "#f7ebc7",
  sameValue: "#dff4e8",
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
  background: "#f1f3f2",
  boardBase: "#fbfbf8",
  selected: "#b7d7f0",
  related: "#eef2f5",
  sameValue: "#dce8f2",
  toolFill: "#e7edf2",
  toolText: "#23313f",
  activeToolFill: "#34526b",
  activeToolText: "#ffffff",
  feedbackFill: "#e9eef3",
  feedbackText: "#304252",
  issueFill: "#f0d5d5",
  buttonHighlight: "#f9fbfc",
  buttonShadow: "#94a0a8",
  buttonDepth: "sharp",
  surfaceTint: "#f7f8f4",
  ornament: "#5a6b73"
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
