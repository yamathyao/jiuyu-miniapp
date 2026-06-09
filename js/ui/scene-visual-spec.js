function isProDifficulty(difficulty) {
  return difficulty === "skilled" || difficulty === "expert";
}

function createSharedScenePalette(difficulty) {
  if (isProDifficulty(difficulty)) {
    return {
      background: "#f2f1ea",
      haloFill: "#e4e1d7",
      panelFill: "#f4f1e8",
      headerWashFill: "#ece9df",
      titleColor: "#314541",
      bodyColor: "#65716d",
      cardFill: "#fbfaf5",
      cardBorder: "#c8c6ba",
      cardAccent: "#dde4dc",
      accentText: "#39504b",
      helperFill: "#8c9790",
      ornament: "#6f817a",
      dividerFill: "#99a198"
    };
  }

  return {
    background: "#f9efe3",
    haloFill: "#f5e5d1",
    panelFill: "#f8ead7",
    headerWashFill: "#fbf1e4",
    titleColor: "#6b3e42",
    bodyColor: "#8f6d65",
    cardFill: "#fff8ef",
    cardBorder: "#e0bda4",
    cardAccent: "#f5e4d5",
    accentText: "#7a4d4f",
    helperFill: "#b58f72",
    ornament: "#c89256",
    dividerFill: "#c68e5f"
  };
}

module.exports = {
  isProDifficulty: isProDifficulty,
  createSharedScenePalette: createSharedScenePalette
};
