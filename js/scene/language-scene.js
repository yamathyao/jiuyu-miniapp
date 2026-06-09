const {
  drawRoundedRectPath,
  drawPlaque
} = require("../ui/panel-primitives");
const {
  createSharedScenePalette,
  isProDifficulty
} = require("../ui/scene-visual-spec");

function createLanguageScene(options) {
  const canvasWidth = options.canvasWidth || 375;
  const canvasHeight = options.canvasHeight || 812;
  const contentWidth = Math.min(canvasWidth - 40, 320);
  const contentLeft = Math.floor((canvasWidth - contentWidth) / 2);
  const shellTop = 112;
  const shellHeight = 356;
  const headerTop = shellTop + 18;
  const sectionTop = shellTop + 114;
  const optionTop = sectionTop + 14;
  const optionHeight = 56;
  const optionGap = 12;
  const optionWidth = 248;
  const optionLeft = Math.floor((canvasWidth - optionWidth) / 2);
  const footerTop = optionTop + optionHeight * 2 + optionGap + 20;

  function getMetrics() {
    return {
      contentLeft: contentLeft,
      contentWidth: contentWidth,
      shellTop: shellTop,
      shellHeight: shellHeight,
      headerTop: headerTop,
      optionLeft: optionLeft,
      optionTop: optionTop,
      optionWidth: optionWidth,
      optionHeight: optionHeight,
      optionGap: optionGap,
      sectionTop: sectionTop,
      footerTop: footerTop,
      shellLeft: contentLeft,
      shellRight: contentLeft + contentWidth,
      shellBottom: shellTop + shellHeight
    };
  }

  function getVisualSpec(renderState) {
    const difficulty = renderState && renderState.selectedDifficulty
      ? renderState.selectedDifficulty
      : "beginner";
    const isPro = isProDifficulty(difficulty);
    const palette = createSharedScenePalette(difficulty);

    return Object.assign({}, palette, {
      overlayMask: isPro ? "rgba(39, 43, 41, 0.34)" : "rgba(71, 53, 41, 0.3)",
      overlayShellFill: isPro ? "#d7d1c7" : "#e7d9c7",
      overlayPanelFill: isPro ? "#c6c0b6" : "#d8c2aa",
      overlayHeaderWashFill: isPro ? "#ece7df" : "#f3e9dd",
      overlayHeroFill: isPro ? "#c9c4bc" : "#dcc5ab",
      overlayBorder: isPro ? "#8f867b" : "#a88c72",
      overlayOptionFill: isPro ? "#f0ebe4" : "#f7efe4",
      overlayOptionShadow: isPro ? "rgba(61, 58, 52, 0.16)" : "rgba(113, 87, 64, 0.14)"
    });
  }

  function drawOptionCard(context, left, top, width, height, title, selected, visualSpec) {
    context.fillStyle = visualSpec.overlayOptionShadow;
    drawRoundedRectPath(context, left, top + 3, width, height, 16);
    if (typeof context.fill === "function") {
      context.fill();
    }

    context.fillStyle = selected ? visualSpec.cardAccent : visualSpec.overlayOptionFill;
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
    context.font = selected ? "bold 17px sans-serif" : "16px sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(title, left + width / 2, top + height / 2);
  }

  function drawShell(context, metrics, visualSpec) {
    context.fillStyle = visualSpec.overlayShellFill;
    drawRoundedRectPath(context, metrics.contentLeft, metrics.shellTop, metrics.contentWidth, metrics.shellHeight, 28);
    if (typeof context.fill === "function") {
      context.fill();
    }

    context.lineWidth = 1.1;
    context.strokeStyle = visualSpec.overlayBorder;
    drawRoundedRectPath(context, metrics.contentLeft, metrics.shellTop, metrics.contentWidth, metrics.shellHeight, 28);
    if (typeof context.stroke === "function") {
      context.stroke();
    }
  }

  function drawHeader(context, metrics, visualSpec, t) {
    context.fillStyle = visualSpec.titleColor;
    context.font = "bold 26px sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(t("languagePage.title"), canvasWidth / 2, metrics.shellTop + 44);

    context.fillStyle = visualSpec.bodyColor;
    context.font = "13px sans-serif";
    context.fillText(t("languagePage.subtitle"), canvasWidth / 2, metrics.shellTop + 76);
  }

  function drawFooterCard(context, metrics, visualSpec, t) {
    context.fillStyle = visualSpec.overlayHeaderWashFill;
    drawRoundedRectPath(context, metrics.optionLeft + 16, metrics.footerTop, metrics.optionWidth - 32, 46, 16);
    if (typeof context.fill === "function") {
      context.fill();
    }

    context.lineWidth = 1;
    context.strokeStyle = visualSpec.cardBorder;
    drawRoundedRectPath(context, metrics.optionLeft + 16, metrics.footerTop, metrics.optionWidth - 32, 46, 16);
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
      metrics.footerTop + 23
    );
  }

  function drawBackdrop(context, metrics, visualSpec) {
    context.fillStyle = visualSpec.overlayMask;
    context.fillRect(0, 0, canvasWidth, canvasHeight);
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
    drawBackdrop(context, metrics, visualSpec);
    drawShell(context, metrics, visualSpec);

    drawHeader(context, metrics, visualSpec, t);

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
    getMetrics: getMetrics,
    getVisualSpec: getVisualSpec
  };
}

module.exports = {
  createLanguageScene: createLanguageScene
};
