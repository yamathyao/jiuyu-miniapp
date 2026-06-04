const { puzzles } = require("./data/puzzles");
const {
  createGame,
  applyInputValue,
  toggleCellNote,
  eraseCellContent,
  undoLastStep,
  buildBoardView
} = require("./services/game-engine");
const { createBoardScene } = require("./scene/board-scene");
const { createToolbar } = require("./ui/toolbar");
const { getTouchPoint } = require("./utils/touch");

function boot() {
  if (typeof wx === "undefined" || !wx.createCanvas) {
    return;
  }

  const canvas = wx.createCanvas();
  const context = canvas.getContext("2d");
  const canvasWidth = canvas.width || 375;
  const canvasHeight = canvas.height || 812;
  let game = createGame(puzzles[0]);
  let selectedIndex = -1;
  let noteMode = false;

  const boardScene = createBoardScene({
    canvasWidth: canvasWidth,
    canvasHeight: canvasHeight
  });
  const toolbar = createToolbar({
    canvasWidth: canvasWidth,
    canvasHeight: canvasHeight,
    boardMetrics: boardScene.getMetrics()
  });

  function draw() {
    const cells = buildBoardView(game, selectedIndex);

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#f7f4ef";
    context.fillRect(0, 0, canvas.width, canvas.height);
    boardScene.draw(context, cells);
    toolbar.draw(context, noteMode);
  }

  wx.onTouchStart(function (event) {
    const point = getTouchPoint(event);

    if (!point) {
      return;
    }

    const hitCellIndex = boardScene.getCellIndexByPoint(point.x, point.y);

    if (hitCellIndex >= 0) {
      selectedIndex = hitCellIndex;
      draw();
      return;
    }

    const toolbarAction = toolbar.hitTest(point.x, point.y);

    if (!toolbarAction) {
      return;
    }

    if (toolbarAction.type === "number" && selectedIndex >= 0) {
      game = noteMode
        ? toggleCellNote(game, selectedIndex, toolbarAction.value)
        : applyInputValue(game, selectedIndex, toolbarAction.value);
      draw();
      return;
    }

    if (toolbarAction.type === "tool") {
      if (toolbarAction.value === "note") {
        noteMode = !noteMode;
      }

      if (toolbarAction.value === "undo") {
        const undoResult = undoLastStep(game);
        game = undoResult.game;
        selectedIndex = undoResult.selectedIndex;
      }

      if (toolbarAction.value === "erase") {
        game = eraseCellContent(game, selectedIndex, noteMode);
      }

      draw();
    }
  });

  draw();
}

boot();
