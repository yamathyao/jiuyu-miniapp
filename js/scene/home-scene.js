const {
  createSharedScenePalette,
  isProDifficulty
} = require("../ui/scene-visual-spec.js");

const DIFFICULTIES = ["beginner", "intermediate", "skilled", "expert"];

function isEnglishTranslator(t) {
  return typeof t === "function" && t("common.back") === "Back";
}

function isEnglishCopy(copy) {
  return /[A-Za-z]/.test(String(copy || ""));
}

function setAlpha(context, alpha) {
  const previous = typeof context.globalAlpha === "number" ? context.globalAlpha : 1;
  context.globalAlpha = alpha;
  return previous;
}

function restoreAlpha(context, alpha) {
  context.globalAlpha = alpha;
}

function drawWrappedText(context, text, centerX, top, maxWidth, lineHeight, maxLines) {
  const words = String(text || "").split(" ");
  const lines = [];
  let currentLine = "";

  words.forEach(function (word) {
    const nextLine = currentLine ? currentLine + " " + word : word;
    const nextWidth = typeof context.measureText === "function"
      ? context.measureText(nextLine).width
      : nextLine.length * 8;

    if (nextWidth <= maxWidth || !currentLine) {
      currentLine = nextLine;
      return;
    }

    lines.push(currentLine);
    currentLine = word;
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  lines.slice(0, maxLines).forEach(function (line, index) {
    context.fillText(line, centerX, top + lineHeight * index);
  });
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

function fillRoundedRect(context, left, top, width, height, radius, fillStyle, alpha) {
  const previous = alpha == null ? null : setAlpha(context, alpha);
  context.fillStyle = fillStyle;
  drawRoundedRectPath(context, left, top, width, height, radius);
  if (typeof context.fill === "function") {
    context.fill();
  }
  if (previous != null) {
    restoreAlpha(context, previous);
  }
}

function strokeRoundedRect(context, left, top, width, height, radius, strokeStyle, lineWidth, alpha) {
  const previous = alpha == null ? null : setAlpha(context, alpha);
  context.lineWidth = lineWidth || 1;
  context.strokeStyle = strokeStyle;
  drawRoundedRectPath(context, left, top, width, height, radius);
  if (typeof context.stroke === "function") {
    context.stroke();
  }
  if (previous != null) {
    restoreAlpha(context, previous);
  }
}

function drawCenterLabel(context, text, centerX, centerY, style) {
  context.fillStyle = style.color;
  context.font = style.font;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(text, centerX, centerY);
}

function drawEdgeOrnaments(context, left, width, y, color) {
  context.strokeStyle = color;
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(left, y);
  context.lineTo(left + 18, y);
  context.moveTo(left + width - 18, y);
  context.lineTo(left + width, y);
  if (typeof context.stroke === "function") {
    context.stroke();
  }
}

function drawStackedButton(context, left, top, width, height, label, palette, style) {
  fillRoundedRect(context, left + 2, top + 6, width, height, style.radius, palette.shadowFill, 0.42);
  fillRoundedRect(context, left, top, width, height, style.radius, palette.baseFill);
  strokeRoundedRect(context, left, top, width, height, style.radius, palette.borderFill, 1.2);
  fillRoundedRect(context, left + 8, top + 8, width - 16, height - 18, style.innerRadius, palette.innerFill, 0.9);
  fillRoundedRect(context, left + 12, top + 7, width - 24, 12, 8, palette.highlightFill, 0.4);
  drawEdgeOrnaments(context, left + 16, width - 32, top + height / 2, palette.ornamentFill);
  drawCenterLabel(context, label, left + width / 2, top + height / 2 + 1, {
    color: palette.textFill,
    font: style.font
  });
}

function drawDifficultyBadge(context, left, top, width, height, label, selected, visualSpec) {
  const baseFill = selected ? visualSpec.badgeFill : visualSpec.optionFill;
  const innerFill = selected ? visualSpec.badgeInnerFill : visualSpec.optionInnerFill;
  const textFill = selected ? visualSpec.badgeTextFill : visualSpec.optionText;
  const borderFill = selected ? visualSpec.badgeBorderFill : visualSpec.helperFill;

  fillRoundedRect(context, left + 2, top + 5, width, height, 18, visualSpec.softShadowFill, 0.28);
  fillRoundedRect(context, left, top, width, height, 18, baseFill);
  strokeRoundedRect(context, left, top, width, height, 18, borderFill, selected ? 1.8 : 1.2);
  fillRoundedRect(context, left + 10, top + 8, width - 20, height - 18, 14, innerFill, 0.95);
  fillRoundedRect(context, left + 14, top + 6, width - 28, 10, 6, "#ffffff", 0.24);
  drawCenterLabel(context, label, left + width / 2, top + height / 2 + 1, {
    color: textFill,
    font: selected ? "bold 18px sans-serif" : "16px sans-serif"
  });
}

function createHomeScene(options) {
  const canvasWidth = options.canvasWidth || 375;
  const canvasHeight = options.canvasHeight || 812;
  const verticalOffset = options.verticalOffset != null ? options.verticalOffset : 32;
  const contentWidth = Math.min(canvasWidth - 40, 320);
  const contentLeft = Math.floor((canvasWidth - contentWidth) / 2);
  const brandBlockOffset = verticalOffset + 16;
  const brandTop = 106 + brandBlockOffset;
  const brandFrameTop = 38 + brandBlockOffset;
  const brandPanelTop = 46 + brandBlockOffset;
  const brandCoreTop = 56 + brandBlockOffset;
  const brandHighlightTop = 66 + brandBlockOffset;
  const brandDividerTop = 74 + brandBlockOffset;
  const primaryButtonTop = 242 + verticalOffset;
  const buttonHeight = 58;
  const secondaryButtonTop = primaryButtonTop + buttonHeight + 16;
  const returnCardTop = secondaryButtonTop + buttonHeight + 14;
  const returnCardHeight = 92;
  const difficultyTop = returnCardTop + returnCardHeight + 28;
  const difficultyHeight = 54;
  const difficultyGap = 12;
  const difficultyWidth = contentWidth;

  function isInsideRect(x, y, left, top, width, height) {
    return x >= left && x <= left + width && y >= top && y <= top + height;
  }

  function getDifficultyRows(renderState) {
    if (renderState && renderState.initialExamChoiceVisible) {
      return DIFFICULTIES.length;
    }

    return renderState && renderState.difficultyPickerOpen ? DIFFICULTIES.length : 1;
  }

  function getSelectableDifficulties(selectedDifficulty) {
    return DIFFICULTIES.filter(function (difficulty) {
      return difficulty !== selectedDifficulty;
    });
  }

  function getDifficultyState(renderState, difficulty) {
    const states = renderState && renderState.difficultyStates ? renderState.difficultyStates : null;

    if (!states || !states[difficulty]) {
      return { unlocked: true };
    }

    return states[difficulty];
  }

  function getMetrics(renderState) {
    const t = renderState && typeof renderState.t === "function"
      ? renderState.t
      : function (key) {
          return key;
        };
    const isEnglish = isEnglishTranslator(t);
    const difficultyRows = getDifficultyRows(renderState);
    const initialExamChoiceVisible = Boolean(renderState && renderState.initialExamChoiceVisible);
    const settingsTop = difficultyTop + difficultyHeight + (isEnglish ? 36 : 28) +
      (difficultyRows > 1 ? (difficultyRows - 1) * (difficultyHeight + difficultyGap) : 0);
    const languageOptionTop = settingsTop + 58;
    const languageOptionHeight = 46;
    const languageOptionWidth = contentWidth;
    const footerTop = settingsTop + (isEnglish ? 70 : 62);
    const lockedDialogVisible = Boolean(renderState && renderState.lockedDifficultyDialog);
    const lockedDialogCardWidth = contentWidth;
    const lockedDialogCardHeight = 176;
    const lockedDialogCardLeft = contentLeft;
    const lockedDialogCardTop = footerTop + 34;
    const lockedDialogActionsTop = lockedDialogCardTop + 128;
    const lockedDialogActionWidth = Math.floor((lockedDialogCardWidth - 32) / 2);
    const lockedDialogExamLeft = lockedDialogCardLeft + 16;
    const lockedDialogPointsLeft = lockedDialogCardLeft + lockedDialogCardWidth - 16 - lockedDialogActionWidth;

    return {
      brandTitle: "方庭九屿",
      brandTop: brandTop,
      brandFrameTop: brandFrameTop,
      brandPanelTop: brandPanelTop,
      brandCoreTop: brandCoreTop,
      brandHighlightTop: brandHighlightTop,
      brandDividerTop: brandDividerTop,
      contentLeft: contentLeft,
      contentWidth: contentWidth,
      primaryButtonLeft: contentLeft,
      primaryButtonTop: primaryButtonTop,
      secondaryButtonLeft: contentLeft,
      secondaryButtonTop: secondaryButtonTop,
      returnCardLeft: contentLeft,
      returnCardTop: returnCardTop,
      returnCardWidth: contentWidth,
      returnCardHeight: returnCardHeight,
      difficultyLeft: contentLeft,
      difficultyTop: difficultyTop,
      difficultyWidth: difficultyWidth,
      difficultyHeight: difficultyHeight,
      difficultyGap: difficultyGap,
      difficultyRows: difficultyRows,
      initialExamChoiceVisible: initialExamChoiceVisible,
      selectedDifficultyTop: difficultyTop,
      settingsTop: settingsTop,
      languageOptionTop: languageOptionTop,
      languageOptionHeight: languageOptionHeight,
      languageOptionWidth: languageOptionWidth,
      footerTop: footerTop,
      lockedDialogVisible: lockedDialogVisible,
      lockedDialogCardLeft: lockedDialogCardLeft,
      lockedDialogCardTop: lockedDialogCardTop,
      lockedDialogCardWidth: lockedDialogCardWidth,
      lockedDialogCardHeight: lockedDialogCardHeight,
      lockedDialogActionsTop: lockedDialogActionsTop,
      lockedDialogActionWidth: lockedDialogActionWidth,
      lockedDialogActionHeight: 28,
      lockedDialogExamLeft: lockedDialogExamLeft,
      lockedDialogPointsLeft: lockedDialogPointsLeft
    };
  }

  function getVisualSpec(renderState) {
    const selectedDifficulty = renderState && renderState.selectedDifficulty
      ? renderState.selectedDifficulty
      : "beginner";
    const t = renderState && typeof renderState.t === "function"
      ? renderState.t
      : function (key) {
          return key;
        };
    const isPro = isProDifficulty(selectedDifficulty);
    const palette = createSharedScenePalette(selectedDifficulty);

    return Object.assign({}, palette, isPro
      ? {
          tone: "pro",
          panelFill: "#f8f6ef",
          panelShadow: "#b8b5aa",
          subtitleColor: "#66736f",
          accentFill: "#5e766c",
          accentText: "#ffffff",
          accentInnerFill: "#768c83",
          accentEdgeFill: "#496159",
          secondaryFill: "#e8e1d4",
          secondaryInnerFill: "#f5f1ea",
          secondaryEdgeFill: "#c3beb1",
          secondaryText: "#324540",
          optionFill: "#fbfaf5",
          optionInnerFill: "#f3f0e7",
          optionSelectedFill: "#dce4dc",
          optionText: "#334742",
          footerText: "#6f7871",
          ornament: "#6b7c74",
          decorTone: "ink",
          brandPanelFill: "#f8f6ef",
          brandFrameFill: "#ece7dc",
          brandCoreFill: "#faf8f1",
          sealFill: "#8a8b7a",
          dividerFill: "#9aa299",
          labelFill: "#607069",
          helperFill: "#8f9991",
          brandSubtitle: t("home.subtitle.pro"),
          softShadowFill: "#b7b8ad",
          highlightFill: "#ffffff",
          badgeFill: "#dbe4db",
          badgeInnerFill: "#ecf1eb",
          badgeBorderFill: "#b8c2b8",
          badgeTextFill: "#345048",
          settingsFill: "#fbfaf5",
          settingsInnerFill: "#f2efe6",
          settingsEdgeFill: "#c7c8bd",
          initialExamTitle: t("home.initialExam.title"),
          initialExamSubtitle: t("home.initialExam.subtitle"),
          initialExamFallback: t("home.initialExam.fallback"),
          initialExamTag: t("home.initialExam.entryTag"),
          initialExamAction: t("home.initialExam.entryAction")
        }
      : {
          tone: "playful",
          panelFill: "#fff8ef",
          panelShadow: "#d8b39d",
          titleColor: "#6e3e4a",
          subtitleColor: "#946f60",
          accentFill: "#d97d76",
          accentText: "#fffaf7",
          accentInnerFill: "#e59a90",
          accentEdgeFill: "#c26661",
          secondaryFill: "#efd8c0",
          secondaryInnerFill: "#f7e8d6",
          secondaryEdgeFill: "#dcb28f",
          secondaryText: "#7b4c46",
          optionFill: "#fff8f0",
          optionInnerFill: "#fcf2e6",
          optionSelectedFill: "#f1d0bb",
          optionText: "#7a4b46",
          footerText: "#8f7569",
          ornament: "#c89256",
          decorTone: "petal",
          brandPanelFill: "#f8ead7",
          brandFrameFill: "#f2dfca",
          brandCoreFill: "#fbf1e4",
          sealFill: "#d46d58",
          dividerFill: "#d29a59",
          labelFill: "#8f6b5c",
          helperFill: "#b18467",
          brandSubtitle: t("home.subtitle.playful"),
          softShadowFill: "#d7b298",
          highlightFill: "#fffdf9",
          badgeFill: "#efcfb9",
          badgeInnerFill: "#f8e1d1",
          badgeBorderFill: "#d7a57d",
          badgeTextFill: "#7d4a43",
          settingsFill: "#fff9f1",
          settingsInnerFill: "#f8efe3",
          settingsEdgeFill: "#dfc0a4",
          initialExamTitle: t("home.initialExam.title"),
          initialExamSubtitle: t("home.initialExam.subtitle"),
          initialExamFallback: t("home.initialExam.fallback"),
          initialExamTag: t("home.initialExam.entryTag"),
          initialExamAction: t("home.initialExam.entryAction")
        }, {
          primaryLabel: t("home.primary.continue"),
          secondaryLabel: t("home.primary.newGame"),
          settingsLabel: t("settings.title"),
          noSaveLabel: t("home.status.noSave"),
          hasSaveLabel: t("home.status.hasSave"),
          recentSummary: renderState && renderState.recentSummary ? renderState.recentSummary : "",
          returnCardTitle: t("home.returnCard.title"),
          difficultyLabel: t("home.difficultyLabel"),
          pickerExpandLabel: t("home.difficultyAction.expand"),
          pickerCollapseLabel: t("home.difficultyAction.collapse"),
          currentDifficultyLabel: t("home.currentDifficulty", {
            difficulty: t("difficulty." + selectedDifficulty)
          })
        });
  }

  function drawDifficultyCard(context, left, top, width, height, difficultyKey, label, selected, visualSpec, difficultyState) {
    drawDifficultyBadge(context, left, top, width, height, label, selected, visualSpec);

    if (difficultyState && difficultyState.unlocked === false) {
      context.fillStyle = visualSpec.helperFill;
      context.font = "11px sans-serif";
      context.textAlign = "right";
      context.textBaseline = "middle";
      context.fillText("LOCK", left + width - 16, top + height / 2);
    }
  }

  function drawInitialExamDifficultyCard(context, left, top, width, height, label, selected, visualSpec) {
    const baseFill = selected ? visualSpec.accentFill : visualSpec.secondaryFill;
    const innerFill = selected ? visualSpec.accentInnerFill : visualSpec.secondaryInnerFill;
    const borderFill = selected ? visualSpec.accentEdgeFill : visualSpec.secondaryEdgeFill;
    const textFill = selected ? visualSpec.accentText : visualSpec.secondaryText;
    const tagFill = selected ? visualSpec.highlightFill : "#fffdf8";
    const tagTextFill = selected ? visualSpec.accentEdgeFill : visualSpec.helperFill;
    const actionTextFill = selected ? visualSpec.accentText : visualSpec.helperFill;

    fillRoundedRect(context, left + 2, top + 6, width, height, 20, visualSpec.softShadowFill, 0.24);
    fillRoundedRect(context, left, top, width, height, 20, baseFill);
    strokeRoundedRect(context, left, top, width, height, 20, borderFill, selected ? 1.8 : 1.2);
    fillRoundedRect(context, left + 10, top + 8, width - 20, height - 16, 14, innerFill, 0.92);
    fillRoundedRect(context, left + 14, top + 6, width - 28, 10, 6, visualSpec.highlightFill, 0.28);
    fillRoundedRect(context, left + 14, top + 12, 74, 22, 11, tagFill, selected ? 0.96 : 0.92);
    strokeRoundedRect(context, left + 14, top + 12, 74, 22, 11, borderFill, 1, 0.5);

    context.fillStyle = tagTextFill;
    context.font = "bold 11px sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(visualSpec.initialExamTag, left + 51, top + 23);

    drawCenterLabel(context, label, left + width / 2, top + height / 2 + 1, {
      color: textFill,
      font: selected ? "bold 18px sans-serif" : "17px sans-serif"
    });

    context.fillStyle = actionTextFill;
    context.font = "11px sans-serif";
    context.textAlign = "right";
    context.textBaseline = "middle";
    context.fillText(visualSpec.initialExamAction, left + width - 18, top + height - 14);
  }

  function drawOutlinedDifficultyCard(context, left, top, width, height, label, selected, visualSpec, difficultyState) {
    drawDifficultyCard(context, left, top, width, height, "", label, selected, visualSpec, difficultyState);
  }

  function drawSettingsPlaque(context, left, top, width, height, label, visualSpec) {
    fillRoundedRect(context, left + 2, top + 4, width, height, 22, visualSpec.softShadowFill, 0.25);
    fillRoundedRect(context, left, top, width, height, 22, visualSpec.settingsFill);
    strokeRoundedRect(context, left, top, width, height, 22, visualSpec.settingsEdgeFill, 1.2);
    fillRoundedRect(context, left + 10, top + 6, width - 20, height - 14, 16, visualSpec.settingsInnerFill, 0.95);
    drawEdgeOrnaments(context, left + 16, width - 32, top + height / 2, visualSpec.ornament);
    drawCenterLabel(context, label, left + width / 2, top + height / 2, {
      color: visualSpec.secondaryText,
      font: "bold 18px sans-serif"
    });
  }

  function drawReturnCard(context, metrics, visualSpec, returnCard) {
    if (!returnCard) {
      return;
    }

    fillRoundedRect(
      context,
      metrics.returnCardLeft + 2,
      metrics.returnCardTop + 3,
      metrics.returnCardWidth,
      metrics.returnCardHeight,
      20,
      visualSpec.softShadowFill,
      0.12
    );
    fillRoundedRect(
      context,
      metrics.returnCardLeft,
      metrics.returnCardTop,
      metrics.returnCardWidth,
      metrics.returnCardHeight,
      20,
      visualSpec.panelFill
    );
    strokeRoundedRect(
      context,
      metrics.returnCardLeft,
      metrics.returnCardTop,
      metrics.returnCardWidth,
      metrics.returnCardHeight,
      20,
      visualSpec.helperFill,
      0.9,
      0.72
    );

    context.fillStyle = visualSpec.labelFill;
    context.font = "12px sans-serif";
    context.textAlign = "left";
    context.textBaseline = "middle";
    context.fillText(returnCard.title, metrics.returnCardLeft + 16, metrics.returnCardTop + 20);

    context.fillStyle = visualSpec.secondaryText || visualSpec.optionText;
    context.font = "bold 15px sans-serif";
    context.fillText(returnCard.summary, metrics.returnCardLeft + 16, metrics.returnCardTop + 42);

    context.fillStyle = visualSpec.footerText;
    context.font = "12px sans-serif";
    context.fillText(returnCard.streakLabel, metrics.returnCardLeft + 16, metrics.returnCardTop + 62);

    context.textAlign = "right";
    context.font = "11px sans-serif";
    (returnCard.tags || []).slice(0, 2).forEach(function (tag, index) {
      context.fillText(
        tag,
        metrics.returnCardLeft + metrics.returnCardWidth - 16,
        metrics.returnCardTop + 20 + index * 16
      );
    });

    context.textAlign = "left";
    context.font = "11px sans-serif";
    context.fillText(returnCard.prompt, metrics.returnCardLeft + 16, metrics.returnCardTop + 80);
  }

  function drawBrandBackdrop(context, metrics, visualSpec) {
    fillRoundedRect(context, 18, 26, canvasWidth - 36, canvasHeight - 52, 34, visualSpec.haloFill);
    fillRoundedRect(context, metrics.contentLeft - 14, metrics.brandFrameTop, contentWidth + 28, 142, 30, visualSpec.brandFrameFill);
    fillRoundedRect(context, metrics.contentLeft - 8, metrics.brandPanelTop, contentWidth + 16, 126, 26, visualSpec.brandPanelFill);
    fillRoundedRect(context, metrics.contentLeft + 4, metrics.brandCoreTop, contentWidth - 8, 92, 22, visualSpec.brandCoreFill);
    fillRoundedRect(context, metrics.contentLeft + 18, metrics.brandHighlightTop, contentWidth - 36, 16, 10, visualSpec.highlightFill, 0.18);
    context.fillStyle = visualSpec.dividerFill;
    context.fillRect(metrics.contentLeft + 18, metrics.brandDividerTop, 46, 2);
    context.fillRect(metrics.contentLeft + contentWidth - 64, metrics.brandDividerTop, 46, 2);
  }

  function drawBrandText(context, metrics, visualSpec) {
    const isEnglish = isEnglishCopy(visualSpec.brandSubtitle);

    context.fillStyle = visualSpec.titleColor;
    context.font = "bold 36px sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(metrics.brandTitle, canvasWidth / 2, brandTop);

    context.font = isEnglish ? "14px sans-serif" : "16px sans-serif";
    context.fillStyle = visualSpec.subtitleColor;
    if (isEnglish) {
      drawWrappedText(
        context,
        visualSpec.brandSubtitle,
        canvasWidth / 2,
        brandTop + 28,
        metrics.contentWidth - 20,
        16,
        2
      );
    } else {
      context.fillText(visualSpec.brandSubtitle, canvasWidth / 2, brandTop + 38);
    }

    context.font = isEnglish ? "12px sans-serif" : "13px sans-serif";
    context.fillStyle = visualSpec.footerText;
    context.fillText(visualSpec.currentDifficultyLabel, canvasWidth / 2, brandTop + (isEnglish ? 72 : 68));
  }

  function drawPrimaryActions(context, metrics, hasSavedGame, visualSpec) {
    drawStackedButton(
      context,
      metrics.primaryButtonLeft,
      metrics.primaryButtonTop,
      contentWidth,
      buttonHeight,
      hasSavedGame ? visualSpec.primaryLabel : visualSpec.secondaryLabel,
      {
        baseFill: visualSpec.accentFill,
        innerFill: visualSpec.accentInnerFill,
        borderFill: visualSpec.accentEdgeFill,
        shadowFill: visualSpec.softShadowFill,
        highlightFill: visualSpec.highlightFill,
        ornamentFill: visualSpec.highlightFill,
        textFill: visualSpec.accentText
      },
      {
        radius: 22,
        innerRadius: 16,
        font: "bold 19px sans-serif"
      }
    );

    if (!hasSavedGame) {
      return;
    }

    drawStackedButton(
      context,
      metrics.secondaryButtonLeft,
      metrics.secondaryButtonTop,
      contentWidth,
      buttonHeight,
      visualSpec.secondaryLabel,
      {
        baseFill: visualSpec.secondaryFill,
        innerFill: visualSpec.secondaryInnerFill,
        borderFill: visualSpec.secondaryEdgeFill,
        shadowFill: visualSpec.softShadowFill,
        highlightFill: visualSpec.highlightFill,
        ornamentFill: visualSpec.ornament,
        textFill: visualSpec.secondaryText
      },
      {
        radius: 22,
        innerRadius: 16,
        font: "18px sans-serif"
      }
    );
  }

  function drawDifficultyPicker(context, metrics, selectedDifficulty, pickerOpen, visualSpec, t, renderState) {
    if (renderState && renderState.initialExamChoiceVisible) {
      context.fillStyle = visualSpec.labelFill;
      context.font = "bold 16px sans-serif";
      context.textAlign = "left";
      context.textBaseline = "middle";
      context.fillText(visualSpec.initialExamTitle, metrics.difficultyLeft, metrics.difficultyTop - 52);

      context.fillStyle = visualSpec.footerText;
      context.font = "12px sans-serif";
      context.fillText(visualSpec.initialExamSubtitle, metrics.difficultyLeft, metrics.difficultyTop - 28);
      context.fillText(visualSpec.initialExamFallback, metrics.difficultyLeft, metrics.footerTop);

      DIFFICULTIES.forEach(function (difficulty, index) {
        const top = metrics.difficultyTop + index * (metrics.difficultyHeight + metrics.difficultyGap);
        drawInitialExamDifficultyCard(
          context,
          metrics.difficultyLeft,
          top,
          metrics.difficultyWidth,
          metrics.difficultyHeight,
          t("difficulty." + difficulty),
          difficulty === selectedDifficulty,
          visualSpec
        );
      });
      return;
    }

    const isEnglish = isEnglishTranslator(t);
    const helperLabel = pickerOpen
      ? visualSpec.pickerCollapseLabel
      : visualSpec.pickerExpandLabel;
    const labelY = metrics.difficultyTop - (isEnglish ? 24 : 18);

    context.fillStyle = visualSpec.labelFill;
    context.font = isEnglish ? "11px sans-serif" : "12px sans-serif";
    context.textAlign = "left";
    context.textBaseline = "middle";
    context.fillText(visualSpec.difficultyLabel, metrics.difficultyLeft, labelY);

    context.textAlign = "right";
    context.fillStyle = visualSpec.helperFill;
    context.fillText(helperLabel, metrics.difficultyLeft + metrics.difficultyWidth, labelY);

    if (!pickerOpen) {
      drawDifficultyCard(
        context,
        metrics.difficultyLeft,
        metrics.selectedDifficultyTop,
        metrics.difficultyWidth,
        metrics.difficultyHeight,
        selectedDifficulty,
        t("difficulty." + selectedDifficulty),
        true,
        visualSpec,
        getDifficultyState(renderState, selectedDifficulty)
      );
      return;
    }

    drawOutlinedDifficultyCard(
      context,
      metrics.difficultyLeft,
      metrics.selectedDifficultyTop,
      metrics.difficultyWidth,
      metrics.difficultyHeight,
      t("difficulty." + selectedDifficulty),
      true,
      visualSpec,
      getDifficultyState(renderState, selectedDifficulty)
    );

    getSelectableDifficulties(selectedDifficulty).forEach(function (difficulty, index) {
      const top = metrics.difficultyTop + (index + 1) * (metrics.difficultyHeight + metrics.difficultyGap);
      const difficultyState = getDifficultyState(renderState, difficulty);

      drawOutlinedDifficultyCard(
        context,
        metrics.difficultyLeft,
        top,
        metrics.difficultyWidth,
        metrics.difficultyHeight,
        t("difficulty." + difficulty),
        false,
        visualSpec,
        difficultyState
      );
    });
  }

  function drawSettingsEntry(context, metrics, visualSpec) {
    const plaqueWidth = Math.floor(contentWidth * 0.76);
    const plaqueLeft = contentLeft + Math.floor((contentWidth - plaqueWidth) / 2);

    drawSettingsPlaque(
      context,
      plaqueLeft,
      metrics.settingsTop,
      plaqueWidth,
      42,
      visualSpec.settingsLabel,
      visualSpec
    );
  }

  function drawLockedDifficultyDialog(context, metrics, visualSpec, dialog) {
    if (!dialog) {
      return;
    }

    const cardWidth = metrics.lockedDialogCardWidth;
    const cardHeight = metrics.lockedDialogCardHeight;
    const cardLeft = metrics.lockedDialogCardLeft;
    const cardTop = metrics.lockedDialogCardTop;

    fillRoundedRect(context, cardLeft + 2, cardTop + 4, cardWidth, cardHeight, 22, visualSpec.softShadowFill, 0.22);
    fillRoundedRect(context, cardLeft, cardTop, cardWidth, cardHeight, 22, visualSpec.panelFill);
    strokeRoundedRect(context, cardLeft, cardTop, cardWidth, cardHeight, 22, visualSpec.helperFill, 1.2, 0.78);

    context.fillStyle = visualSpec.titleColor || visualSpec.secondaryText;
    context.font = "bold 16px sans-serif";
    context.textAlign = "left";
    context.textBaseline = "middle";
    context.fillText(dialog.title, cardLeft + 16, cardTop + 28);

    context.fillStyle = visualSpec.footerText;
    context.font = "12px sans-serif";
    context.fillText(dialog.pointsProgress, cardLeft + 16, cardTop + 60);
    context.fillText(dialog.mode === "points" ? dialog.pointsRemaining : dialog.fallbackHint, cardLeft + 16, cardTop + 86);
    context.fillText(dialog.examUnlockHint, cardLeft + 16, cardTop + 112);

    context.fillStyle = visualSpec.secondaryText;
    context.font = "bold 14px sans-serif";
    context.textAlign = "left";
    context.fillText(dialog.examAction, metrics.lockedDialogExamLeft, metrics.lockedDialogActionsTop);

    context.textAlign = "right";
    context.fillText(dialog.pointsAction, metrics.lockedDialogPointsLeft + metrics.lockedDialogActionWidth, metrics.lockedDialogActionsTop);
  }

  function drawHomeFooter(context, metrics, hasSavedGame, visualSpec) {
    context.fillStyle = visualSpec.footerText;
    context.font = "13px sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(
      hasSavedGame ? visualSpec.hasSaveLabel : visualSpec.noSaveLabel,
      canvasWidth / 2,
      metrics.footerTop
    );

    if (visualSpec.recentSummary) {
      context.font = "12px sans-serif";
      context.fillText(
        visualSpec.recentSummary,
        canvasWidth / 2,
        metrics.footerTop + 20
      );
    }
  }

  function draw(context, renderState) {
    const hasSavedGame = !renderState || renderState.hasSavedGame !== false;
    const selectedDifficulty = renderState && renderState.selectedDifficulty
      ? renderState.selectedDifficulty
      : "beginner";
    const pickerOpen = Boolean(renderState && renderState.difficultyPickerOpen);
    const initialExamChoiceVisible = Boolean(renderState && renderState.initialExamChoiceVisible);
    const t = renderState && typeof renderState.t === "function"
      ? renderState.t
      : function (key) {
          return key;
        };
    const metrics = getMetrics(renderState);
    const visualSpec = getVisualSpec(renderState);

    context.fillStyle = visualSpec.background;
    context.fillRect(0, 0, canvasWidth, canvasHeight);
    drawBrandBackdrop(context, metrics, visualSpec);
    drawBrandText(context, metrics, visualSpec);
    if (!initialExamChoiceVisible) {
      drawPrimaryActions(context, metrics, hasSavedGame, visualSpec);
      drawReturnCard(context, metrics, visualSpec, renderState ? renderState.homeReturnCard : null);
    }
    drawDifficultyPicker(context, metrics, selectedDifficulty, pickerOpen, visualSpec, t, renderState);
    if (!initialExamChoiceVisible) {
      drawSettingsEntry(context, metrics, visualSpec);
      drawHomeFooter(context, metrics, hasSavedGame, visualSpec);
    }
    drawLockedDifficultyDialog(context, metrics, visualSpec, renderState ? renderState.lockedDifficultyDialog : null);
  }

  function hitTest(x, y, state) {
    const metrics = getMetrics(state);
    const hasSavedGame = !state || state.hasSavedGame !== false;
    const primaryAction = hasSavedGame ? "continue" : "new-game";
    const selectedDifficulty = state && state.selectedDifficulty
      ? state.selectedDifficulty
      : "beginner";
    const pickerOpen = Boolean(state && state.difficultyPickerOpen);
    const initialExamChoiceVisible = Boolean(state && state.initialExamChoiceVisible);
    const lockedDifficultyDialog = state && state.lockedDifficultyDialog ? state.lockedDifficultyDialog : null;

    if (initialExamChoiceVisible) {
      for (let index = 0; index < DIFFICULTIES.length; index += 1) {
        const difficulty = DIFFICULTIES[index];
        const top = metrics.difficultyTop + index * (metrics.difficultyHeight + metrics.difficultyGap);

        if (isInsideRect(x, y, metrics.difficultyLeft, top, metrics.difficultyWidth, metrics.difficultyHeight)) {
          return { type: "action", value: "start-initial-exam:" + difficulty };
        }
      }
    }

    if (isInsideRect(x, y, metrics.primaryButtonLeft, metrics.primaryButtonTop, contentWidth, buttonHeight)) {
      return { type: "action", value: primaryAction };
    }

    if (hasSavedGame && isInsideRect(x, y, metrics.secondaryButtonLeft, metrics.secondaryButtonTop, contentWidth, buttonHeight)) {
      return { type: "action", value: "new-game" };
    }

    if (
      isInsideRect(
        x,
        y,
        metrics.difficultyLeft,
        metrics.selectedDifficultyTop,
        metrics.difficultyWidth,
        metrics.difficultyHeight
      )
    ) {
      return { type: "action", value: "toggle-difficulty-picker" };
    }

    if (pickerOpen) {
      const selectableDifficulties = getSelectableDifficulties(selectedDifficulty);

      for (let index = 0; index < selectableDifficulties.length; index += 1) {
        const difficulty = selectableDifficulties[index];
        const top = metrics.difficultyTop + (index + 1) * (metrics.difficultyHeight + metrics.difficultyGap);
        const difficultyState = getDifficultyState(state, difficulty);

        if (isInsideRect(x, y, metrics.difficultyLeft, top, metrics.difficultyWidth, metrics.difficultyHeight)) {
          return difficultyState.unlocked === false
            ? { type: "locked-difficulty", value: difficulty }
            : { type: "difficulty", value: difficulty };
        }
      }
    }

    if (isInsideRect(x, y, contentLeft, metrics.settingsTop, contentWidth, 46)) {
      return { type: "action", value: "settings" };
    }

    if (lockedDifficultyDialog) {
      if (
        isInsideRect(
          x,
          y,
          metrics.lockedDialogExamLeft,
          metrics.lockedDialogActionsTop - 12,
          metrics.lockedDialogActionWidth,
          metrics.lockedDialogActionHeight
        )
      ) {
        return { type: "action", value: "start-locked-exam" };
      }

      if (
        isInsideRect(
          x,
          y,
          metrics.lockedDialogPointsLeft,
          metrics.lockedDialogActionsTop - 12,
          metrics.lockedDialogActionWidth,
          metrics.lockedDialogActionHeight
        )
      ) {
        return { type: "action", value: "view-locked-points" };
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
  createHomeScene: createHomeScene
};
