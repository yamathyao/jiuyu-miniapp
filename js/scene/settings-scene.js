const {
  drawRoundedRectPath,
  drawPlaque
} = require("../ui/panel-primitives");
const {
  createSharedScenePalette,
  isProDifficulty
} = require("../ui/scene-visual-spec");

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

function withAlpha(context, alpha, draw) {
  const previous = typeof context.globalAlpha === "number" ? context.globalAlpha : 1;
  context.globalAlpha = alpha;
  draw();
  context.globalAlpha = previous;
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
  const verticalOffset = options.verticalOffset != null ? options.verticalOffset : 32;
  const contentWidth = Math.min(canvasWidth - 40, 320);
  const contentLeft = Math.floor((canvasWidth - contentWidth) / 2);
  const headerTop = 76 + verticalOffset;
  const panelTop = 130 + verticalOffset;
  const heroHeight = 92;
  const sectionGap = 28;
  const sectionTitleToCardGap = 22;
  const metaGap = 20;
  const languageSectionTop = panelTop + heroHeight + sectionGap;
  const languageCardTop = languageSectionTop + sectionTitleToCardGap;
  const languageCardHeight = 94;
  const resumeCardHeight = 80;
  const restartCardHeight = 80;
  const difficultyCardGap = 12;
  const difficultyCardHeight = 74;
  const difficultyCardWidth = Math.floor((contentWidth - difficultyCardGap) / 2);
  const helperCardHeight = 62;

  function getMetrics(renderState) {
    const t = renderState && typeof renderState.t === "function"
      ? renderState.t
      : function (key) {
          return key;
        };
    const isEnglish = t("common.back") === "Back";
    const showResumeCard = Boolean(renderState && renderState.showResumeAction);
    const resumeCardTop = languageCardTop + languageCardHeight + 20;
    const restartCardTop = resumeCardTop + (showResumeCard ? resumeCardHeight + 14 : 0);
    const difficultySectionTop = restartCardTop + restartCardHeight + sectionGap;
    const difficultyMetaTop = difficultySectionTop + metaGap;
    const difficultyCardsTop = difficultyMetaTop + metaGap;
    const helperCardTop = difficultyCardsTop + difficultyCardHeight * 2 + difficultyCardGap + 24;
    const helperCardBodyTop = helperCardTop + (isEnglish ? 21 : helperCardHeight / 2);

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
      resumeCardTop: resumeCardTop,
      resumeCardHeight: resumeCardHeight,
      restartCardTop: restartCardTop,
      restartCardHeight: restartCardHeight,
      difficultyCardLeft: contentLeft,
      difficultySectionTop: difficultySectionTop,
      difficultyCardTop: difficultyCardsTop,
      difficultyMetaTop: difficultyMetaTop,
      difficultyCardWidth: difficultyCardWidth,
      difficultyCardHeight: difficultyCardHeight,
      difficultyCardGap: difficultyCardGap,
      difficultySecondRowTop: difficultyCardsTop + difficultyCardHeight + difficultyCardGap,
      helperCardTop: helperCardTop,
      helperCardHeight: helperCardHeight,
      helperCardBodyTop: helperCardBodyTop
    };
  }

  function getVisualSpec(renderState) {
    const difficulty = renderState && renderState.selectedDifficulty
      ? renderState.selectedDifficulty
      : "beginner";
    const palette = createSharedScenePalette(difficulty);

    return Object.assign({}, palette, {
      accentSoftText: isProDifficulty(difficulty) ? "#6e7974" : "#8d6c65"
    });
  }

  function drawTopline(context, metrics, visualSpec, t, renderState) {
    const backLabel = renderState && renderState.backLabel
      ? renderState.backLabel
      : t("common.back");

    drawPlaque(
      context,
      metrics.backLeft,
      metrics.backTop,
      82,
      metrics.backHeight,
      backLabel,
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

  function drawActionButtonBlock(context, left, top, width, height, visualSpec, options) {
    const primaryText = options.primaryText;
    const secondaryText = options.secondaryText;
    const eyebrowText = options.eyebrowText;
    const align = options.align || "left";
    const accent = Boolean(options.accent);
    const disabled = Boolean(options.disabled);
    const radius = options.radius || 20;
    const lift = accent ? 5 : 4;
    const centerX = left + width / 2;
    const textLeft = left + 18;
    const primaryY = options.primaryY || (top + (secondaryText ? 38 : height / 2));
    const secondaryY = options.secondaryY || (top + height - 24);
    const shadowFill = disabled
      ? "rgba(128, 128, 128, 0.10)"
      : (accent ? "rgba(107, 79, 59, 0.22)" : "rgba(118, 95, 84, 0.16)");
    const baseFill = disabled
      ? "rgba(242, 239, 233, 0.92)"
      : (accent ? visualSpec.cardAccent : visualSpec.cardFill);
    const borderFill = disabled
      ? "rgba(162, 158, 150, 0.72)"
      : (accent ? visualSpec.ornament : visualSpec.cardBorder);
    const insetFill = disabled
      ? "rgba(255, 255, 255, 0.16)"
      : (accent ? "rgba(255, 246, 236, 0.18)" : "rgba(255, 255, 255, 0.24)");
    const floorFill = disabled
      ? "rgba(160, 160, 160, 0.08)"
      : (accent ? "rgba(122, 84, 55, 0.12)" : "rgba(136, 112, 98, 0.1)");
    const eyebrowFill = disabled
      ? visualSpec.accentSoftText
      : (accent ? visualSpec.accentText : visualSpec.accentSoftText);
    const primaryFill = disabled
      ? visualSpec.accentSoftText
      : (accent ? visualSpec.accentText : visualSpec.titleColor);
    const secondaryFill = disabled
      ? visualSpec.accentSoftText
      : (accent ? visualSpec.accentText : visualSpec.bodyColor);

    context.fillStyle = shadowFill;
    drawRoundedRectPath(context, left, top + lift, width, height, radius);
    if (typeof context.fill === "function") {
      context.fill();
    }

    context.fillStyle = baseFill;
    drawRoundedRectPath(context, left, top, width, height, radius);
    if (typeof context.fill === "function") {
      context.fill();
    }

    context.lineWidth = accent ? 1.3 : 1.1;
    context.strokeStyle = borderFill;
    drawRoundedRectPath(context, left, top, width, height, radius);
    if (typeof context.stroke === "function") {
      context.stroke();
    }

    context.lineWidth = 1;
    context.strokeStyle = accent ? "rgba(255, 248, 240, 0.68)" : "rgba(255, 255, 255, 0.7)";
    drawRoundedRectPath(context, left + 1.5, top + 1.5, width - 3, height - 7, Math.max(12, radius - 4));
    if (typeof context.stroke === "function") {
      context.stroke();
    }

    context.fillStyle = insetFill;
    drawRoundedRectPath(context, left + 8, top + 8, width - 16, 18, 10);
    if (typeof context.fill === "function") {
      context.fill();
    }

    context.fillStyle = floorFill;
    drawRoundedRectPath(context, left + 10, top + height - 20, width - 20, 8, 4);
    if (typeof context.fill === "function") {
      context.fill();
    }

    if (eyebrowText) {
      context.fillStyle = eyebrowFill;
      context.font = "12px sans-serif";
      context.textAlign = align;
      context.textBaseline = "middle";
      context.fillText(eyebrowText, align === "center" ? centerX : textLeft, top + 22);
    }

    context.fillStyle = primaryFill;
    context.font = secondaryText ? "bold 22px sans-serif" : "bold 18px sans-serif";
    context.textAlign = align;
    context.textBaseline = "middle";
    context.fillText(primaryText, align === "center" ? centerX : textLeft, primaryY);

    if (!secondaryText) {
      return;
    }

    context.fillStyle = secondaryFill;
    context.font = "12px sans-serif";
    context.textAlign = align;
    context.textBaseline = "middle";
    context.fillText(secondaryText, align === "center" ? centerX : textLeft, secondaryY);
  }

  function drawLanguageCard(context, metrics, visualSpec, renderState, t) {
    const language = renderState && renderState.language
      ? renderState.language
      : "zh-CN";
    const languageLabel = language === "en"
      ? t("settings.languageEn")
      : language === "ja"
        ? t("settings.languageJa")
        : t("settings.languageZh");

    context.fillStyle = visualSpec.helperFill;
    context.font = "bold 15px sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(
      t("settings.languageLabel"),
      metrics.languageCardLeft + metrics.languageCardWidth / 2,
      metrics.languageSectionTop
    );

    drawActionButtonBlock(
      context,
      metrics.languageCardLeft,
      metrics.languageCardTop,
      metrics.languageCardWidth,
      metrics.languageCardHeight,
      visualSpec,
      {
        primaryText: languageLabel,
        secondaryText: t("settings.languageHint")
      }
    );
  }

  function drawDifficultyCard(context, left, top, width, height, label, hint, active, visualSpec, disabled) {
    context.fillStyle = disabled
      ? "rgba(242, 239, 233, 0.94)"
      : (active ? visualSpec.cardAccent : visualSpec.cardFill);
    drawRoundedRectPath(context, left, top, width, height, 18);
    if (typeof context.fill === "function") {
      context.fill();
    }

    context.lineWidth = active ? 1.4 : 1;
    context.strokeStyle = disabled
      ? "rgba(162, 158, 150, 0.72)"
      : (active ? visualSpec.ornament : visualSpec.cardBorder);
    drawRoundedRectPath(context, left, top, width, height, 18);
    if (typeof context.stroke === "function") {
      context.stroke();
    }

    context.fillStyle = disabled
      ? visualSpec.accentSoftText
      : (active ? visualSpec.accentText : visualSpec.titleColor);
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

  function drawRestartCard(context, metrics, visualSpec, renderState, t) {
    const examLocked = Boolean(renderState && renderState.examSettingsRestricted);

    drawActionButtonBlock(
      context,
      metrics.contentLeft,
      metrics.restartCardTop,
      metrics.contentWidth,
      metrics.restartCardHeight,
      visualSpec,
      {
        primaryText: examLocked ? t("settings.exitExamLabel") : t("settings.restartLabel"),
        secondaryText: examLocked ? t("settings.exitExamHint") : t("settings.restartHint"),
        accent: true,
        primaryY: metrics.restartCardTop + 30,
        secondaryY: metrics.restartCardTop + 58
      }
    );
  }

  function drawResumeCard(context, metrics, visualSpec, renderState, t) {
    if (!renderState || !renderState.showResumeAction) {
      return;
    }

    drawActionButtonBlock(
      context,
      metrics.contentLeft,
      metrics.resumeCardTop,
      metrics.contentWidth,
      metrics.resumeCardHeight,
      visualSpec,
      {
        primaryText: t("settings.resumeGameLabel"),
        secondaryText: t("settings.resumeGameHint"),
        accent: false,
        primaryY: metrics.resumeCardTop + 30,
        secondaryY: metrics.resumeCardTop + 58
      }
    );
  }

  function drawDifficultyCards(context, metrics, visualSpec, renderState, t) {
    const difficulty = renderState && renderState.selectedDifficulty
      ? renderState.selectedDifficulty
      : "beginner";
    const examLocked = Boolean(renderState && renderState.examSettingsRestricted);
    const difficultyStates = renderState && renderState.difficultyStates
      ? renderState.difficultyStates
      : {};
    const sectionAlpha = examLocked ? 0.64 : 1;
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

    withAlpha(context, sectionAlpha, function () {
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
        examLocked
          ? t("settings.examLockedHint")
          : t("settings.difficultyCurrent", {
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
          visualSpec,
          examLocked || (difficultyStates[card.value] && difficultyStates[card.value].unlocked === false)
        );
      });
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
        metrics.helperCardBodyTop,
        metrics.contentWidth - 28,
        15,
        2
      );
      return;
    }

    context.fillText(helperText, metrics.contentLeft + 14, metrics.helperCardBodyTop);
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
    const metrics = getMetrics(renderState);
    const t = renderState && typeof renderState.t === "function"
      ? renderState.t
      : function (key) {
          return key;
        };
    const visualSpec = getVisualSpec(renderState);

    drawBackdrop(context, metrics, visualSpec);
    drawTopline(context, metrics, visualSpec, t, renderState);
    drawHeroPanel(context, metrics, visualSpec, t);
    drawLanguageCard(context, metrics, visualSpec, renderState, t);
    drawResumeCard(context, metrics, visualSpec, renderState, t);
    drawRestartCard(context, metrics, visualSpec, renderState, t);
    drawDifficultyCards(context, metrics, visualSpec, renderState, t);
    drawHelperCards(context, metrics, visualSpec, renderState, t);
  }

  function hitTest(x, y, renderState) {
    const metrics = getMetrics(renderState);
    const examLocked = Boolean(renderState && renderState.examSettingsRestricted);
    const difficultyStates = renderState && renderState.difficultyStates
      ? renderState.difficultyStates
      : {};

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
      return { type: "action", value: "toggle-language-picker" };
    }

    if (
      renderState &&
      renderState.showResumeAction &&
      x >= metrics.contentLeft &&
      x <= metrics.contentLeft + metrics.contentWidth &&
      y >= metrics.resumeCardTop &&
      y <= metrics.resumeCardTop + metrics.resumeCardHeight
    ) {
      return { type: "action", value: "resume-game" };
    }

    if (
      x >= metrics.contentLeft &&
      x <= metrics.contentLeft + metrics.contentWidth &&
      y >= metrics.restartCardTop &&
      y <= metrics.restartCardTop + metrics.restartCardHeight
    ) {
      return examLocked
        ? { type: "action", value: "exit-exam" }
        : { type: "action", value: "restart-game" };
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
        if (
          examLocked ||
          (difficultyStates[action.value] && difficultyStates[action.value].unlocked === false)
        ) {
          return null;
        }
        return { type: "difficulty", value: action.value };
      }
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
  createSettingsScene: createSettingsScene
};
