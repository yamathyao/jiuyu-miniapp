const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { puzzles } = require("../js/data/puzzles");
const { createHomeScene } = require("../js/scene/home-scene");
const { createBoardScene } = require("../js/scene/board-scene");
const { createSettingsScene } = require("../js/scene/settings-scene");
const { createLanguageScene } = require("../js/scene/language-scene");
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
const {
  STORAGE_KEYS,
  readStorage,
  writeStorage,
  loadCurrentGame,
  saveCurrentGame,
  loadSettings,
  saveSettings
} = require("../js/services/storage");
const {
  getDifficultyPolicy
} = require("../js/services/difficulty-policy");
const {
  checkConflicts,
  checkAgainstSolution,
  runDifficultyCheck
} = require("../js/services/checker");
const { getNextHint } = require("../js/services/hint-engine");
const { getThemeByDifficulty } = require("../js/ui/theme-policy");
const {
  DEFAULT_LOCALE,
  normalizeLocale,
  createTranslator
} = require("../js/i18n");

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

test("buildBoardView carries issue and hint target flags for scene rendering", function () {
  const game = createGame(puzzles[0]);
  const changed = applyInputValue(game, 2, "4");
  const boardView = buildBoardView(changed, 2, {
    issueIndexes: [2, 11],
    hintTargetIndex: 11
  });

  assert.equal(boardView[2].issue, true);
  assert.equal(boardView[11].issue, true);
  assert.equal(boardView[11].hintTarget, true);
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

test("readStorage returns fallback when storage is unavailable or empty", function () {
  assert.equal(
    readStorage("missing", "fallback", {
      getStorageSync: function () {
        return "";
      }
    }),
    "fallback"
  );

  assert.equal(
    readStorage("missing", "fallback", {
      getStorageSync: function () {
        throw new Error("read failed");
      }
    }),
    "fallback"
  );
});

test("writeStorage reports whether sync storage succeeds", function () {
  const writes = [];
  const writeResult = writeStorage(
    "demo",
    { value: 1 },
    {
      setStorageSync: function (key, value) {
        writes.push([key, value]);
      }
    }
  );
  const failedResult = writeStorage(
    "demo",
    { value: 1 },
    {
      setStorageSync: function () {
        throw new Error("write failed");
      }
    }
  );

  assert.equal(writeResult, true);
  assert.equal(failedResult, false);
  assert.deepEqual(writes, [["demo", { value: 1 }]]);
});

test("loadCurrentGame restores a valid saved session", function () {
  const savedSession = {
    game: applyInputValue(createGame(puzzles[0]), 2, "4"),
    selectedIndex: 2,
    noteMode: true
  };
  const restored = loadCurrentGame(createGame(puzzles[0]), {
    getStorageSync: function (key) {
      assert.equal(key, STORAGE_KEYS.currentGame);
      return savedSession;
    }
  });

  assert.equal(restored.game.cells[2].value, "4");
  assert.equal(restored.selectedIndex, 2);
  assert.equal(restored.noteMode, true);
  assert.equal(restored.game.history.length, 1);
});

test("loadCurrentGame falls back to a fresh session and saveCurrentGame writes the session", function () {
  const defaultGame = createGame(puzzles[0]);
  const writes = [];
  const restored = loadCurrentGame(defaultGame, {
    getStorageSync: function () {
      return {
        game: null,
        selectedIndex: "2",
        noteMode: "false"
      };
    }
  });
  const saved = saveCurrentGame(
    {
      game: defaultGame,
      selectedIndex: -1,
      noteMode: false
    },
    {
      setStorageSync: function (key, value) {
        writes.push([key, value]);
      }
    }
  );

  assert.equal(restored.game.cells[2].value, "");
  assert.equal(restored.selectedIndex, -1);
  assert.equal(restored.noteMode, false);
  assert.equal(saved, true);
  assert.equal(writes[0][0], STORAGE_KEYS.currentGame);
  assert.equal(writes[0][1].selectedIndex, -1);
});

test("loadCurrentGame returns the fallback session when storage API is missing", function () {
  const defaultGame = createGame(puzzles[0]);
  const restored = loadCurrentGame(defaultGame, null);

  assert.equal(restored.game.cells[2].value, "");
  assert.equal(restored.selectedIndex, -1);
  assert.equal(restored.noteMode, false);
});

test("getDifficultyPolicy returns the expected hint and check rules", function () {
  assert.deepEqual(getDifficultyPolicy("beginner"), {
    difficulty: "beginner",
    checkMode: "solution",
    hintLevels: ["direction", "cell", "technique", "answer"],
    allowAnswerHint: true,
    copyStyle: "playful"
  });

  assert.deepEqual(getDifficultyPolicy("expert"), {
    difficulty: "expert",
    checkMode: "conflict",
    hintLevels: ["technique"],
    allowAnswerHint: false,
    copyStyle: "pro"
  });
});

test("getDifficultyPolicy falls back to beginner for unknown difficulty", function () {
  const policy = getDifficultyPolicy("unknown");

  assert.equal(policy.difficulty, "beginner");
  assert.equal(policy.checkMode, "solution");
  assert.equal(policy.allowAnswerHint, true);
});

test("checkConflicts reports duplicate editable values in related cells", function () {
  const game = createGame(puzzles[0]);
  const withFirstValue = applyInputValue(game, 2, "4");
  const withConflict = applyInputValue(withFirstValue, 11, "4");
  const result = checkConflicts(withConflict);

  assert.equal(result.mode, "conflict");
  assert.equal(result.hasIssue, true);
  assert.deepEqual(result.issueIndexes, [2, 11]);
});

test("checkAgainstSolution reports indexes that do not match the puzzle solution", function () {
  const game = createGame(puzzles[0]);
  const changed = applyInputValue(game, 2, "9");
  const result = checkAgainstSolution(changed);

  assert.equal(result.mode, "solution");
  assert.equal(result.hasIssue, true);
  assert.deepEqual(result.issueIndexes, [2]);
});

test("runDifficultyCheck switches between solution and conflict mode by difficulty", function () {
  const game = createGame(puzzles[0]);
  const withWrongValue = applyInputValue(game, 2, "1");
  const beginnerResult = runDifficultyCheck(withWrongValue, "beginner");
  const skilledResult = runDifficultyCheck(withWrongValue, "skilled");

  assert.equal(beginnerResult.mode, "solution");
  assert.equal(beginnerResult.hasIssue, true);
  assert.deepEqual(beginnerResult.issueIndexes, [2]);
  assert.equal(skilledResult.mode, "conflict");
  assert.equal(skilledResult.hasIssue, false);
  assert.deepEqual(skilledResult.issueIndexes, []);
});

test("checker returns localized messages", function () {
  const game = createGame(puzzles[0]);
  const wrong = applyInputValue(game, 2, "1");
  const zh = createTranslator("zh-CN");
  const en = createTranslator("en");

  assert.equal(runDifficultyCheck(wrong, "beginner", zh).message, "发现需要处理的填写。");
  assert.equal(runDifficultyCheck(wrong, "beginner", en).message, "There are entries that need attention.");
});

test("getNextHint upgrades beginner hints up to the answer level", function () {
  const game = createGame(puzzles[0]);
  const firstHint = getNextHint(game, "beginner", {
    currentLevel: null,
    targetIndex: -1
  });
  const secondHint = getNextHint(game, "beginner", {
    currentLevel: firstHint.level,
    targetIndex: firstHint.targetIndex
  });
  const thirdHint = getNextHint(game, "beginner", {
    currentLevel: secondHint.level,
    targetIndex: secondHint.targetIndex
  });
  const fourthHint = getNextHint(game, "beginner", {
    currentLevel: thirdHint.level,
    targetIndex: thirdHint.targetIndex
  });

  assert.equal(firstHint.level, "direction");
  assert.equal(secondHint.level, "cell");
  assert.equal(thirdHint.level, "technique");
  assert.equal(fourthHint.level, "answer");
  assert.equal(fourthHint.value, "4");
});

test("getNextHint keeps expert hints at the technique level", function () {
  const game = createGame(puzzles[0]);
  const hint = getNextHint(game, "expert", {
    currentLevel: null,
    targetIndex: -1
  });

  assert.equal(hint.level, "technique");
  assert.equal(hint.technique, "naked-single");
  assert.equal(hint.value, "4");
});

test("getNextHint stops intermediate hints at the technique level", function () {
  const game = createGame(puzzles[0]);
  const firstHint = getNextHint(game, "intermediate", {
    currentLevel: null,
    targetIndex: -1
  });
  const secondHint = getNextHint(game, "intermediate", {
    currentLevel: firstHint.level,
    targetIndex: firstHint.targetIndex
  });
  const thirdHint = getNextHint(game, "intermediate", {
    currentLevel: secondHint.level,
    targetIndex: secondHint.targetIndex
  });
  const fourthHint = getNextHint(game, "intermediate", {
    currentLevel: thirdHint.level,
    targetIndex: thirdHint.targetIndex
  });

  assert.equal(firstHint.level, "direction");
  assert.equal(secondHint.level, "cell");
  assert.equal(thirdHint.level, "technique");
  assert.equal(fourthHint.level, "technique");
});

test("hint engine returns localized messages", function () {
  const game = createGame(puzzles[0]);
  const zh = createTranslator("zh-CN");
  const en = createTranslator("en");

  assert.equal(
    getNextHint(game, "beginner", { currentLevel: null, targetIndex: -1 }, zh).message,
    "先看第一行前 3 格，这里有一个数字可以先确定。"
  );
  assert.equal(
    getNextHint(game, "beginner", { currentLevel: null, targetIndex: -1 }, en).message,
    "Start with the first three cells in row 1. One value can already be fixed there."
  );
});

test("getThemeByDifficulty groups beginner and intermediate into a playful theme", function () {
  const beginnerTheme = getThemeByDifficulty("beginner");
  const intermediateTheme = getThemeByDifficulty("intermediate");
  const expertTheme = getThemeByDifficulty("expert");

  assert.equal(beginnerTheme.tone, "playful");
  assert.equal(intermediateTheme.tone, "playful");
  assert.equal(expertTheme.tone, "pro");
});

test("toolbar hitTest supports hint and check tool buttons", function () {
  const toolbar = createToolbar({
    canvasWidth: 375,
    canvasHeight: 812,
    boardMetrics: createBoardScene({
      canvasWidth: 375,
      canvasHeight: 812
    }).getMetrics()
  });
  const metrics = toolbar.getMetrics();
  const toolWidth = metrics.width / 5;

  assert.deepEqual(
    toolbar.hitTest(metrics.left + toolWidth * 3.5, metrics.toolTop + 10),
    { type: "tool", value: "hint" }
  );
  assert.deepEqual(
    toolbar.hitTest(metrics.left + toolWidth * 4.5, metrics.toolTop + 10),
    { type: "tool", value: "check" }
  );
});

test("toolbar exposes localized tool labels", function () {
  const toolbar = createToolbar({
    canvasWidth: 375,
    canvasHeight: 812,
    boardMetrics: createBoardScene({
      canvasWidth: 375,
      canvasHeight: 812
    }).getMetrics()
  });
  const zh = createTranslator("zh-CN");
  const en = createTranslator("en");

  assert.equal(toolbar.getTools(zh)[0].label, "笔记");
  assert.equal(toolbar.getTools(en)[0].label, "Notes");
});

test("home scene exposes primary actions and a compact difficulty trigger", function () {
  const homeScene = createHomeScene({
    canvasWidth: 375,
    canvasHeight: 812
  });
  const metrics = homeScene.getMetrics({
    difficultyPickerOpen: false
  });

  assert.equal(metrics.brandTitle, "方庭九屿");
  assert.deepEqual(
    homeScene.hitTest(metrics.primaryButtonLeft + 20, metrics.primaryButtonTop + 20),
    { type: "action", value: "continue" }
  );
  assert.deepEqual(
    homeScene.hitTest(metrics.secondaryButtonLeft + 20, metrics.secondaryButtonTop + 20),
    { type: "action", value: "new-game" }
  );
  assert.deepEqual(
    homeScene.hitTest(metrics.difficultyLeft + 20, metrics.difficultyTop + 20),
    { type: "action", value: "toggle-difficulty-picker" }
  );
});

test("home scene only exposes more difficulty options after the picker expands", function () {
  const homeScene = createHomeScene({
    canvasWidth: 375,
    canvasHeight: 812
  });
  const collapsedMetrics = homeScene.getMetrics({
    difficultyPickerOpen: false
  });
  const expandedMetrics = homeScene.getMetrics({
    difficultyPickerOpen: true
  });
  const collapsedProbeY = collapsedMetrics.difficultyTop + collapsedMetrics.difficultyHeight +
    Math.floor((collapsedMetrics.settingsTop - (collapsedMetrics.difficultyTop + collapsedMetrics.difficultyHeight)) / 2);
  const expandedProbeY = expandedMetrics.difficultyTop + expandedMetrics.difficultyHeight + expandedMetrics.difficultyGap + 20;

  assert.equal(
    homeScene.hitTest(
      collapsedMetrics.difficultyLeft + 20,
      collapsedProbeY,
      {
        hasSavedGame: true,
        selectedDifficulty: "beginner",
        difficultyPickerOpen: false
      }
    ),
    null
  );

  assert.deepEqual(
    homeScene.hitTest(
      expandedMetrics.difficultyLeft + 20,
      expandedProbeY,
      {
        hasSavedGame: true,
        selectedDifficulty: "beginner",
        difficultyPickerOpen: true
      }
    ),
    { type: "difficulty", value: "intermediate" }
  );
});

test("home scene uses loaded difficulty image assets when they are available", function () {
  const drawCalls = [];
  const homeScene = createHomeScene({
    canvasWidth: 375,
    canvasHeight: 812,
    difficultyAssets: {
      beginner: {
        image: { tag: "beginner" },
        loaded: true
      }
    }
  });

  homeScene.draw({
    fillStyle: "",
    font: "",
    textAlign: "",
    textBaseline: "",
    lineWidth: 1,
    clearRect: function () {},
    fillRect: function () {},
    fillText: function () {},
    beginPath: function () {},
    moveTo: function () {},
    lineTo: function () {},
    closePath: function () {},
    fill: function () {},
    stroke: function () {},
    drawImage: function (image) {
      drawCalls.push(image.tag);
    }
  }, {
    hasSavedGame: false,
    selectedDifficulty: "beginner",
    t: createTranslator("zh-CN")
  });

  assert.ok(drawCalls.includes("beginner"));
});

test("home scene does not use difficulty images while the picker list is expanded", function () {
  const drawCalls = [];
  const homeScene = createHomeScene({
    canvasWidth: 375,
    canvasHeight: 812,
    difficultyAssets: {
      beginner: {
        image: { tag: "beginner" },
        loaded: true
      },
      intermediate: {
        image: { tag: "intermediate" },
        loaded: true
      }
    }
  });

  homeScene.draw({
    fillStyle: "",
    font: "",
    textAlign: "",
    textBaseline: "",
    lineWidth: 1,
    strokeStyle: "",
    clearRect: function () {},
    fillRect: function () {},
    fillText: function () {},
    beginPath: function () {},
    moveTo: function () {},
    lineTo: function () {},
    closePath: function () {},
    fill: function () {},
    stroke: function () {},
    drawImage: function (image) {
      drawCalls.push(image.tag);
    }
  }, {
    hasSavedGame: false,
    selectedDifficulty: "beginner",
    difficultyPickerOpen: true,
    t: createTranslator("zh-CN")
  });

  assert.equal(drawCalls.includes("beginner"), false);
  assert.equal(drawCalls.includes("intermediate"), false);
});

test("home scene can promote new game as the primary action when no save exists", function () {
  const homeScene = createHomeScene({
    canvasWidth: 375,
    canvasHeight: 812
  });
  const metrics = homeScene.getMetrics();

  assert.deepEqual(
    homeScene.hitTest(metrics.primaryButtonLeft + 20, metrics.primaryButtonTop + 20, {
      hasSavedGame: false
    }),
    { type: "action", value: "new-game" }
  );
});

test("home scene hides the secondary button when no save exists", function () {
  const homeScene = createHomeScene({
    canvasWidth: 375,
    canvasHeight: 812
  });
  const metrics = homeScene.getMetrics();

  assert.equal(
    homeScene.hitTest(metrics.secondaryButtonLeft + 20, metrics.secondaryButtonTop + 20, {
      hasSavedGame: false
    }),
    null
  );
});

test("home scene exposes a settings action", function () {
  const homeScene = createHomeScene({
    canvasWidth: 375,
    canvasHeight: 812
  });
  const metrics = homeScene.getMetrics({
    difficultyPickerOpen: false
  });

  assert.deepEqual(
    homeScene.hitTest(metrics.contentLeft + 20, metrics.settingsTop + 20),
    { type: "action", value: "settings" }
  );
});

test("home scene keeps the settings action on the centered plaque area", function () {
  const homeScene = createHomeScene({
    canvasWidth: 375,
    canvasHeight: 812
  });
  const metrics = homeScene.getMetrics({
    difficultyPickerOpen: false
  });

  assert.deepEqual(
    homeScene.hitTest(metrics.contentLeft + metrics.contentWidth / 2, metrics.settingsTop + 20),
    { type: "action", value: "settings" }
  );
});

test("home scene moves the settings entry downward when the difficulty picker expands", function () {
  const homeScene = createHomeScene({
    canvasWidth: 375,
    canvasHeight: 812
  });
  const collapsedMetrics = homeScene.getMetrics({
    difficultyPickerOpen: false
  });
  const expandedMetrics = homeScene.getMetrics({
    difficultyPickerOpen: true
  });

  assert.ok(expandedMetrics.settingsTop > collapsedMetrics.settingsTop);
});

test("home scene keeps settings as a dedicated entry instead of inline language options", function () {
  const homeScene = createHomeScene({
    canvasWidth: 375,
    canvasHeight: 812
  });
  const metrics = homeScene.getMetrics();

  assert.equal(
    homeScene.hitTest(metrics.contentLeft + 20, metrics.languageOptionTop + 20, {
      settingsOpen: true
    }),
    null
  );
});

test("home scene keeps a balanced vertical rhythm for the default layout", function () {
  const homeScene = createHomeScene({
    canvasWidth: 375,
    canvasHeight: 812
  });
  const metrics = homeScene.getMetrics({
    difficultyPickerOpen: false
  });

  assert.ok(metrics.primaryButtonTop > 230);
  assert.ok(metrics.primaryButtonTop < 255);
  assert.ok(metrics.difficultyTop - metrics.secondaryButtonTop < 110);
  assert.ok(metrics.settingsTop - metrics.difficultyTop < 110);
  assert.ok(metrics.footerTop - metrics.settingsTop < 80);
});

test("home scene keeps visual spec fields available for difficulty-based styling", function () {
  const homeScene = createHomeScene({
    canvasWidth: 375,
    canvasHeight: 812
  });
  const playfulSpec = homeScene.getVisualSpec({
    selectedDifficulty: "beginner"
  });
  const proSpec = homeScene.getVisualSpec({
    selectedDifficulty: "expert"
  });

  assert.equal(playfulSpec.tone, "playful");
  assert.equal(proSpec.tone, "pro");
  assert.equal(typeof playfulSpec.ornament, "string");
  assert.equal(typeof proSpec.helperFill, "string");
});

test("board scene exposes a settings button hit area in the header", function () {
  const boardScene = createBoardScene({
    canvasWidth: 375,
    canvasHeight: 812
  });
  const metrics = boardScene.getMetrics();

  assert.deepEqual(
    boardScene.hitTestHeaderAction(metrics.settingsLeft + 8, metrics.settingsTop + 8),
    { type: "action", value: "settings" }
  );
});

test("board scene keeps the settings action on the centered plaque area", function () {
  const boardScene = createBoardScene({
    canvasWidth: 375,
    canvasHeight: 812
  });
  const metrics = boardScene.getMetrics();

  assert.deepEqual(
    boardScene.hitTestHeaderAction(metrics.settingsLeft + metrics.settingsWidth / 2, metrics.settingsTop + metrics.settingsHeight / 2),
    { type: "action", value: "settings" }
  );
});

test("settings scene exposes back and language actions", function () {
  const settingsScene = createSettingsScene({
    canvasWidth: 375,
    canvasHeight: 812
  });
  const metrics = settingsScene.getMetrics();

  assert.deepEqual(
    settingsScene.hitTest(metrics.backLeft + 8, metrics.backTop + 8),
    { type: "action", value: "back" }
  );
  assert.deepEqual(
    settingsScene.hitTest(metrics.languageCardLeft + 8, metrics.languageCardTop + 8),
    { type: "action", value: "language" }
  );
});

test("settings scene keeps the language action on the centered main card", function () {
  const settingsScene = createSettingsScene({
    canvasWidth: 375,
    canvasHeight: 812
  });
  const metrics = settingsScene.getMetrics();

  assert.deepEqual(
    settingsScene.hitTest(metrics.languageCardLeft + metrics.languageCardWidth / 2, metrics.languageCardTop + metrics.languageCardHeight / 2),
    { type: "action", value: "language" }
  );
});

test("settings scene exposes four difficulty actions inside the page", function () {
  const settingsScene = createSettingsScene({
    canvasWidth: 375,
    canvasHeight: 812
  });
  const metrics = settingsScene.getMetrics();

  assert.deepEqual(
    settingsScene.hitTest(metrics.difficultyCardLeft + 10, metrics.difficultyCardTop + 10),
    { type: "difficulty", value: "beginner" }
  );
  assert.deepEqual(
    settingsScene.hitTest(
      metrics.difficultyCardLeft + metrics.difficultyCardWidth + metrics.difficultyCardGap + 10,
      metrics.difficultyCardTop + 10
    ),
    { type: "difficulty", value: "intermediate" }
  );
  assert.deepEqual(
    settingsScene.hitTest(metrics.difficultyCardLeft + 10, metrics.difficultySecondRowTop + 10),
    { type: "difficulty", value: "skilled" }
  );
  assert.deepEqual(
    settingsScene.hitTest(
      metrics.difficultyCardLeft + metrics.difficultyCardWidth + metrics.difficultyCardGap + 10,
      metrics.difficultySecondRowTop + 10
    ),
    { type: "difficulty", value: "expert" }
  );
});

test("language scene exposes back and locale actions", function () {
  const languageScene = createLanguageScene({
    canvasWidth: 375,
    canvasHeight: 812
  });
  const metrics = languageScene.getMetrics();

  assert.deepEqual(
    languageScene.hitTest(metrics.backLeft + 8, metrics.backTop + 8),
    { type: "action", value: "back" }
  );
  assert.deepEqual(
    languageScene.hitTest(metrics.optionLeft + 8, metrics.optionTop + 8),
    { type: "language", value: "zh-CN" }
  );
  assert.deepEqual(
    languageScene.hitTest(metrics.optionLeft + 8, metrics.optionTop + metrics.optionGap + metrics.optionHeight + 8),
    { type: "language", value: "en" }
  );
});

test("language scene keeps the locale actions on the centered option cards", function () {
  const languageScene = createLanguageScene({
    canvasWidth: 375,
    canvasHeight: 812
  });
  const metrics = languageScene.getMetrics();

  assert.deepEqual(
    languageScene.hitTest(metrics.optionLeft + metrics.optionWidth / 2, metrics.optionTop + metrics.optionHeight / 2),
    { type: "language", value: "zh-CN" }
  );
  assert.deepEqual(
    languageScene.hitTest(metrics.optionLeft + metrics.optionWidth / 2, metrics.optionTop + metrics.optionHeight + metrics.optionGap + metrics.optionHeight / 2),
    { type: "language", value: "en" }
  );
});

test("loadSettings falls back to the default preferred difficulty", function () {
  const settings = loadSettings({
    getStorageSync: function () {
      return "";
    }
  });

  assert.deepEqual(settings, {
    preferredDifficulty: "beginner",
    language: "zh-CN"
  });
});

test("saveSettings persists preferred difficulty and language", function () {
  const writes = [];
  const saved = saveSettings(
    {
      preferredDifficulty: "expert",
      language: "en"
    },
    {
      setStorageSync: function (key, value) {
        writes.push([key, value]);
      }
    }
  );

  assert.equal(saved, true);
  assert.equal(writes[0][0], STORAGE_KEYS.settings);
  assert.equal(writes[0][1].preferredDifficulty, "expert");
  assert.equal(writes[0][1].language, "en");
});

test("puzzle data contains all four supported difficulties", function () {
  const difficulties = puzzles.map(function (puzzle) {
    return puzzle.difficulty;
  });

  assert.deepEqual(difficulties, [
    "beginner",
    "intermediate",
    "skilled",
    "expert"
  ]);
});

test("main entry boots into the home screen using the stored language", function () {
  const texts = [];
  const originalWx = global.wx;
  const mainPath = require.resolve("../js/main");

  delete require.cache[mainPath];
  global.wx = {
    createCanvas: function () {
      return {
        width: 375,
        height: 812,
        getContext: function () {
          return {
            fillStyle: "",
            font: "",
            textAlign: "",
            textBaseline: "",
            lineWidth: 1,
            clearRect: function () {},
            fillRect: function () {},
            beginPath: function () {},
            moveTo: function () {},
            lineTo: function () {},
            stroke: function () {},
            fillText: function (text) {
              texts.push(text);
            }
          };
        }
      };
    },
    createImage: function () {
      return {
        onload: null,
        onerror: null,
        src: ""
      };
    },
    getStorageSync: function (key) {
      if (key === STORAGE_KEYS.settings) {
        return {
          preferredDifficulty: "expert",
          language: "en"
        };
      }

      return "";
    },
    onTouchStart: function () {}
  };

  try {
    assert.doesNotThrow(function () {
      require("../js/main");
    });
    assert.ok(texts.includes("方庭九屿"));
    assert.ok(texts.includes("Settings"));
    assert.ok(texts.includes("Current difficulty: Expert"));
  } finally {
    delete require.cache[mainPath];
    global.wx = originalWx;
  }
});

test("main entry can open settings from home and switch language on the dedicated language page", function () {
  const texts = [];
  const writes = [];
  const originalWx = global.wx;
  const mainPath = require.resolve("../js/main");
  let touchHandler = null;

  delete require.cache[mainPath];
  global.wx = {
    createCanvas: function () {
      return {
        width: 375,
        height: 812,
        getContext: function () {
          return {
            fillStyle: "",
            font: "",
            textAlign: "",
            textBaseline: "",
            lineWidth: 1,
            clearRect: function () {},
            fillRect: function () {},
            beginPath: function () {},
            moveTo: function () {},
            lineTo: function () {},
            stroke: function () {},
            fillText: function (text) {
              texts.push(text);
            }
          };
        }
      };
    },
    createImage: function () {
      return {
        onload: null,
        onerror: null,
        src: ""
      };
    },
    getStorageSync: function (key) {
      if (key === STORAGE_KEYS.settings) {
        return {
          preferredDifficulty: "beginner",
          language: "zh-CN"
        };
      }

      return "";
    },
    setStorageSync: function (key, value) {
      writes.push([key, value]);
    },
    onTouchStart: function (handler) {
      touchHandler = handler;
    }
  };

  try {
    require("../js/main");
    assert.equal(typeof touchHandler, "function");

    const homeScene = createHomeScene({
      canvasWidth: 375,
      canvasHeight: 812
    });
    const homeMetrics = homeScene.getMetrics({
      difficultyPickerOpen: false
    });
    const settingsScene = createSettingsScene({
      canvasWidth: 375,
      canvasHeight: 812
    });
    const settingsMetrics = settingsScene.getMetrics();
    const languageScene = createLanguageScene({
      canvasWidth: 375,
      canvasHeight: 812
    });
    const languageMetrics = languageScene.getMetrics();

    touchHandler({
      touches: [
        {
          clientX: homeMetrics.contentLeft + 20,
          clientY: homeMetrics.settingsTop + 20
        }
      ]
    });
    touchHandler({
      touches: [
        {
          clientX: settingsMetrics.languageCardLeft + 20,
          clientY: settingsMetrics.languageCardTop + 20
        }
      ]
    });
    touchHandler({
      touches: [
        {
          clientX: languageMetrics.optionLeft + 20,
          clientY: languageMetrics.optionTop + languageMetrics.optionHeight + languageMetrics.optionGap + 20
        }
      ]
    });

    assert.ok(texts.includes("Language"));
    assert.equal(writes[writes.length - 1][0], STORAGE_KEYS.settings);
    assert.equal(writes[writes.length - 1][1].language, "en");
  } finally {
    delete require.cache[mainPath];
    global.wx = originalWx;
  }
});

test("main entry can open settings from board and return without leaving the game flow", function () {
  const texts = [];
  const originalWx = global.wx;
  const mainPath = require.resolve("../js/main");
  let touchHandler = null;

  delete require.cache[mainPath];
  global.wx = {
    createCanvas: function () {
      return {
        width: 375,
        height: 812,
        getContext: function () {
          return {
            fillStyle: "",
            font: "",
            textAlign: "",
            textBaseline: "",
            lineWidth: 1,
            clearRect: function () {},
            fillRect: function () {},
            beginPath: function () {},
            moveTo: function () {},
            lineTo: function () {},
            stroke: function () {},
            fillText: function (text) {
              texts.push(text);
            }
          };
        }
      };
    },
    createImage: function () {
      return {
        onload: null,
        onerror: null,
        src: ""
      };
    },
    getStorageSync: function (key) {
      if (key === STORAGE_KEYS.settings) {
        return {
          preferredDifficulty: "expert",
          language: "zh-CN"
        };
      }

      return "";
    },
    onTouchStart: function (handler) {
      touchHandler = handler;
    }
  };

  try {
    require("../js/main");
    assert.equal(typeof touchHandler, "function");

    touchHandler({
      touches: [
        {
          clientX: 180,
          clientY: 286
        }
      ]
    });
    touchHandler({
      touches: [
        {
          clientX: 320,
          clientY: 48
        }
      ]
    });
    touchHandler({
      touches: [
        {
          clientX: 48,
          clientY: 104
        }
      ]
    });

    assert.ok(texts.includes("设置"));
    assert.ok(texts.includes("专家"));
    assert.ok(texts.includes("方庭九屿"));
  } finally {
    delete require.cache[mainPath];
    global.wx = originalWx;
  }
});

test("main entry can change preferred difficulty directly inside settings", function () {
  const writes = [];
  const originalWx = global.wx;
  const mainPath = require.resolve("../js/main");
  let touchHandler = null;

  delete require.cache[mainPath];
  global.wx = {
    createCanvas: function () {
      return {
        width: 375,
        height: 812,
        getContext: function () {
          return {
            fillStyle: "",
            font: "",
            textAlign: "",
            textBaseline: "",
            lineWidth: 1,
            clearRect: function () {},
            fillRect: function () {},
            beginPath: function () {},
            moveTo: function () {},
            lineTo: function () {},
            stroke: function () {},
            fill: function () {},
            arcTo: function () {},
            closePath: function () {},
            fillText: function () {}
          };
        }
      };
    },
    createImage: function () {
      return {
        onload: null,
        onerror: null,
        src: ""
      };
    },
    getStorageSync: function (key) {
      if (key === STORAGE_KEYS.settings) {
        return {
          preferredDifficulty: "beginner",
          language: "zh-CN"
        };
      }

      return "";
    },
    setStorageSync: function (key, value) {
      writes.push([key, value]);
    },
    onTouchStart: function (handler) {
      touchHandler = handler;
    }
  };

  try {
    require("../js/main");
    assert.equal(typeof touchHandler, "function");

    const homeScene = createHomeScene({
      canvasWidth: 375,
      canvasHeight: 812
    });
    const homeMetrics = homeScene.getMetrics({
      difficultyPickerOpen: false
    });
    const settingsScene = createSettingsScene({
      canvasWidth: 375,
      canvasHeight: 812
    });
    const settingsMetrics = settingsScene.getMetrics();

    touchHandler({
      touches: [{
        clientX: homeMetrics.contentLeft + 20,
        clientY: homeMetrics.settingsTop + 20
      }]
    });

    touchHandler({
      touches: [{
        clientX: settingsMetrics.difficultyCardLeft + settingsMetrics.difficultyCardWidth + settingsMetrics.difficultyCardGap + 20,
        clientY: settingsMetrics.difficultySecondRowTop + 20
      }]
    });

    assert.equal(writes[writes.length - 1][0], STORAGE_KEYS.settings);
    assert.equal(writes[writes.length - 1][1].preferredDifficulty, "expert");
  } finally {
    delete require.cache[mainPath];
    global.wx = originalWx;
  }
});

test("main entry switches the active game when changing difficulty inside settings", function () {
  const writes = [];
  const texts = [];
  const originalWx = global.wx;
  const mainPath = require.resolve("../js/main");
  let touchHandler = null;

  delete require.cache[mainPath];
  global.wx = {
    createCanvas: function () {
      return {
        width: 375,
        height: 812,
        getContext: function () {
          return {
            fillStyle: "",
            font: "",
            textAlign: "",
            textBaseline: "",
            lineWidth: 1,
            clearRect: function () {},
            fillRect: function () {},
            beginPath: function () {},
            moveTo: function () {},
            lineTo: function () {},
            stroke: function () {},
            fill: function () {},
            arcTo: function () {},
            closePath: function () {},
            fillText: function (text) {
              texts.push(text);
            }
          };
        }
      };
    },
    createImage: function () {
      return {
        onload: null,
        onerror: null,
        src: ""
      };
    },
    getStorageSync: function (key) {
      if (key === STORAGE_KEYS.settings) {
        return {
          preferredDifficulty: "beginner",
          language: "zh-CN"
        };
      }

      return "";
    },
    setStorageSync: function (key, value) {
      writes.push([key, value]);
    },
    onTouchStart: function (handler) {
      touchHandler = handler;
    }
  };

  try {
    require("../js/main");
    assert.equal(typeof touchHandler, "function");

    const homeScene = createHomeScene({
      canvasWidth: 375,
      canvasHeight: 812
    });
    const homeMetrics = homeScene.getMetrics({
      difficultyPickerOpen: false,
      t: createTranslator("zh-CN")
    });
    const settingsScene = createSettingsScene({
      canvasWidth: 375,
      canvasHeight: 812
    });
    const settingsMetrics = settingsScene.getMetrics();

    touchHandler({
      touches: [{
        clientX: homeMetrics.contentLeft + 20,
        clientY: homeMetrics.settingsTop + 20
      }]
    });

    touchHandler({
      touches: [{
        clientX: settingsMetrics.difficultyCardLeft + settingsMetrics.difficultyCardWidth + settingsMetrics.difficultyCardGap + 20,
        clientY: settingsMetrics.difficultySecondRowTop + 20
      }]
    });

    touchHandler({
      touches: [{
        clientX: settingsMetrics.backLeft + 12,
        clientY: settingsMetrics.backTop + 12
      }]
    });

    touchHandler({
      touches: [{
        clientX: homeMetrics.primaryButtonLeft + 20,
        clientY: homeMetrics.primaryButtonTop + 20
      }]
    });

    const savedExpertGame = writes.find(function (entry) {
      return entry[0] === STORAGE_KEYS.currentGame &&
        entry[1] &&
        entry[1].game &&
        entry[1].game.difficulty === "expert";
    });
    const savedExpertSettings = writes.find(function (entry) {
      return entry[0] === STORAGE_KEYS.settings &&
        entry[1] &&
        entry[1].preferredDifficulty === "expert";
    });

    assert.ok(savedExpertGame);
    assert.ok(savedExpertSettings);
    assert.ok(texts.includes("专家"));
  } finally {
    delete require.cache[mainPath];
    global.wx = originalWx;
  }
});

test("board scene leaves more top breathing room for the new header", function () {
  const boardScene = createBoardScene({
    canvasWidth: 375,
    canvasHeight: 812
  });
  const metrics = boardScene.getMetrics();

  assert.ok(metrics.boardTop >= 140);
});

test("theme policy exposes raised button styling for playful and pro themes", function () {
  const playful = getThemeByDifficulty("beginner");
  const pro = getThemeByDifficulty("expert");

  assert.equal(playful.buttonDepth, "soft");
  assert.equal(pro.buttonDepth, "sharp");
});

test("theme policy exposes grouped visual tokens for playful and pro modes", function () {
  const playful = getThemeByDifficulty("beginner");
  const pro = getThemeByDifficulty("expert");

  assert.equal(typeof playful.surfaceTint, "string");
  assert.equal(typeof playful.ornament, "string");
  assert.equal(typeof pro.surfaceTint, "string");
  assert.equal(typeof pro.ornament, "string");
});

test("home scene exposes a playful visual spec for beginner difficulty", function () {
  const homeScene = createHomeScene({
    canvasWidth: 375,
    canvasHeight: 812
  });
  const visualSpec = homeScene.getVisualSpec({
    selectedDifficulty: "beginner",
    t: createTranslator("zh-CN")
  });

  assert.equal(visualSpec.tone, "playful");
  assert.equal(visualSpec.brandSubtitle, "从轻松一局开始，慢慢找到节奏。");
  assert.equal(visualSpec.primaryLabel, "继续游戏");
  assert.equal(visualSpec.settingsLabel, "设置");
  assert.equal(typeof visualSpec.decorTone, "string");
});

test("home scene exposes a pro visual spec for expert difficulty", function () {
  const homeScene = createHomeScene({
    canvasWidth: 375,
    canvasHeight: 812
  });
  const visualSpec = homeScene.getVisualSpec({
    selectedDifficulty: "expert",
    t: createTranslator("en")
  });

  assert.equal(visualSpec.tone, "pro");
  assert.equal(visualSpec.brandSubtitle, "Enter a focused solving rhythm.");
  assert.equal(visualSpec.primaryLabel, "Continue");
  assert.equal(visualSpec.settingsLabel, "Settings");
  assert.equal(typeof visualSpec.decorTone, "string");
});

test("normalizeLocale falls back to zh-CN for unsupported languages", function () {
  assert.equal(DEFAULT_LOCALE, "zh-CN");
  assert.equal(normalizeLocale("en"), "en");
  assert.equal(normalizeLocale("fr"), "zh-CN");
});

test("createTranslator returns translated difficulty labels and interpolated copy", function () {
  const zh = createTranslator("zh-CN");
  const en = createTranslator("en");

  assert.equal(zh("difficulty.beginner"), "新手");
  assert.equal(en("difficulty.beginner"), "Beginner");
  assert.equal(
    zh("settings.difficultyChanged", {
      difficulty: zh("difficulty.expert")
    }),
    "已切换到专家难度，并开始新棋局。"
  );
  assert.equal(
    en("home.currentDifficulty", {
      difficulty: en("difficulty.expert")
    }),
    "Current difficulty: Expert"
  );
  assert.equal(
    en("settings.difficultyChanged", {
      difficulty: en("difficulty.expert")
    }),
    "Switched to Expert and started a new game."
  );
});
