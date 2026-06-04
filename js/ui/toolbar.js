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

  function draw(context, noteMode) {
    const numberWidth = width / 9;

    for (let index = 0; index < 9; index += 1) {
      context.fillStyle = "#ffffff";
      context.fillRect(left + index * numberWidth, top, numberWidth - 6, numberHeight);
      context.fillStyle = "#1f6f78";
      context.font = "24px sans-serif";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(
        String(index + 1),
        left + index * numberWidth + numberWidth / 2,
        top + numberHeight / 2
      );
    }

    const tools = [
      { key: "note", label: "笔记" },
      { key: "undo", label: "撤销" },
      { key: "erase", label: "擦除" }
    ];
    const toolWidth = width / tools.length;

    tools.forEach(function (tool, index) {
      context.fillStyle = tool.key === "note" && noteMode ? "#1f6f78" : "#edf3f2";
      context.fillRect(left + index * toolWidth, toolTop, toolWidth - 6, toolHeight);
      context.fillStyle = tool.key === "note" && noteMode ? "#ffffff" : "#1f2933";
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
      const toolWidth = width / 3;
      const index = Math.floor((x - left) / toolWidth);
      return {
        type: "tool",
        value: ["note", "undo", "erase"][index]
      };
    }

    return null;
  }

  return {
    draw,
    hitTest,
    getMetrics
  };
}

module.exports = {
  createToolbar
};
