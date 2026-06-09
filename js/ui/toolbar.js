function createToolbar(options) {
  const canvasWidth = options.canvasWidth || 375;
  const canvasHeight = options.canvasHeight || 812;
  const boardMetrics = options.boardMetrics || {};
  const width = options.width || boardMetrics.boardSize || (canvasWidth - 48);
  const left = options.left != null
    ? options.left
    : boardMetrics.boardLeft != null
      ? boardMetrics.boardLeft
      : Math.floor((canvasWidth - width) / 2);
  const numberHeight = options.numberHeight || Math.max(52, Math.floor(canvasHeight * 0.075));
  const gap = options.gap || Math.max(18, Math.floor(canvasHeight * 0.03));
  const toolHeight = options.toolHeight || numberHeight;
  const defaultTop = boardMetrics.boardTop != null
    ? Math.min(
        boardMetrics.boardTop + boardMetrics.boardSize + gap,
        canvasHeight - numberHeight - toolHeight - gap - 16
      )
    : Math.max(0, canvasHeight - numberHeight - toolHeight - gap - 16);
  const top = options.top != null ? options.top : defaultTop;
  const toolTop = top + numberHeight + gap;
  const toolKeys = ["note", "undo", "erase", "hint", "check"];

  function getMetrics() {
    return {
      canvasWidth: canvasWidth,
      canvasHeight: canvasHeight,
      top: top,
      left: left,
      width: width,
      numberHeight: numberHeight,
      toolTop: toolTop,
      toolHeight: toolHeight,
      gap: gap
    };
  }

  function getTools(t) {
    const translate = typeof t === "function"
      ? t
      : function (key) {
          return key;
        };

    return toolKeys.map(function (toolKey) {
      return {
        key: toolKey,
        label: translate("toolbar." + toolKey)
      };
    });
  }

  function getPalette(theme) {
    const activeTheme = theme || {};
    const proMode = activeTheme.tone === "pro";

    return {
      groove: proMode ? "#8ea097" : "#c39a75",
      bambooFill: proMode ? "#e7e2d7" : "#efd9bf",
      bambooShadow: proMode ? "#aca793" : "#c59a72",
      bambooEdge: proMode ? "#6d8078" : "#b07f5a",
      bambooHighlight: proMode ? "#f7f4ec" : "#fbf2e4",
      plaqueFill: proMode ? "#e8e2d8" : "#efe0cb",
      plaqueShadow: proMode ? "#989588" : "#b68867",
      plaqueEdge: proMode ? "#73857d" : "#b07c59",
      plaqueHighlight: proMode ? "#f5f1e8" : "#faf0e2",
      text: activeTheme.toolText || "#2f403c",
      activeFill: activeTheme.activeToolFill || "#556c67",
      activeText: activeTheme.activeToolText || "#ffffff",
      activeGlow: proMode ? "#d7e0d9" : "#f0d8c4"
    };
  }

  function drawRoundedRectPath(context, x, y, widthValue, heightValue, radius) {
    if (typeof context.arcTo !== "function") {
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(x + widthValue, y);
      context.lineTo(x + widthValue, y + heightValue);
      context.lineTo(x, y + heightValue);
      context.lineTo(x, y);
      if (typeof context.closePath === "function") {
        context.closePath();
      }
      return;
    }

    const right = x + widthValue;
    const bottom = y + heightValue;
    const safeRadius = Math.min(radius, widthValue / 2, heightValue / 2);

    context.beginPath();
    context.moveTo(x + safeRadius, y);
    context.lineTo(right - safeRadius, y);
    context.arcTo(right, y, right, y + safeRadius, safeRadius);
    context.lineTo(right, bottom - safeRadius);
    context.arcTo(right, bottom, right - safeRadius, bottom, safeRadius);
    context.lineTo(x + safeRadius, bottom);
    context.arcTo(x, bottom, x, bottom - safeRadius, safeRadius);
    context.lineTo(x, y + safeRadius);
    context.arcTo(x, y, x + safeRadius, y, safeRadius);
    if (typeof context.closePath === "function") {
      context.closePath();
    }
  }

  function fillRoundedRect(context, x, y, widthValue, heightValue, radius, fillStyle) {
    context.fillStyle = fillStyle;
    drawRoundedRectPath(context, x, y, widthValue, heightValue, radius);
    if (typeof context.fill === "function") {
      context.fill();
    }
  }

  function strokeRoundedRect(context, x, y, widthValue, heightValue, radius, strokeStyle, lineWidth) {
    context.strokeStyle = strokeStyle;
    context.lineWidth = lineWidth;
    drawRoundedRectPath(context, x, y, widthValue, heightValue, radius);
    if (typeof context.stroke === "function") {
      context.stroke();
    }
  }

  function drawBambooNumberKey(context, keyLeft, keyTop, keyWidth, keyHeight, label, palette) {
    const bodyLeft = keyLeft;
    const bodyTop = keyTop;
    const shadowTop = bodyTop + 4;
    const bandInset = Math.max(5, Math.floor(keyWidth * 0.18));
    const grooveLeft = bodyLeft + keyWidth * 0.34;
    const grooveRight = bodyLeft + keyWidth * 0.66;

    fillRoundedRect(context, bodyLeft, shadowTop, keyWidth, keyHeight, 11, palette.bambooShadow);
    fillRoundedRect(context, bodyLeft, bodyTop, keyWidth, keyHeight - 4, 11, palette.bambooFill);
    fillRoundedRect(context, bodyLeft + 2, bodyTop + 2, keyWidth - 4, 9, 6, palette.bambooHighlight);
    strokeRoundedRect(context, bodyLeft, bodyTop, keyWidth, keyHeight - 4, 11, palette.bambooEdge, 1.1);

    context.strokeStyle = palette.groove;
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(grooveLeft, bodyTop + 8);
    context.lineTo(grooveLeft, bodyTop + keyHeight - 14);
    context.moveTo(grooveRight, bodyTop + 8);
    context.lineTo(grooveRight, bodyTop + keyHeight - 14);
    context.moveTo(bodyLeft + bandInset, bodyTop + 12);
    context.lineTo(bodyLeft + keyWidth - bandInset, bodyTop + 12);
    context.moveTo(bodyLeft + bandInset, bodyTop + keyHeight - 18);
    context.lineTo(bodyLeft + keyWidth - bandInset, bodyTop + keyHeight - 18);
    if (typeof context.stroke === "function") {
      context.stroke();
    }

    context.fillStyle = palette.text;
    context.font = "bold 23px sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(label, bodyLeft + keyWidth / 2, bodyTop + (keyHeight - 4) / 2 + 1);
  }

  function drawToolKey(context, keyLeft, keyTop, keyWidth, keyHeight, label, active, palette) {
    const fill = active ? palette.activeFill : palette.plaqueFill;
    const text = active ? palette.activeText : palette.text;
    const edge = active ? palette.activeGlow : palette.plaqueEdge;

    fillRoundedRect(context, keyLeft, keyTop + 4, keyWidth, keyHeight, 16, palette.plaqueShadow);
    fillRoundedRect(context, keyLeft, keyTop, keyWidth, keyHeight - 4, 16, fill);
    fillRoundedRect(context, keyLeft + 3, keyTop + 2, keyWidth - 6, 10, 8, active ? palette.activeGlow : palette.plaqueHighlight);
    strokeRoundedRect(context, keyLeft, keyTop, keyWidth, keyHeight - 4, 16, edge, active ? 1.5 : 1.1);

    context.fillStyle = text;
    context.font = label.length > 4 ? "14px sans-serif" : "16px sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(label, keyLeft + keyWidth / 2, keyTop + (keyHeight - 4) / 2);
  }

  function draw(context, noteMode, theme) {
    const palette = getPalette(theme);
    const numberWidth = width / 9;
    const visualGap = 6;

    for (let index = 0; index < 9; index += 1) {
      drawBambooNumberKey(
        context,
        left + index * numberWidth,
        top,
        numberWidth - visualGap,
        numberHeight,
        String(index + 1),
        palette
      );
    }

    const tools = getTools(theme && theme.t);
    const toolWidth = width / tools.length;

    tools.forEach(function (tool, index) {
      drawToolKey(
        context,
        left + index * toolWidth,
        toolTop,
        toolWidth - visualGap,
        toolHeight,
        tool.label,
        tool.key === "note" && noteMode,
        palette
      );
    });
  }

  function hitTest(x, y) {
    const numberWidth = width / 9;

    if (y >= top && y <= top + numberHeight && x >= left && x <= left + width) {
      return {
        type: "number",
        value: String(Math.floor((x - left) / numberWidth) + 1)
      };
    }

    if (y >= toolTop && y <= toolTop + toolHeight && x >= left && x <= left + width) {
      const toolWidth = width / toolKeys.length;
      const index = Math.floor((x - left) / toolWidth);
      return {
        type: "tool",
        value: toolKeys[index]
      };
    }

    return null;
  }

  return {
    draw: draw,
    hitTest: hitTest,
    getMetrics: getMetrics,
    getTools: getTools
  };
}

module.exports = {
  createToolbar: createToolbar
};
