function isProDifficulty(difficulty) {
  return difficulty === "skilled" || difficulty === "expert";
}

function createSettingsScene(options) {
  const canvasWidth = options.canvasWidth || 375;
  const canvasHeight = options.canvasHeight || 812;
  const contentWidth = Math.min(canvasWidth - 40, 320);
  const contentLeft = Math.floor((canvasWidth - contentWidth) / 2);
  const headerTop = 92;
  const languageCardTop = 216;
  const languageCardHeight = 102;
  const infoCardHeight = 52;
  const infoGap = 14;
  const summaryTop = languageCardTop + languageCardHeight + 24;

  function getMetrics() {
    return {
      contentLeft: contentLeft,
      contentWidth: contentWidth,
      backLeft: contentLeft,
      backTop: headerTop,
      backWidth: 76,
      backHeight: 34,
      languageCardLeft: contentLeft,
      languageCardTop: languageCardTop,
      languageCardWidth: contentWidth,
      languageCardHeight: languageCardHeight,
      summaryTop: summaryTop,
      summaryCardWidth: contentWidth,
      summaryCardHeight: infoCardHeight,
      helperCardTop: summaryTop + infoCardHeight + infoGap
    };
  }

  function getVisualSpec(renderState) {
    const difficulty = renderState && renderState.selectedDifficulty
      ? renderState.selectedDifficulty
      : "beginner";

    if (isProDifficulty(difficulty)) {
      return {
        background: "#eef1ee",
        haloFill: "#dde5e3",
        panelFill: "#f7f4ee",
        headerWashFill: "#f2f5f2",
        titleColor: "#213039",
        bodyColor: "#526269",
        cardFill: "#faf8f2",
        cardBorder: "#c5cecd",
        cardAccent: "#dde3e1",
        accentText: "#2d4350",
        ornament: "#7f8d93",
        helperFill: "#95a3a8",
        dividerFill: "#8da0ab"
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
      ornament: "#c89256",
      helperFill: "#b58f72",
      dividerFill: "#c68e5f"
    };
  }

  function drawRoundedRectPath(context, left, top, width, height, radius) {
    if (typeof context.arcTo !== "function") {
      context.beginPath();
      context.moveTo(left, top);
      context.lineTo(left + width, top);
      context.lineTo(left + width, top + height);
      context.lineTo(left, top + height);
      context.lineTo(left, top);
      if (typeof context.closePath === "function") {
        context.closePath();
      }
      return;
    }

    const right = left + width;
    const bottom = top + height;
    const safeRadius = Math.min(radius, width / 2, height / 2);

    context.beginPath();
    context.moveTo(left + safeRadius, top);
    context.lineTo(right - safeRadius, top);
    context.arcTo(right, top, right, top + safeRadius, safeRadius);
    context.lineTo(right, bottom - safeRadius);
    context.arcTo(right, bottom, right - safeRadius, bottom, safeRadius);
    context.lineTo(left + safeRadius, bottom);
    context.arcTo(left, bottom, left, bottom - safeRadius, safeRadius);
    context.lineTo(left, top + safeRadius);
    context.arcTo(left, top, left + safeRadius, top, safeRadius);
    if (typeof context.closePath === "function") {
      context.closePath();
    }
  }

  function drawPlaque(context, left, top, width, height, label, visualSpec, font) {
    context.fillStyle = visualSpec.cardFill;
    drawRoundedRectPath(context, left, top, width, height, 18);
    if (typeof context.fill === "function") {
      context.fill();
    }

    context.lineWidth = 1.1;
    context.strokeStyle = visualSpec.cardBorder;
    drawRoundedRectPath(context, left, top, width, height, 18);
    if (typeof context.stroke === "function") {
      context.stroke();
    }

    context.lineWidth = 1;
    context.strokeStyle = visualSpec.ornament;
    context.beginPath();
    context.moveTo(left + 16, top + height / 2);
    context.lineTo(left + 30, top + height / 2);
    context.moveTo(left + width - 30, top + height / 2);
    context.lineTo(left + width - 16, top + height / 2);
    if (typeof context.stroke === "function") {
      context.stroke();
    }

    context.fillStyle = visualSpec.accentText;
    context.font = font || "bold 16px sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(label, left + width / 2, top + height / 2);
  }

  function drawInfoCard(context, left, top, width, height, text, visualSpec) {
    context.fillStyle = visualSpec.cardFill;
    drawRoundedRectPath(context, left, top, width, height, 16);
    if (typeof context.fill === "function") {
      context.fill();
    }

    context.lineWidth = 1;
    context.strokeStyle = visualSpec.cardBorder;
    drawRoundedRectPath(context, left, top, width, height, 16);
    if (typeof context.stroke === "function") {
      context.stroke();
    }

    context.fillStyle = visualSpec.bodyColor;
    context.font = "15px sans-serif";
    context.textAlign = "left";
    context.textBaseline = "middle";
    context.fillText(text, left + 18, top + height / 2);
  }

  function drawBackdrop(context, metrics, visualSpec) {
    context.fillStyle = visualSpec.background;
    context.fillRect(0, 0, canvasWidth, canvasHeight);

    context.fillStyle = visualSpec.haloFill;
    context.fillRect(22, 32, canvasWidth - 44, canvasHeight - 64);

    context.fillStyle = visualSpec.panelFill;
    context.fillRect(metrics.contentLeft - 14, 56, contentWidth + 28, 148);

    context.fillStyle = visualSpec.headerWashFill;
    context.fillRect(metrics.contentLeft + 4, 76, contentWidth - 8, 96);

    context.fillStyle = visualSpec.dividerFill;
    context.fillRect(metrics.contentLeft + 18, 92, 36, 2);
    context.fillRect(metrics.contentLeft + metrics.contentWidth - 54, 92, 36, 2);
  }

  function draw(context, renderState) {
    const metrics = getMetrics();
    const t = renderState && typeof renderState.t === "function"
      ? renderState.t
      : function (key) {
          return key;
        };
    const languageLabel = renderState && renderState.language === "en"
      ? t("settings.languageEn")
      : t("settings.languageZh");
    const difficulty = renderState && renderState.selectedDifficulty
      ? renderState.selectedDifficulty
      : "beginner";
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
      visualSpec,
      "15px sans-serif"
    );

    context.fillStyle = visualSpec.titleColor;
    context.font = "bold 28px sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(t("settings.pageTitle"), canvasWidth / 2, headerTop + 12);

    context.fillStyle = visualSpec.helperFill;
    context.font = "13px sans-serif";
    context.textAlign = "left";
    context.fillText(t("settings.languageLabel"), metrics.languageCardLeft, metrics.languageCardTop - 16);

    context.fillStyle = visualSpec.cardAccent;
    drawRoundedRectPath(
      context,
      metrics.languageCardLeft,
      metrics.languageCardTop,
      metrics.languageCardWidth,
      metrics.languageCardHeight,
      20
    );
    if (typeof context.fill === "function") {
      context.fill();
    }

    context.lineWidth = 1.2;
    context.strokeStyle = visualSpec.cardBorder;
    drawRoundedRectPath(
      context,
      metrics.languageCardLeft,
      metrics.languageCardTop,
      metrics.languageCardWidth,
      metrics.languageCardHeight,
      20
    );
    if (typeof context.stroke === "function") {
      context.stroke();
    }

    context.fillStyle = visualSpec.titleColor;
    context.font = "bold 24px sans-serif";
    context.textAlign = "center";
    context.fillText(t("settings.languageLabel"), canvasWidth / 2, metrics.languageCardTop + 34);

    context.fillStyle = visualSpec.bodyColor;
    context.font = "14px sans-serif";
    context.fillText(
      t("settings.languageSummary", {
        language: languageLabel
      }),
      canvasWidth / 2,
      metrics.languageCardTop + 68
    );

    drawInfoCard(
      context,
      metrics.contentLeft,
      metrics.summaryTop,
      metrics.summaryCardWidth,
      metrics.summaryCardHeight,
      t("settings.difficultySummary", {
        difficulty: t("difficulty." + difficulty)
      }),
      visualSpec
    );

    drawInfoCard(
      context,
      metrics.contentLeft,
      metrics.helperCardTop,
      metrics.summaryCardWidth,
      metrics.summaryCardHeight,
      t("settings.helper"),
      visualSpec
    );
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
      x >= metrics.languageCardLeft &&
      x <= metrics.languageCardLeft + metrics.languageCardWidth &&
      y >= metrics.languageCardTop &&
      y <= metrics.languageCardTop + metrics.languageCardHeight
    ) {
      return { type: "action", value: "language" };
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
  createSettingsScene: createSettingsScene
};
