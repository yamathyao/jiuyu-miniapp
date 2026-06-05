const { drawBrushButton } = require("../ui/brush_button.js");

const DIFFICULTIES = ["beginner", "intermediate", "skilled", "expert"];

function isProDifficulty(difficulty) {
  return difficulty === "skilled" || difficulty === "expert";
}

function createHomeScene(options) {
  const canvasWidth = options.canvasWidth || 375;
  const canvasHeight = options.canvasHeight || 812;
  const contentWidth = Math.min(canvasWidth - 40, 320);
  const contentLeft = Math.floor((canvasWidth - contentWidth) / 2);
  const brandTop = 110;
  const primaryButtonTop = 264;
  const buttonHeight = 58;
  const secondaryButtonTop = primaryButtonTop + buttonHeight + 18;
  const difficultyTop = secondaryButtonTop + buttonHeight + 40;
  const difficultyHeight = 54;
  const difficultyGap = 12;
  const difficultyWidth = contentWidth;

  function isInsideRect(x, y, left, top, width, height) {
    return x >= left && x <= left + width && y >= top && y <= top + height;
  }

  function getDifficultyRows(renderState) {
    return renderState && renderState.difficultyPickerOpen ? DIFFICULTIES.length : 1;
  }

  function getSelectableDifficulties(selectedDifficulty) {
    return DIFFICULTIES.filter(function (difficulty) {
      return difficulty !== selectedDifficulty;
    });
  }

  function getMetrics(renderState) {
    const difficultyRows = getDifficultyRows(renderState);
    const settingsTop = difficultyTop + difficultyHeight + 34 +
      (difficultyRows > 1 ? (difficultyRows - 1) * (difficultyHeight + difficultyGap) : 0);
    const languageOptionTop = settingsTop + 58;
    const languageOptionHeight = 46;
    const languageOptionWidth = contentWidth;
    const footerTop = settingsTop + 86;

    return {
      brandTitle: "方庭九屿",
      contentLeft: contentLeft,
      contentWidth: contentWidth,
      primaryButtonLeft: contentLeft,
      primaryButtonTop: primaryButtonTop,
      secondaryButtonLeft: contentLeft,
      secondaryButtonTop: secondaryButtonTop,
      difficultyLeft: contentLeft,
      difficultyTop: difficultyTop,
      difficultyWidth: difficultyWidth,
      difficultyHeight: difficultyHeight,
      difficultyGap: difficultyGap,
      difficultyRows: difficultyRows,
      selectedDifficultyTop: difficultyTop,
      settingsTop: settingsTop,
      languageOptionTop: languageOptionTop,
      languageOptionHeight: languageOptionHeight,
      languageOptionWidth: languageOptionWidth,
      footerTop: footerTop
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

    if (isPro) {
      return {
        tone: "pro",
        background: "#eef1ee",
        panelFill: "#fbfaf5",
        panelShadow: "#bcc6c8",
        titleColor: "#1c2730",
        subtitleColor: "#5d696d",
        accentFill: "#314752",
        accentText: "#ffffff",
        secondaryFill: "#e5e7e1",
        secondaryText: "#23313f",
        optionFill: "#f9f7f1",
        optionSelectedFill: "#d8e0de",
        optionText: "#243543",
        footerText: "#667176",
        ornament: "#70828c",
        decorTone: "mist",
        haloFill: "#dde5e3",
        brandPanelFill: "#f7f4ee",
        headerWashFill: "#f2f5f2",
        sealFill: "#88989a",
        dividerFill: "#8da0ab",
        brushPrimary: "#6c8088",
        brushSecondary: "#c7d1cf",
        brushWash: "#eef2ef",
        brushText: "#23313f",
        labelFill: "#596870",
        helperFill: "#90a0a5",
        brandSubtitle: t("home.subtitle.pro"),
        primaryLabel: t("home.primary.continue"),
        secondaryLabel: t("home.primary.newGame"),
        settingsLabel: t("settings.title"),
        noSaveLabel: t("home.status.noSave"),
        hasSaveLabel: t("home.status.hasSave"),
        difficultyLabel: t("home.difficultyLabel"),
        pickerExpandLabel: t("home.difficultyAction.expand"),
        pickerCollapseLabel: t("home.difficultyAction.collapse"),
        currentDifficultyLabel: t("home.currentDifficulty", {
          difficulty: t("difficulty." + selectedDifficulty)
        })
      };
    }

    return {
      tone: "playful",
      background: "#f9efe3",
      panelFill: "#fff8ef",
      panelShadow: "#d8b39d",
      titleColor: "#6e3e4a",
      subtitleColor: "#946f60",
      accentFill: "#d8747a",
      accentText: "#ffffff",
      secondaryFill: "#f4dfcf",
      secondaryText: "#7b4c46",
      optionFill: "#fff8f0",
      optionSelectedFill: "#f2d1bd",
      optionText: "#7a4b46",
      footerText: "#8f7569",
      ornament: "#c89256",
      decorTone: "petal",
      haloFill: "#f5e5d1",
      brandPanelFill: "#f8ead7",
      headerWashFill: "#fbf1e4",
      sealFill: "#d46d58",
      dividerFill: "#d29a59",
      brushPrimary: "#d78576",
      brushSecondary: "#ead2bc",
      brushWash: "#faf0e3",
      brushText: "#704840",
      labelFill: "#8f6b5c",
      helperFill: "#b18467",
      brandSubtitle: t("home.subtitle.playful"),
      primaryLabel: t("home.primary.continue"),
      secondaryLabel: t("home.primary.newGame"),
      settingsLabel: t("settings.title"),
      noSaveLabel: t("home.status.noSave"),
      hasSaveLabel: t("home.status.hasSave"),
      difficultyLabel: t("home.difficultyLabel"),
      pickerExpandLabel: t("home.difficultyAction.expand"),
      pickerCollapseLabel: t("home.difficultyAction.collapse"),
      currentDifficultyLabel: t("home.currentDifficulty", {
        difficulty: t("difficulty." + selectedDifficulty)
      })
    };
  }

  function drawDifficultyCard(context, left, top, width, height, difficultyKey, label, selected, visualSpec) {
    const assets = options.difficultyAssets || {};
    const imageAsset = assets[difficultyKey];

    if (
      imageAsset &&
      imageAsset.image &&
      imageAsset.loaded &&
      typeof context.drawImage === "function"
    ) {
      const assetWidth = Math.floor(width * 0.82);
      const assetHeight = height + 22;
      const assetLeft = left + Math.floor((width - assetWidth) / 2);
      const assetTop = top - 11;

      context.drawImage(
        imageAsset.image,
        assetLeft,
        assetTop,
        assetWidth,
        assetHeight
      );
      context.fillStyle = selected ? "#ffffff" : visualSpec.optionText;
      context.font = selected ? "bold 17px sans-serif" : "16px sans-serif";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(label, left + width / 2, top + height / 2);
      return;
    }

    drawBrushButton(context, left, top, width, height, label, {
      baseFill: selected ? visualSpec.brushPrimary : visualSpec.brushSecondary,
      washFill: visualSpec.brushWash,
      edgeFill: visualSpec.ornament,
      textColor: selected ? "#ffffff" : visualSpec.optionText,
      font: selected ? "bold 17px sans-serif" : "16px sans-serif"
    });
  }

  function drawOutlinedDifficultyCard(context, left, top, width, height, label, selected, visualSpec) {
    context.fillStyle = selected ? visualSpec.optionSelectedFill : visualSpec.optionFill;
    context.fillRect(left, top, width, height);

    context.lineWidth = selected ? 2.4 : 1.4;
    context.strokeStyle = selected ? visualSpec.ornament : visualSpec.helperFill;
    context.beginPath();
    context.moveTo(left, top);
    context.lineTo(left + width, top);
    context.lineTo(left + width, top + height);
    context.lineTo(left, top + height);
    context.lineTo(left, top);
    if (typeof context.stroke === "function") {
      context.stroke();
    }

    context.fillStyle = selected ? visualSpec.titleColor : visualSpec.optionText;
    context.font = selected ? "bold 17px sans-serif" : "16px sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(label, left + width / 2, top + height / 2);
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

  function drawSettingsPlaque(context, left, top, width, height, label, visualSpec) {
    const inset = 18;
    const ornamentY = top + height / 2;

    context.fillStyle = visualSpec.optionFill;
    drawRoundedRectPath(context, left, top, width, height, 23);
    if (typeof context.fill === "function") {
      context.fill();
    }

    context.lineWidth = 1.2;
    context.strokeStyle = visualSpec.helperFill;
    drawRoundedRectPath(context, left, top, width, height, 23);
    if (typeof context.stroke === "function") {
      context.stroke();
    }

    context.lineWidth = 1;
    context.strokeStyle = visualSpec.ornament;
    context.beginPath();
    context.moveTo(left + inset, ornamentY);
    context.lineTo(left + inset + 18, ornamentY);
    context.moveTo(left + width - inset - 18, ornamentY);
    context.lineTo(left + width - inset, ornamentY);
    if (typeof context.stroke === "function") {
      context.stroke();
    }

    context.fillStyle = visualSpec.secondaryText;
    context.font = "bold 18px sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(label, left + width / 2, top + height / 2);
  }

  function drawBrandBackdrop(context, metrics, visualSpec) {
    context.fillStyle = visualSpec.haloFill;
    context.fillRect(22, 32, canvasWidth - 44, canvasHeight - 64);

    context.fillStyle = visualSpec.brandPanelFill;
    context.fillRect(metrics.contentLeft - 14, 56, contentWidth + 28, 148);

    context.fillStyle = visualSpec.headerWashFill;
    context.fillRect(metrics.contentLeft + 4, 76, contentWidth - 8, 96);

    context.fillStyle = visualSpec.dividerFill;
    context.fillRect(metrics.contentLeft + 18, 92, 46, 2);
    context.fillRect(metrics.contentLeft + contentWidth - 64, 92, 46, 2);

    context.fillStyle = visualSpec.sealFill;
    context.fillRect(metrics.contentLeft + contentWidth - 32, 72, 14, 14);
  }

  function drawBrandText(context, metrics, visualSpec) {
    context.fillStyle = visualSpec.titleColor;
    context.font = visualSpec.tone === "pro" ? "bold 34px sans-serif" : "bold 36px sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(metrics.brandTitle, canvasWidth / 2, brandTop);

    context.font = "16px sans-serif";
    context.fillStyle = visualSpec.subtitleColor;
    context.fillText(visualSpec.brandSubtitle, canvasWidth / 2, brandTop + 38);

    context.font = "13px sans-serif";
    context.fillStyle = visualSpec.footerText;
    context.fillText(visualSpec.currentDifficultyLabel, canvasWidth / 2, brandTop + 68);
  }

  function drawPrimaryActions(context, metrics, hasSavedGame, visualSpec) {
    const primaryAsset = options.primaryBrushAsset;

    if (
      primaryAsset &&
      primaryAsset.image &&
      primaryAsset.loaded &&
      typeof context.drawImage === "function"
    ) {
      const assetWidth = Math.floor(contentWidth * 0.76);
      const assetLeft = metrics.primaryButtonLeft + Math.floor((contentWidth - assetWidth) / 2);

      context.drawImage(
        primaryAsset.image,
        assetLeft,
        metrics.primaryButtonTop - 10,
        assetWidth,
        buttonHeight + 22
      );
      context.fillStyle = visualSpec.accentText;
      context.font = "bold 19px sans-serif";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(
        hasSavedGame ? visualSpec.primaryLabel : visualSpec.secondaryLabel,
        metrics.primaryButtonLeft + contentWidth / 2,
        metrics.primaryButtonTop + buttonHeight / 2
      );
    } else {
      drawBrushButton(
        context,
        metrics.primaryButtonLeft,
        metrics.primaryButtonTop,
        contentWidth,
        buttonHeight,
        hasSavedGame ? visualSpec.primaryLabel : visualSpec.secondaryLabel,
        {
          baseFill: visualSpec.brushPrimary,
          washFill: visualSpec.brushWash,
          edgeFill: visualSpec.ornament,
          textColor: visualSpec.accentText,
          font: "bold 19px sans-serif"
        }
      );
    }

    if (!hasSavedGame) {
      return;
    }

    drawBrushButton(
      context,
      metrics.secondaryButtonLeft,
      metrics.secondaryButtonTop,
      contentWidth,
      buttonHeight,
      visualSpec.secondaryLabel,
      {
        baseFill: visualSpec.brushSecondary,
        washFill: visualSpec.brushWash,
        edgeFill: visualSpec.ornament,
        textColor: visualSpec.secondaryText,
        font: "18px sans-serif"
      }
    );
  }

  function drawDifficultyPicker(context, metrics, selectedDifficulty, pickerOpen, visualSpec, t) {
    const helperLabel = pickerOpen
      ? visualSpec.pickerCollapseLabel
      : visualSpec.pickerExpandLabel;

    context.fillStyle = visualSpec.labelFill;
    context.font = "13px sans-serif";
    context.textAlign = "left";
    context.textBaseline = "middle";
    context.fillText(visualSpec.difficultyLabel, metrics.difficultyLeft, metrics.difficultyTop - 18);

    context.textAlign = "right";
    context.fillStyle = visualSpec.helperFill;
    context.fillText(helperLabel, metrics.difficultyLeft + metrics.difficultyWidth, metrics.difficultyTop - 18);

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
        visualSpec
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
      visualSpec
    );

    getSelectableDifficulties(selectedDifficulty).forEach(function (difficulty, index) {
      const top = metrics.difficultyTop + (index + 1) * (metrics.difficultyHeight + metrics.difficultyGap);

      drawOutlinedDifficultyCard(
        context,
        metrics.difficultyLeft,
        top,
        metrics.difficultyWidth,
        metrics.difficultyHeight,
        t("difficulty." + difficulty),
        false,
        visualSpec
      );
    });
  }

  function drawSettingsEntry(context, metrics, visualSpec) {
    const plaqueWidth = Math.floor(contentWidth * 0.82);
    const plaqueLeft = contentLeft + Math.floor((contentWidth - plaqueWidth) / 2);

    drawSettingsPlaque(
      context,
      plaqueLeft,
      metrics.settingsTop,
      plaqueWidth,
      44,
      visualSpec.settingsLabel,
      visualSpec
    );
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
  }

  function draw(context, renderState) {
    const hasSavedGame = !renderState || renderState.hasSavedGame !== false;
    const selectedDifficulty = renderState && renderState.selectedDifficulty
      ? renderState.selectedDifficulty
      : "beginner";
    const pickerOpen = Boolean(renderState && renderState.difficultyPickerOpen);
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
    drawPrimaryActions(context, metrics, hasSavedGame, visualSpec);
    drawDifficultyPicker(context, metrics, selectedDifficulty, pickerOpen, visualSpec, t);
    drawSettingsEntry(context, metrics, visualSpec);
    drawHomeFooter(context, metrics, hasSavedGame, visualSpec);
  }

  function hitTest(x, y, state) {
    const metrics = getMetrics(state);
    const hasSavedGame = !state || state.hasSavedGame !== false;
    const primaryAction = hasSavedGame ? "continue" : "new-game";
    const selectedDifficulty = state && state.selectedDifficulty
      ? state.selectedDifficulty
      : "beginner";
    const pickerOpen = Boolean(state && state.difficultyPickerOpen);

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

        if (isInsideRect(x, y, metrics.difficultyLeft, top, metrics.difficultyWidth, metrics.difficultyHeight)) {
          return { type: "difficulty", value: difficulty };
        }
      }
    }

    if (isInsideRect(x, y, contentLeft, metrics.settingsTop, contentWidth, 46)) {
      return { type: "action", value: "settings" };
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
