const {
  drawRoundedRectPath,
  drawPlaque
} = require("../ui/panel-primitives");

function isProDifficulty(difficulty) {
  return difficulty === "skilled" || difficulty === "expert";
}

function getFontSize(font) {
  const match = /(\d+)px/.exec(font || "");
  return match ? Number(match[1]) : 13;
}

function measureTextWidth(context, text) {
  if (context && typeof context.measureText === "function") {
    return context.measureText(text).width;
  }

  return String(text || "").length * getFontSize(context && context.font) * 0.56;
}

function drawWrappedText(context, text, left, top, maxWidth, lineHeight, maxLines) {
  const words = String(text || "").split(" ");
  const lines = [];
  let currentLine = "";

  for (let index = 0; index < words.length; index += 1) {
    const word = words[index];
    const nextLine = currentLine ? currentLine + " " + word : word;

    if (measureTextWidth(context, nextLine) <= maxWidth || !currentLine) {
      currentLine = nextLine;
      continue;
    }

    lines.push(currentLine);
    currentLine = word;

    if (maxLines && lines.length === maxLines - 1) {
      break;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  const visibleLines = maxLines ? lines.slice(0, maxLines) : lines;

  visibleLines.forEach(function (line, lineIndex) {
    context.fillText(line, left, top + lineHeight * lineIndex);
  });
}

function createSettingsScene(options) {
  const canvasWidth = options.canvasWidth || 375;
  const canvasHeight = options.canvasHeight || 812;
  const contentWidth = Math.min(canvasWidth - 40, 320);
  const contentLeft = Math.floor((canvasWidth - contentWidth) / 2);
  const headerTop = 76;
  const panelTop = 130;
  const heroHeight = 92;
  const sectionGap = 32;
  const sectionTitleToCardGap = 20;
  const metaGap = 20;
  const languageSectionTop = panelTop + heroHeight + sectionGap;
  const languageCardTop = languageSectionTop + sectionTitleToCardGap;
  const languageCardHeight = 96;
  const difficultySectionTop = languageCardTop + languageCardHeight + sectionGap;
  const difficultyMetaTop = difficultySectionTop + metaGap;
  const difficultyCardGap = 12;
  const difficultyCardHeight = 74;
  const difficultyCardWidth = Math.floor((contentWidth - difficultyCardGap) / 2);
  const difficultyCardsTop = difficultyMetaTop + metaGap;
  const helperCardTop = difficultyCardsTop + difficultyCardHeight * 2 + difficultyCardGap + 24;
  const helperCardHeight = 62;

  function getMetrics() {
    return {
      contentLeft: contentLeft,
      contentWidth: contentWidth,
      backLeft: contentLeft,
      backTop: headerTop,
      backWidth: 76,
      backHeight: 34,
      languageCardLeft: contentLeft,
      languageSectionTop: languageSectionTop,
      languageCardTop: languageCardTop,
      languageCardWidth: contentWidth,
      languageCardHeight: languageCardHeight,
      difficultyCardLeft: contentLeft,
      difficultySectionTop: difficultySectionTop,
      difficultyCardTop: difficultyCardsTop,
      difficultyMetaTop: difficultyMetaTop,
      difficultyCardWidth: difficultyCardWidth,
      difficultyCardHeight: difficultyCardHeight,
      difficultyCardGap: difficultyCardGap,
      difficultySecondRowTop: difficultyCardsTop + difficultyCardHeight + difficultyCardGap,
      helperCardTop: helperCardTop,
      helperCardHeight: helperCardHeight
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
        accentSoftText: "#6e7974",
        ornament: "#6f817a",
        helperFill: "#8c9790",
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
      accentSoftText: "#8d6c65",
      ornament: "#c89256",
      helperFill: "#b58f72",
      dividerFill: "#c68e5f"
    };
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

  function drawParagraphCard(context, left, top, width, height, text, visualSpec) {
    context.fillStyle = visualSpec.cardFill;
    drawRoundedRectPath(context, left, top, width, height, 18);
    if (typeof context.fill === "function") {
      context.fill();
    }

    context.lineWidth = 1;
    context.strokeStyle = visualSpec.cardBorder;
    drawRoundedRectPath(context, left, top, width, height, 18);
    if (typeof context.stroke === "function") {
      context.stroke();
    }

    context.fillStyle = visualSpec.bodyColor;
    context.font = "13px sans-serif";
    context.textAlign = "left";
    context.textBaseline = "middle";
    context.fillText(text, left + 14, top + height / 2);
  }

  function drawTopline(context, metrics, visualSpec, t) {
    const backPlaqueWidth = 82;

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
  }

  function drawHeroPanel(context, metrics, visualSpec, t) {
    const isEnglish = t("common.back") === "Back";

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
    context.fillText(t("settings.pageTitle"), canvasWidth / 2, panelTop + 30);

    context.fillStyle = visualSpec.bodyColor;
    context.font = isEnglish ? "12px sans-serif" : "13px sans-serif";
    context.fillText(t("settings.subtitle"), canvasWidth / 2, panelTop + 62);
  }

  function drawLanguageCard(context, metrics, visualSpec, renderState, t) {
    const languageLabel = renderState && renderState.language === "en"
      ? t("settings.languageEn")
      : t("settings.languageZh");
    const isEnglish = renderState && renderState.language === "en";
    const sectionLabelY = metrics.languageSectionTop;
    const languageValueY = metrics.languageCardTop + (isEnglish ? 34 : 30);
    const actionTop = metrics.languageCardTop + (isEnglish ? 18 : 14);
    const hintY = metrics.languageCardTop + (isEnglish ? 68 : 64);

    context.fillStyle = visualSpec.helperFill;
    context.font = "bold 15px sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(
      t("settings.languageLabel"),
      metrics.languageCardLeft + metrics.languageCardWidth / 2,
      sectionLabelY
    );

    context.fillStyle = visualSpec.cardFill;
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

    context.lineWidth = 1.1;
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
    context.font = "bold 22px sans-serif";
    context.textAlign = "left";
    context.textBaseline = "middle";
    context.fillText(languageLabel, metrics.languageCardLeft + 16, languageValueY);

    drawPlaque(
      context,
      metrics.languageCardLeft + metrics.languageCardWidth - (isEnglish ? 92 : 84),
      actionTop,
      isEnglish ? 76 : 68,
      28,
      t("settings.languageAction"),
      {
        fill: visualSpec.cardFill,
        border: visualSpec.cardBorder,
        ornament: visualSpec.ornament,
        textColor: visualSpec.accentText,
        font: "12px sans-serif",
        showOrnament: false
      }
    );

    context.fillStyle = visualSpec.bodyColor;
    context.font = isEnglish ? "12px sans-serif" : "13px sans-serif";
    context.textAlign = "left";
    context.textBaseline = "middle";
    context.fillText(t("settings.languageHint"), metrics.languageCardLeft + 16, hintY);
  }

  function drawDifficultyCard(context, left, top, width, height, label, hint, active, visualSpec) {
    context.fillStyle = active ? visualSpec.cardAccent : visualSpec.cardFill;
    drawRoundedRectPath(context, left, top, width, height, 18);
    if (typeof context.fill === "function") {
      context.fill();
    }

    context.lineWidth = active ? 1.4 : 1;
    context.strokeStyle = active ? visualSpec.ornament : visualSpec.cardBorder;
    drawRoundedRectPath(context, left, top, width, height, 18);
    if (typeof context.stroke === "function") {
      context.stroke();
    }

    context.fillStyle = active ? visualSpec.accentText : visualSpec.titleColor;
    context.font = "bold 15px sans-serif";
    context.textAlign = "left";
    context.textBaseline = "middle";
    context.fillText(label, left + 12, top + 24);

    context.fillStyle = visualSpec.accentSoftText;
    context.font = measureTextWidth({ font: "10px sans-serif" }, hint) > width - 24
      ? "9px sans-serif"
      : "10px sans-serif";
    context.fillText(hint, left + 12, top + 46);
  }

  function drawDifficultyCards(context, metrics, visualSpec, renderState, t) {
    const difficulty = renderState && renderState.selectedDifficulty
      ? renderState.selectedDifficulty
      : "beginner";
    const cards = [
      {
        value: "beginner",
        left: metrics.difficultyCardLeft,
        top: metrics.difficultyCardTop,
        hint: t("settings.difficultyBeginnerHint")
      },
      {
        value: "intermediate",
        left: metrics.difficultyCardLeft + metrics.difficultyCardWidth + metrics.difficultyCardGap,
        top: metrics.difficultyCardTop,
        hint: t("settings.difficultyIntermediateHint")
      },
      {
        value: "skilled",
        left: metrics.difficultyCardLeft,
        top: metrics.difficultySecondRowTop,
        hint: t("settings.difficultySkilledHint")
      },
      {
        value: "expert",
        left: metrics.difficultyCardLeft + metrics.difficultyCardWidth + metrics.difficultyCardGap,
        top: metrics.difficultySecondRowTop,
        hint: t("settings.difficultyExpertHint")
      }
    ];

    context.fillStyle = visualSpec.helperFill;
    context.font = "bold 15px sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(
      t("settings.difficultyLabel"),
      metrics.difficultyCardLeft + metrics.contentWidth / 2,
      metrics.difficultySectionTop
    );

    context.fillStyle = visualSpec.accentSoftText;
    context.font = "13px sans-serif";
    context.fillText(
      t("settings.difficultyCurrent", {
        difficulty: t("difficulty." + difficulty)
      }),
      metrics.difficultyCardLeft + metrics.contentWidth / 2,
      metrics.difficultyMetaTop
    );

    cards.forEach(function (card) {
      drawDifficultyCard(
        context,
        card.left,
        card.top,
        metrics.difficultyCardWidth,
        metrics.difficultyCardHeight,
        t("difficulty." + card.value),
        card.hint,
        difficulty === card.value,
        visualSpec
      );
    });
  }

  function drawHelperCards(context, metrics, visualSpec, renderState, t) {
    const helperText = t("settings.helperFuture");
    const isEnglish = renderState && renderState.language === "en";

    context.fillStyle = visualSpec.cardFill;
    drawRoundedRectPath(context, metrics.contentLeft, metrics.helperCardTop, metrics.contentWidth, metrics.helperCardHeight, 18);
    if (typeof context.fill === "function") {
      context.fill();
    }

    context.lineWidth = 1;
    context.strokeStyle = visualSpec.cardBorder;
    drawRoundedRectPath(context, metrics.contentLeft, metrics.helperCardTop, metrics.contentWidth, metrics.helperCardHeight, 18);
    if (typeof context.stroke === "function") {
      context.stroke();
    }

    context.fillStyle = visualSpec.bodyColor;
    context.font = isEnglish ? "12px sans-serif" : "13px sans-serif";
    context.textAlign = "left";
    context.textBaseline = "middle";

    if (isEnglish) {
      drawWrappedText(
        context,
        helperText,
        metrics.contentLeft + 14,
        metrics.helperCardTop + 23,
        metrics.contentWidth - 28,
        15,
        2
      );
      return;
    }

    context.fillText(helperText, metrics.contentLeft + 14, metrics.helperCardTop + metrics.helperCardHeight / 2);
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

  }

  function draw(context, renderState) {
    const metrics = getMetrics();
    const t = renderState && typeof renderState.t === "function"
      ? renderState.t
      : function (key) {
          return key;
        };
    const visualSpec = getVisualSpec(renderState);

    drawBackdrop(context, metrics, visualSpec);
    drawTopline(context, metrics, visualSpec, t);
    drawHeroPanel(context, metrics, visualSpec, t);
    drawLanguageCard(context, metrics, visualSpec, renderState, t);
    drawDifficultyCards(context, metrics, visualSpec, renderState, t);
    drawHelperCards(context, metrics, visualSpec, renderState, t);
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

    const difficultyActions = [
      { value: "beginner", left: metrics.difficultyCardLeft, top: metrics.difficultyCardTop },
      {
        value: "intermediate",
        left: metrics.difficultyCardLeft + metrics.difficultyCardWidth + metrics.difficultyCardGap,
        top: metrics.difficultyCardTop
      },
      { value: "skilled", left: metrics.difficultyCardLeft, top: metrics.difficultySecondRowTop },
      {
        value: "expert",
        left: metrics.difficultyCardLeft + metrics.difficultyCardWidth + metrics.difficultyCardGap,
        top: metrics.difficultySecondRowTop
      }
    ];

    for (let index = 0; index < difficultyActions.length; index += 1) {
      const action = difficultyActions[index];

      if (
        x >= action.left &&
        x <= action.left + metrics.difficultyCardWidth &&
        y >= action.top &&
        y <= action.top + metrics.difficultyCardHeight
      ) {
        return { type: "difficulty", value: action.value };
      }
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
