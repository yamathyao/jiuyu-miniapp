const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { puzzles } = require("../js/data/puzzles");
const { createBoardScene } = require("../js/scene/board-scene");
const { createToolbar } = require("../js/ui/toolbar");
const { getTouchPoint } = require("../js/utils/touch");
const {
  createGame,
  applyInputValue,
  toggleCellNote,
  eraseCellContent,
  undoLastStep,
  buildBoardView
} = require("../js/services/game-engine");

test("applyInputValue writes a value into an editable cell", function () {
  const game = createGame(puzzles[0]);
  const nextGame = applyInputValue(game, 2, "4");

  assert.equal(nextGame.cells[2].value, "4");
  assert.deepEqual(nextGame.cells[2].notes, []);
  assert.equal(nextGame.history.length, 1);
});

test("applyInputValue ignores given cells", function () {
  const game = createGame(puzzles[0]);
  const nextGame = applyInputValue(game, 0, "9");

  assert.equal(nextGame.cells[0].value, "5");
  assert.equal(nextGame.history.length, 0);
});

test("toggleCellNote adds and removes notes for editable cells", function () {
  const game = createGame(puzzles[0]);
  const withNote = toggleCellNote(game, 2, "4");
  const withoutNote = toggleCellNote(withNote, 2, "4");

  assert.deepEqual(withNote.cells[2].notes, ["4"]);
  assert.deepEqual(withoutNote.cells[2].notes, []);
});

test("eraseCellContent clears notes in note mode and value in normal mode", function () {
  const game = createGame(puzzles[0]);
  const withNote = toggleCellNote(game, 2, "4");
  const erasedNotes = eraseCellContent(withNote, 2, true);
  const withValue = applyInputValue(game, 2, "4");
  const erasedValue = eraseCellContent(withValue, 2, false);

  assert.deepEqual(erasedNotes.cells[2].notes, []);
  assert.equal(erasedValue.cells[2].value, "");
});

test("undoLastStep restores the previous editable state and returns the undone index", function () {
  const game = createGame(puzzles[0]);
  const changed = applyInputValue(game, 2, "4");
  const result = undoLastStep(changed);

  assert.equal(result.game.cells[2].value, "");
  assert.equal(result.game.history.length, 0);
  assert.equal(result.selectedIndex, 2);
});

test("buildBoardView marks selected, related, and same-value cells", function () {
  const game = createGame(puzzles[0]);
  const changed = applyInputValue(game, 2, "4");
  const boardView = buildBoardView(changed, 2);

  assert.equal(boardView[2].selected, true);
  assert.equal(boardView[0].related, true);
  assert.equal(boardView[36].sameValue, true);
});

test("minigame entry files exist", function () {
  assert.equal(fs.existsSync(path.join(__dirname, "..", "game.js")), true);
  assert.equal(fs.existsSync(path.join(__dirname, "..", "game.json")), true);
});

test("project config is switched to game compile type", function () {
  const projectConfig = JSON.parse(
    fs.readFileSync(path.join(__dirname, "..", "project.config.json"), "utf8")
  );

  assert.equal(projectConfig.compileType, "game");
});

test("minigame layout keeps toolbar inside a narrow portrait canvas", function () {
  const canvasWidth = 375;
  const canvasHeight = 812;
  const boardScene = createBoardScene({
    canvasWidth: canvasWidth,
    canvasHeight: canvasHeight
  });
  const toolbar = createToolbar({
    canvasWidth: canvasWidth,
    canvasHeight: canvasHeight,
    boardMetrics: boardScene.getMetrics()
  });
  const boardMetrics = boardScene.getMetrics();
  const toolbarMetrics = toolbar.getMetrics();

  assert.ok(boardMetrics.boardLeft >= 0);
  assert.ok(boardMetrics.boardTop >= 0);
  assert.ok(boardMetrics.boardLeft + boardMetrics.boardSize <= canvasWidth);
  assert.ok(toolbarMetrics.top + toolbarMetrics.numberHeight <= canvasHeight);
  assert.ok(toolbarMetrics.toolTop + toolbarMetrics.toolHeight <= canvasHeight);
});

test("getTouchPoint reads client coordinates from minigame touch events", function () {
  const point = getTouchPoint({
    touches: [
      {
        clientX: 128,
        clientY: 256
      }
    ]
  });

  assert.deepEqual(point, {
    x: 128,
    y: 256
  });
});
