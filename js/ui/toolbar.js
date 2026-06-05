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

  function draw(context, noteMode, theme) {
    const activeTheme = theme || {};
    const numberWidth = width / 9;

    for (let index = 0; index < 9; index += 1) {
      context.fillStyle = activeTheme.buttonShadow || "#d0d7de";
      context.fillRect(left + index * numberWidth, top + 4, numberWidth - 6, numberHeight);
      context.fillStyle = activeTheme.boardBase || "#ffffff";
      context.fillRect(left + index * numberWidth, top, numberWidth - 6, numberHeight - 4);
      context.fillStyle = activeTheme.buttonHighlight || "#ffffff";
      context.fillRect(left + index * numberWidth + 2, top + 2, numberWidth - 10, 10);
      context.fillStyle = activeTheme.toolText || "#1f6f78";
      context.font = "24px sans-serif";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(
        String(index + 1),
        left + index * numberWidth + numberWidth / 2,
        top + numberHeight / 2
      );
    }

    const tools = getTools(theme && theme.t);
    const toolWidth = width / tools.length;

    tools.forEach(function (tool, index) {
      const isActive = tool.key === "note" && noteMode;
      context.fillStyle = activeTheme.buttonShadow || "#d0d7de";
      context.fillRect(left + index * toolWidth, toolTop + 4, toolWidth - 6, toolHeight);
      context.fillStyle = isActive
        ? activeTheme.activeToolFill || "#1f6f78"
        : activeTheme.toolFill || "#edf3f2";
      context.fillRect(left + index * toolWidth, toolTop, toolWidth - 6, toolHeight - 4);
      context.fillStyle = isActive
        ? activeTheme.activeToolText || "#ffffff"
        : activeTheme.toolText || "#1f2933";
      context.font = "20px sans-serif";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(tool.label, left + index * toolWidth + toolWidth / 2, toolTop + toolHeight / 2);
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
    draw,
    hitTest,
    getMetrics,
    getTools
  };
}

module.exports = {
  createToolbar
};
