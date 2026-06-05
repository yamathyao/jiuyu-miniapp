function createBoardScene(options) {
  const canvasWidth = options.canvasWidth || 375;
  const canvasHeight = options.canvasHeight || 812;
  const horizontalPadding = options.horizontalPadding || Math.max(16, Math.floor(canvasWidth * 0.04));
  const topPadding = options.topPadding || Math.max(148, Math.floor(canvasHeight * 0.18));
  const maxBoardSize = Math.min(
    canvasWidth - horizontalPadding * 2,
    canvasHeight * 0.62
  );
  const boardSize = options.boardSize || Math.floor(maxBoardSize);
  const boardLeft = options.boardLeft != null
    ? options.boardLeft
    : Math.floor((canvasWidth - boardSize) / 2);
  const boardTop = options.boardTop != null ? options.boardTop : topPadding;
  const cellSize = boardSize / 9;

  function getMetrics() {
    return {
      canvasWidth: canvasWidth,
      canvasHeight: canvasHeight,
      boardTop: boardTop,
      boardLeft: boardLeft,
      boardSize: boardSize,
      cellSize: cellSize,
      settingsLeft: boardLeft + boardSize - 84,
      settingsTop: boardTop - 112,
      settingsWidth: 84,
      settingsHeight: 34
    };
  }

  function getCellIndexByPoint(x, y) {
    if (
      x < boardLeft ||
      y < boardTop ||
      x > boardLeft + boardSize ||
      y > boardTop + boardSize
    ) {
      return -1;
    }

    const column = Math.floor((x - boardLeft) / cellSize);
    const row = Math.floor((y - boardTop) / cellSize);
    return row * 9 + column;
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

  function drawPlaque(context, left, top, width, height, label, theme) {
    context.fillStyle = theme.surfaceTint || "#fff7eb";
    drawRoundedRectPath(context, left, top, width, height, 18);
    if (typeof context.fill === "function") {
      context.fill();
    }

    context.lineWidth = 1;
    context.strokeStyle = theme.buttonShadow || "#c98b6f";
    drawRoundedRectPath(context, left, top, width, height, 18);
    if (typeof context.stroke === "function") {
      context.stroke();
    }

    context.lineWidth = 1;
    context.strokeStyle = theme.ornament || "#d9a65a";
    context.beginPath();
    context.moveTo(left + 14, top + height / 2);
    context.lineTo(left + 24, top + height / 2);
    context.moveTo(left + width - 24, top + height / 2);
    context.lineTo(left + width - 14, top + height / 2);
    if (typeof context.stroke === "function") {
      context.stroke();
    }

    context.fillStyle = theme.toolText || "#1f2933";
    context.font = "15px sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(label, left + width / 2, top + height / 2);
  }

  function drawHeader(context, renderState, theme, metrics) {
    const title = renderState ? renderState.title || "" : "";
    const difficultyLabel = renderState ? renderState.difficultyLabel || "" : "";
    const settingsLabel = renderState ? renderState.settingsLabel || "" : "";
    const panelTop = boardTop - 136;
    const panelHeight = 100;

    context.fillStyle = theme.surfaceTint || "#fff7eb";
    context.fillRect(boardLeft - 6, panelTop, boardSize + 12, panelHeight);

    context.fillStyle = theme.boardBase || "#ffffff";
    context.fillRect(boardLeft + 10, panelTop + 18, boardSize - 20, panelHeight - 34);

    context.fillStyle = theme.ornament || "#d9a65a";
    context.fillRect(boardLeft + 16, panelTop + 28, 36, 2);
    context.fillRect(boardLeft + boardSize - 52, panelTop + 28, 36, 2);

    if (title) {
      context.fillStyle = theme.toolText || "#1f2933";
      context.font = "bold 24px sans-serif";
      context.textAlign = "left";
      context.textBaseline = "middle";
      context.fillText(title, boardLeft, boardTop - 92);
    }

    if (difficultyLabel) {
      context.fillStyle = theme.buttonShadow || "#8f7569";
      context.font = "14px sans-serif";
      context.textAlign = "left";
      context.textBaseline = "middle";
      context.fillText(difficultyLabel, boardLeft, boardTop - 66);
    }

    if (settingsLabel) {
      drawPlaque(
        context,
        metrics.settingsLeft,
        metrics.settingsTop,
        metrics.settingsWidth,
        metrics.settingsHeight,
        settingsLabel,
        theme
      );
    }
  }

  function drawFeedback(context, feedbackMessage, feedbackType, theme) {
    if (!feedbackMessage) {
      return;
    }

    const fill = feedbackType === "warning"
      ? theme.issueFill || "#f0d5d5"
      : theme.feedbackFill || "#e9eef3";
    const text = feedbackType === "warning"
      ? "#7a3030"
      : theme.feedbackText || "#304252";

    context.fillStyle = fill;
    drawRoundedRectPath(context, boardLeft, boardTop - 54, boardSize, 34, 12);
    if (typeof context.fill === "function") {
      context.fill();
    }

    context.fillStyle = text;
    context.font = "15px sans-serif";
    context.textAlign = "left";
    context.textBaseline = "middle";
    context.fillText(feedbackMessage, boardLeft + 12, boardTop - 37);
  }

  function draw(context, cells, renderState) {
    const theme = renderState ? renderState.theme || {} : {};
    const metrics = getMetrics();

    drawHeader(context, renderState, theme, metrics);

    context.fillStyle = theme.boardBase || "#ffffff";
    context.fillRect(boardLeft, boardTop, boardSize, boardSize);
    drawFeedback(
      context,
      renderState ? renderState.feedbackMessage : "",
      renderState ? renderState.feedbackType : "info",
      theme
    );

    cells.forEach(function (cell) {
      const row = Math.floor(cell.index / 9);
      const column = cell.index % 9;
      const x = boardLeft + column * cellSize;
      const y = boardTop + row * cellSize;

      context.fillStyle = cell.issue
        ? theme.issueFill || "#f0d5d5"
        : cell.hintTarget
          ? theme.selected || "#9ed9c8"
          : cell.selected
            ? theme.selected || "#9ed9c8"
            : cell.sameValue
              ? theme.sameValue || "#dceee8"
              : cell.related
                ? theme.related || "#f4efe4"
                : theme.boardBase || "#ffffff";
      context.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);

      if (cell.value) {
        context.fillStyle = "#1f2933";
        context.font = cell.given ? "bold 28px sans-serif" : "28px sans-serif";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(cell.value, x + cellSize / 2, y + cellSize / 2);
        return;
      }

      if (cell.hasNotes) {
        context.fillStyle = "#607078";
        context.font = "12px sans-serif";
        context.textAlign = "center";
        context.textBaseline = "middle";

        cell.notes.forEach(function (noteValue) {
          const note = Number(noteValue) - 1;
          const noteColumn = note % 3;
          const noteRow = Math.floor(note / 3);
          context.fillText(
            noteValue,
            x + (noteColumn + 0.5) * (cellSize / 3),
            y + (noteRow + 0.5) * (cellSize / 3)
          );
        });
      }
    });

    context.strokeStyle = "#1f2933";
    for (let line = 0; line <= 9; line += 1) {
      context.lineWidth = line % 3 === 0 ? 3 : 1;
      context.beginPath();
      context.moveTo(boardLeft, boardTop + line * cellSize);
      context.lineTo(boardLeft + boardSize, boardTop + line * cellSize);
      context.stroke();

      context.beginPath();
      context.moveTo(boardLeft + line * cellSize, boardTop);
      context.lineTo(boardLeft + line * cellSize, boardTop + boardSize);
      context.stroke();
    }
  }

  function hitTestHeaderAction(x, y) {
    const metrics = getMetrics();

    if (
      x >= metrics.settingsLeft &&
      x <= metrics.settingsLeft + metrics.settingsWidth &&
      y >= metrics.settingsTop &&
      y <= metrics.settingsTop + metrics.settingsHeight
    ) {
      return { type: "action", value: "settings" };
    }

    return null;
  }

  return {
    draw: draw,
    getCellIndexByPoint: getCellIndexByPoint,
    getMetrics: getMetrics,
    hitTestHeaderAction: hitTestHeaderAction
  };
}

module.exports = {
  createBoardScene: createBoardScene
};
