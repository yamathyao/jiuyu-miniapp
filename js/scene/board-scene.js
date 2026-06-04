function createBoardScene(options) {
  const boardTop = options.boardTop || 120;
  const boardLeft = options.boardLeft || 24;
  const boardSize = options.boardSize || 702;
  const cellSize = boardSize / 9;

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

  function draw(context, cells) {
    context.fillStyle = "#ffffff";
    context.fillRect(boardLeft, boardTop, boardSize, boardSize);

    cells.forEach(function (cell) {
      const row = Math.floor(cell.index / 9);
      const column = cell.index % 9;
      const x = boardLeft + column * cellSize;
      const y = boardTop + row * cellSize;

      context.fillStyle = cell.selected
        ? "#9ed9c8"
        : cell.sameValue
          ? "#dceee8"
          : cell.related
            ? "#f4efe4"
            : "#ffffff";
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

  return {
    draw,
    getCellIndexByPoint
  };
}

module.exports = {
  createBoardScene
};
