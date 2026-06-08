const {
  drawRoundedRectPath,
  drawPlaque
} = require("../ui/panel-primitives");

function isProDifficulty(difficulty) {
  return difficulty === "skilled" || difficulty === "expert";
}

function createLanguageScene(options) {
  const canvasWidth = options.canvasWidth || 375;
  const canvasHeight = options.canvasHeight || 812;
  const contentWidth = Math.min(canvasWidth - 40, 320);
  const contentLeft = Math.floor((canvasWidth - contentWidth) / 2);
  const headerTop = 76;
  const panelTop = 130;
  const heroHeight = 92;
  const sectionTop = panelTop + heroHeight + 24;
  const optionTop = sectionTop + 30;
  const optionHeight = 72;
  const optionGap = 14;
  const footerTop = optionTop + optionHeight * 2 + optionGap + 18;

  function getMetrics() {
    return {
      contentLeft: contentLeft,
      contentWidth: contentWidth,
      backLeft: contentLeft,
      backTop: headerTop,
      backWidth: 76,
      backHeight: 34,
      optionLeft: contentLeft,
      optionTop: optionTop,
      optionWidth: contentWidth,
      optionHeight: optionHeight,
      optionGap: optionGap,
      sectionTop: sectionTop,
      footerTop: footerTop
    };
  }

  function getVisualSpec(renderState) {
    const difficulty = renderState && renderState.selectedDifficulty
      ? renderState.selectedDifficulty
      : "beginner";

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

  function drawOptionCard(context, left, top, width, height, title, selected, visualSpec) {
    context.fillStyle = selected ? visualSpec.cardAccent : visualSpec.cardFill;
    drawRoundedRectPath(context, left, top, width, height, 18);
    if (typeof context.fill === "function") {
      context.fill();
    }

    context.lineWidth = selected ? 1.4 : 1;
    context.strokeStyle = selected ? visualSpec.ornament : visualSpec.cardBorder;
    drawRoundedRectPath(context, left, top, width, height, 18);
    if (typeof context.stroke === "function") {
      context.stroke();
    }

    context.fillStyle = selected ? visualSpec.titleColor : visualSpec.accentText;
    context.font = selected ? "bold 18px sans-serif" : "17px sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(title, left + width / 2, top + height / 2);
  }

  function drawHeroPanel(context, metrics, visualSpec, t) {
    context.fillStyle = visualSpec.cardAccent;
    drawRoundedRectPath(context, metrics.contentLeft, panelTop, metrics.contentWidth, heroHeight, 22);
    if (typeof context.fill === "function") {
      context.fill();
    }

    context.lineWidth = 1.1;
    context.strokeStyle = visualSpec.cardBorder;
    drawRoundedRectPath(context, metrics.contentLeft, panelTop, metrics.contentWidth, heroHeight, 22);
    if (typeof context.stroke === "function") {
      context.stroke();
    }

    context.fillStyle = visualSpec.titleColor;
    context.font = "bold 28px sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(t("languagePage.title"), canvasWidth / 2, panelTop + 30);

    context.fillStyle = visualSpec.bodyColor;
    context.font = "13px sans-serif";
    context.fillText(t("languagePage.subtitle"), canvasWidth / 2, panelTop + 62);
  }

  function drawFooterCard(context, metrics, visualSpec, t) {
    context.fillStyle = visualSpec.cardFill;
    drawRoundedRectPath(context, metrics.optionLeft, metrics.footerTop, metrics.optionWidth, 54, 18);
    if (typeof context.fill === "function") {
      context.fill();
    }

    context.lineWidth = 1;
    context.strokeStyle = visualSpec.cardBorder;
    drawRoundedRectPath(context, metrics.optionLeft, metrics.footerTop, metrics.optionWidth, 54, 18);
    if (typeof context.stroke === "function") {
      context.stroke();
    }

    context.fillStyle = visualSpec.bodyColor;
    context.font = "13px sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(
      t("languagePage.applied"),
      canvasWidth / 2,
      metrics.footerTop + 27
    );
  }

  function drawBackdrop(context, metrics, visualSpec) {
    context.fillStyle = visualSpec.background;
    context.fillRect(0, 0, canvasWidth, canvasHeight);

    context.fillStyle = visualSpec.haloFill;
    context.fillRect(22, 32, canvasWidth - 44, canvasHeight - 64);

    context.fillStyle = visualSpec.panelFill;
    context.fillRect(metrics.optionLeft - 14, 56, contentWidth + 28, 148);

    context.fillStyle = visualSpec.headerWashFill;
    context.fillRect(metrics.optionLeft + 4, 76, contentWidth - 8, 96);
  }

  function draw(context, renderState) {
    const metrics = getMetrics();
    const t = renderState && typeof renderState.t === "function"
      ? renderState.t
      : function (key) {
          return key;
        };
    const language = renderState && renderState.language
      ? renderState.language
      : "zh-CN";
    const visualSpec = getVisualSpec(renderState);
    const backPlaqueWidth = 82;

    drawBackdrop(context, metrics, visualSpec);

    drawPlaque(
      context,
      metrics.backLeft,
      metrics.backTop,
      backPlaqueWidth,
      metrics.backHeight,
      t("common.back"),
      {
        fill: visualSpec.cardFill,
        border: visualSpec.cardBorder,
        ornament: visualSpec.ornament,
        textColor: visualSpec.accentText,
        font: "15px sans-serif",
        showOrnament: false
      }
    );

    drawHeroPanel(context, metrics, visualSpec, t);

    context.fillStyle = visualSpec.helperFill;
    context.font = "bold 15px sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(
      t("settings.languageLabel"),
      metrics.optionLeft + metrics.optionWidth / 2,
      metrics.sectionTop
    );

    drawOptionCard(
      context,
      metrics.optionLeft,
      metrics.optionTop,
      metrics.optionWidth,
      metrics.optionHeight,
      t("settings.languageZh"),
      language === "zh-CN",
      visualSpec
    );

    drawOptionCard(
      context,
      metrics.optionLeft,
      metrics.optionTop + metrics.optionHeight + metrics.optionGap,
      metrics.optionWidth,
      metrics.optionHeight,
      t("settings.languageEn"),
      language === "en",
      visualSpec
    );

    drawFooterCard(context, metrics, visualSpec, t);
  }

  function hitTest(x, y) {
    const metrics = getMetrics();

    if (
      x >= metrics.backLeft &&
      x <= metrics.backLeft + metrics.backWidth &&
      y >= metrics.backTop &&
      y <= metrics.backTop + metrics.backHeight
    ) {
      return { type: "action", value: "back" };
    }

    if (
      x >= metrics.optionLeft &&
      x <= metrics.optionLeft + metrics.optionWidth &&
      y >= metrics.optionTop &&
      y <= metrics.optionTop + metrics.optionHeight
    ) {
      return { type: "language", value: "zh-CN" };
    }

    if (
      x >= metrics.optionLeft &&
      x <= metrics.optionLeft + metrics.optionWidth &&
      y >= metrics.optionTop + metrics.optionHeight + metrics.optionGap &&
      y <= metrics.optionTop + metrics.optionHeight * 2 + metrics.optionGap
    ) {
      return { type: "language", value: "en" };
    }

    return null;
  }

  return {
    draw: draw,
    hitTest: hitTest,
    getMetrics: getMetrics
  };
}

module.exports = {
  createLanguageScene: createLanguageScene
};
