function createToolbar(options) {
  const top = options.top || 860;
  const left = options.left || 24;
  const width = options.width || 702;
  const numberHeight = 64;
  const toolTop = top + 92;

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
      context.fillRect(left + index * toolWidth, toolTop, toolWidth - 6, 64);
      context.fillStyle = tool.key === "note" && noteMode ? "#ffffff" : "#1f2933";
      context.font = "20px sans-serif";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(tool.label, left + index * toolWidth + toolWidth / 2, toolTop + 32);
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

    if (y >= toolTop && y <= toolTop + 64 && x >= left && x <= left + width) {
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
    hitTest
  };
}

module.exports = {
  createToolbar
};
