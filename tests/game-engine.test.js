const assert = require("node:assert/strict");
const childProcess = require("node:child_process");
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
  saveSettings,
  loadStats,
  saveStats,
  loadProgress,
  saveProgress
} = require("../js/services/storage");
const {
  createCompletionSummary,
  buildCompletionTags,
  createEmptyStats,
  applyCompletionToStats
} = require("../js/services/stats-service");
const {
  createEmptyProgress,
  isDifficultyUnlocked,
  applyExamPassToProgress,
  applyPointsToProgress,
  getPointsReward,
  getUnlockCost
} = require("../js/services/progress-service");
const {
  registerShareSupport
} = require("../js/services/share-service");
const {
  validatePuzzle,
  validatePuzzleBank
} = require("../scripts/validate-puzzles");
const {
  STRUCTURE_MINIMUMS,
  groupPuzzlesByDifficulty,
  normalizePuzzleLayout,
  summarizeStructureClusters,
  findStructureShortfalls
} = require("../scripts/puzzle-structure");
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
    hintTargetIndex: 11,
    hintRelatedIndexes: [0, 36]
  });

  assert.equal(boardView[2].issue, true);
  assert.equal(boardView[11].issue, true);
  assert.equal(boardView[11].hintTarget, true);
  assert.equal(boardView[0].hintRelated, true);
  assert.equal(boardView[36].hintRelated, true);
});

test("buildBoardView maps advanced hint roles across all supported high-level techniques", function () {
  const nakedPairView = buildBoardView(createGame(puzzles.find(function (puzzle) {
    return puzzle.id === "skilled-003";
  })), -1, {
    hintTargetIndex: 0,
    hintRelatedIndexes: [1, 9],
    hintTechnique: "naked-pair",
    hintDifficulty: "skilled",
    hintContextPattern: "pair"
  });
  const boxLineView = buildBoardView(createGame(puzzles.find(function (puzzle) {
    return puzzle.id === "skilled-004";
  })), -1, {
    hintTargetIndex: 8,
    hintRelatedIndexes: [17, 26],
    hintTechnique: "box-line-reduction",
    hintDifficulty: "skilled",
    hintContextPattern: "box-line"
  });
  const xWingView = buildBoardView(createGame(puzzles.find(function (puzzle) {
    return puzzle.id === "expert-001";
  })), -1, {
    hintTargetIndex: 0,
    hintRelatedIndexes: [1, 2, 9, 18],
    hintTechnique: "x-wing",
    hintDifficulty: "expert",
    hintContextPattern: "row-column"
  });
  const xyWingView = buildBoardView(createGame(puzzles.find(function (puzzle) {
    return puzzle.id === "expert-002";
  })), -1, {
    hintTargetIndex: 55,
    hintRelatedIndexes: [56, 54],
    hintTechnique: "xy-wing",
    hintDifficulty: "expert",
    hintContextPattern: "pivot-wing"
  });

  assert.equal(nakedPairView[0].hintRole, "target");
  assert.equal(nakedPairView[1].hintRole, "related-soft");
  assert.equal(nakedPairView[9].hintRole, "related-soft");

  assert.equal(boxLineView[8].hintRole, "target");
  assert.equal(boxLineView[17].hintRole, "related-strong");
  assert.equal(boxLineView[26].hintRole, "related-strong");

  assert.equal(xWingView[0].hintRole, "target");
  assert.equal(xWingView[1].hintRole, "related-strong");
  assert.equal(xWingView[18].hintRole, "related-strong");

  assert.equal(xyWingView[55].hintRole, "target");
  assert.equal(xyWingView[56].hintRole, "related-strong");
  assert.equal(xyWingView[54].hintRole, "related-strong");
});

test("createGame copies advanced hint metadata from the puzzle", function () {
  const puzzle = {
    id: "expert-metadata",
    difficulty: "expert",
    puzzle: "000000012000000003002300000070050000000000000000040080000009600400000000830000000",
    solution: "653974812184265793792318465376852941548197236921643587215439678467581329839726154",
    techniques: ["x-wing", "xy-wing"],
    hint: {
      primaryTechnique: "x-wing",
      targetIndex: 0,
      relatedIndexes: [1, 2, 9, 18],
      context: {
        pattern: "row-column"
      }
    }
  };

  const game = createGame(puzzle);

  assert.deepEqual(game.hint, puzzle.hint);
});

test("editable operations keep advanced hint metadata intact", function () {
  const puzzle = {
    id: "skilled-metadata",
    difficulty: "skilled",
    puzzle: "030000000000500003097030000800005007070080010900700008000020870200007000000000050",
    solution: "435269781682571493197834562826195347374682915951743628519326874248957136763418259",
    techniques: ["naked-pair", "box-line-reduction"],
    hint: {
      primaryTechnique: "naked-pair",
      targetIndex: 9,
      relatedIndexes: [],
      context: {
        pattern: "pair"
      }
    }
  };

  const changed = applyInputValue(createGame(puzzle), 1, "4");

  assert.deepEqual(changed.hint, puzzle.hint);
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

test("home scene keeps the main layout slightly lower for the final visual balance", function () {
  const homeScene = createHomeScene({
    canvasWidth: 375,
    canvasHeight: 812
  });
  const metrics = homeScene.getMetrics({
    difficultyPickerOpen: false,
    t: createTranslator("zh-CN")
  });

  assert.equal(metrics.brandTop, 154);
  assert.equal(metrics.brandFrameTop, 86);
  assert.equal(metrics.brandPanelTop, 94);
  assert.equal(metrics.brandCoreTop, 104);
  assert.equal(metrics.primaryButtonTop, 274);
});

test("settings and board scenes keep their main content slightly lower", function () {
  const settingsScene = createSettingsScene({
    canvasWidth: 375,
    canvasHeight: 812
  });
  const boardScene = createBoardScene({
    canvasWidth: 375,
    canvasHeight: 812
  });
  const languageScene = createLanguageScene({
    canvasWidth: 375,
    canvasHeight: 812
  });

  assert.equal(settingsScene.getMetrics().backTop, 108);
  assert.equal(boardScene.getMetrics().headerPanelTop, 82);
  assert.equal(languageScene.getMetrics().shellTop, 144);
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
  assert.equal(runDifficultyCheck(wrong, "intermediate", zh).message, "这里有几处填写可以再核对一下。");
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
  assert.equal(firstHint.progress.current, 1);
  assert.equal(firstHint.progress.total, 4);
  assert.equal(secondHint.level, "cell");
  assert.equal(thirdHint.level, "technique");
  assert.equal(fourthHint.level, "answer");
  assert.equal(fourthHint.progress.current, 4);
  assert.equal(fourthHint.progress.total, 4);
  assert.equal(fourthHint.targetIndex, 40);
  assert.equal(fourthHint.value, game.solution[40]);
});

test("getNextHint loops beginner hints back to the first level after the answer", function () {
  const game = createGame(puzzles[0]);
  const cycledHint = getNextHint(game, "beginner", {
    currentLevel: "answer",
    targetIndex: 40
  });

  assert.equal(cycledHint.level, "direction");
  assert.equal(cycledHint.targetIndex, 40);
});

test("getNextHint prefers a real single-candidate cell over the first empty cell", function () {
  const game = createGame(puzzles[0]);
  const hint = getNextHint(game, "beginner", {
    currentLevel: null,
    targetIndex: -1
  });

  assert.equal(hint.targetIndex, 40);
  assert.equal(hint.value, "5");
});

test("getNextHint keeps expert hints at the technique level", function () {
  const expertPuzzle = puzzles.find(function (puzzle) {
    return puzzle.difficulty === "expert";
  });
  const game = createGame(expertPuzzle);
  const hint = getNextHint(game, "expert", {
    currentLevel: null,
    targetIndex: -1
  });

  assert.equal(hint.level, "technique");
  assert.equal(hint.technique, "x-wing");
  assert.equal(hint.value, game.solution[hint.targetIndex]);
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
  assert.equal(fourthHint.level, "direction");
});

test("hint engine returns localized messages", function () {
  const game = createGame(puzzles[0]);
  const expertPuzzle = puzzles.find(function (puzzle) {
    return puzzle.difficulty === "expert";
  });
  const skilledPuzzle = puzzles.find(function (puzzle) {
    return puzzle.difficulty === "skilled";
  });
  const expertGame = createGame(expertPuzzle);
  const skilledGame = createGame(skilledPuzzle);
  const boxLineSkilledGame = Object.assign({}, skilledGame, {
    hint: {
      primaryTechnique: "box-line-reduction",
      targetIndex: 0,
      relatedIndexes: [9, 18],
      context: {
        pattern: "box-line"
      }
    }
  });
  const zh = createTranslator("zh-CN");
  const en = createTranslator("en");

  assert.equal(
    getNextHint(game, "beginner", { currentLevel: null, targetIndex: -1 }, zh).message,
    "先看第5行与第5宫的交界，这里有一个数字可以先确定。"
  );
  assert.equal(
    getNextHint(game, "beginner", {
      currentLevel: "direction",
      targetIndex: 40
    }, zh).message,
    "第5行第5列这个格子已经可以确定。"
  );
  assert.equal(
    getNextHint(game, "beginner", {
      currentLevel: "cell",
      targetIndex: 40
    }, zh).message,
    "第5行第5列这个格子现在只剩一个可以填的数字。"
  );
  assert.equal(
    getNextHint(game, "beginner", {
      currentLevel: "technique",
      targetIndex: 40
    }, zh).message,
    "第5行第5列可以填写 5。"
  );
  assert.equal(
    getNextHint(game, "beginner", { currentLevel: null, targetIndex: -1 }, en).message,
    "Start with row 5 around box 5. One value can already be fixed there."
  );
  assert.equal(
    getNextHint(game, "beginner", {
      currentLevel: "direction",
      targetIndex: 40
    }, en).message,
    "The cell at row 5, column 5 can already be determined."
  );
  assert.equal(
    getNextHint(game, "beginner", {
      currentLevel: "cell",
      targetIndex: 40
    }, en).message,
    "The cell at row 5, column 5 now has only one possible number left."
  );
  assert.equal(
    getNextHint(game, "beginner", {
      currentLevel: "technique",
      targetIndex: 40
    }, en).message,
    "Row 5, column 5 can be filled with 5."
  );
  assert.equal(
    getNextHint(game, "intermediate", { currentLevel: null, targetIndex: -1 }, zh).message,
    "先从第5行与第5宫入手，这一段已经能继续推进，但先别急着直接落子。"
  );
  assert.equal(
    getNextHint(game, "intermediate", {
      currentLevel: "direction",
      targetIndex: 40
    }, zh).message,
    "先看第5行第5列，这个格子已经可以填写了。"
  );
  assert.equal(
    getNextHint(game, "intermediate", {
      currentLevel: "cell",
      targetIndex: 40
    }, zh).message,
    "第5行第5列这个格子已经收束到唯一答案，可以直接填写。"
  );
  assert.equal(
    getNextHint(game, "intermediate", { currentLevel: null, targetIndex: -1 }, en).message,
    "Start with row 5 around box 5. This segment is ready to move, but hold the placement for a moment."
  );
  assert.equal(
    getNextHint(game, "intermediate", {
      currentLevel: "direction",
      targetIndex: 40
    }, en).message,
    "Look at row 5, column 5 first. This cell can already be filled in."
  );
  assert.equal(
    getNextHint(game, "intermediate", {
      currentLevel: "cell",
      targetIndex: 40
    }, en).message,
    "The cell at row 5, column 5 has narrowed down to one answer, so it can be filled in now."
  );
  assert.equal(
    getNextHint(game, "skilled", { currentLevel: null, targetIndex: -1 }, zh).message,
    "先看第5行与第5宫的交界，只收这片范围，先别把视线放大。"
  );
  assert.equal(
    getNextHint(expertGame, "expert", { currentLevel: null, targetIndex: -1 }, en).message,
    "Compare these matched candidate positions. An X-Wing is already formed here."
  );
  assert.equal(
    getNextHint(skilledGame, "skilled", {
      currentLevel: "direction",
      targetIndex: -1
    }, en).message,
    "Focus on this paired candidate set. A Naked Pair is already in place and can narrow the grid further."
  );
  assert.equal(
    getNextHint(boxLineSkilledGame, "skilled", {
      currentLevel: "direction",
      targetIndex: -1
    }, en).message,
    "Focus on the overlap between this box and its shared band. The candidates are already collapsing onto the same band."
  );
});

test("expert technique hint wording changes with the tagged technique", function () {
  const expertPuzzle = puzzles.find(function (puzzle) {
    return puzzle.difficulty === "expert";
  });
  const expertGame = createGame(expertPuzzle);
  const xyWingGame = Object.assign({}, expertGame, {
    hint: {
      primaryTechnique: "xy-wing",
      targetIndex: 55,
      relatedIndexes: [56, 54],
      context: {
        pattern: "pivot-wing"
      }
    }
  });
  const en = createTranslator("en");

  assert.equal(
    getNextHint(expertGame, "expert", { currentLevel: null, targetIndex: -1 }, en).message,
    "Compare these matched candidate positions. An X-Wing is already formed here."
  );
  assert.equal(
    getNextHint(xyWingGame, "expert", { currentLevel: null, targetIndex: -1 }, en).message,
    "Focus on the candidate links between the pivot and its two wings. An XY-Wing is already formed here."
  );
});

test("skilled hint target selection can shift with the tagged technique", function () {
  const skilledPuzzle = puzzles.find(function (puzzle) {
    return puzzle.difficulty === "skilled";
  });
  const baseGame = createGame(skilledPuzzle);
  const nakedPairGame = Object.assign({}, baseGame, {
    hint: {
      primaryTechnique: "naked-pair",
      targetIndex: 9,
      relatedIndexes: [],
      context: {
        pattern: "pair"
      }
    }
  });
  const boxLineGame = Object.assign({}, baseGame, {
    hint: {
      primaryTechnique: "box-line-reduction",
      targetIndex: 0,
      relatedIndexes: [9, 18],
      context: {
        pattern: "box-line"
      }
    }
  });

  const nakedPairHint = getNextHint(nakedPairGame, "skilled", {
    currentLevel: null,
    targetIndex: -1
  });
  const boxLineHint = getNextHint(boxLineGame, "skilled", {
    currentLevel: null,
    targetIndex: -1
  });

  assert.equal(nakedPairHint.targetIndex, 9);
  assert.equal(boxLineHint.targetIndex, 0);
});

test("advanced hints can return related cell indexes for multi-cell highlighting", function () {
  const skilledPuzzle = puzzles.find(function (puzzle) {
    return puzzle.difficulty === "skilled";
  });
  const expertPuzzle = puzzles.find(function (puzzle) {
    return puzzle.difficulty === "expert";
  });
  const boxLineGame = Object.assign({}, createGame(skilledPuzzle), {
    hint: {
      primaryTechnique: "box-line-reduction",
      targetIndex: 0,
      relatedIndexes: [9, 18],
      context: {
        pattern: "box-line"
      }
    }
  });
  const xWingGame = Object.assign({}, createGame(expertPuzzle), {
    hint: {
      primaryTechnique: "x-wing",
      targetIndex: 0,
      relatedIndexes: [1, 2, 9, 18],
      context: {
        pattern: "row-column"
      }
    }
  });
  const xyWingGame = Object.assign({}, createGame(expertPuzzle), {
    hint: {
      primaryTechnique: "xy-wing",
      targetIndex: 55,
      relatedIndexes: [56, 54],
      context: {
        pattern: "pivot-wing"
      }
    }
  });

  const boxLineHint = getNextHint(boxLineGame, "skilled", {
    currentLevel: null,
    targetIndex: -1
  });
  const xWingHint = getNextHint(xWingGame, "expert", {
    currentLevel: null,
    targetIndex: -1
  });
  const xyWingHint = getNextHint(xyWingGame, "expert", {
    currentLevel: null,
    targetIndex: -1
  });

  assert.deepEqual(boxLineHint.relatedIndexes, [9, 18]);
  assert.deepEqual(xWingHint.relatedIndexes, [1, 2, 9, 18]);
  assert.equal(xyWingHint.targetIndex, 55);
  assert.deepEqual(xyWingHint.relatedIndexes, [56, 54]);
});

test("getNextHint prefers authoritative metadata for advanced puzzles", function () {
  const expertPuzzle = puzzles.find(function (puzzle) {
    return puzzle.id === "expert-001";
  });
  const hint = getNextHint(createGame(expertPuzzle), "expert", {
    currentLevel: null,
    targetIndex: -1,
    relatedIndexes: []
  });

  assert.equal(hint.technique, "x-wing");
  assert.equal(hint.targetIndex, 0);
  assert.deepEqual(hint.relatedIndexes, [1, 2, 9, 18]);
});

test("getNextHint falls back when advanced metadata is missing", function () {
  const skilledPuzzle = puzzles.find(function (puzzle) {
    return puzzle.id === "skilled-010";
  });
  const game = createGame(Object.assign({}, skilledPuzzle, {
    hint: null
  }));
  const hint = getNextHint(game, "skilled", {
    currentLevel: null,
    targetIndex: -1,
    relatedIndexes: []
  });

  assert.equal(hint.technique, "naked-pair");
  assert.equal(skilledPuzzle.puzzle[hint.targetIndex], "0");
  assert.equal(hint.targetIndex === skilledPuzzle.hint.targetIndex, false);
  assert.deepEqual(hint.relatedIndexes, []);
});

test("getNextHint falls back safely when advanced metadata points at a given cell", function () {
  const expertPuzzle = puzzles.find(function (puzzle) {
    return puzzle.id === "expert-001";
  });
  const brokenGame = createGame(Object.assign({}, expertPuzzle, {
    hint: {
      primaryTechnique: "x-wing",
      targetIndex: 7,
      relatedIndexes: [1, 2, 9, 18]
    }
  }));
  const hint = getNextHint(brokenGame, "expert", {
    currentLevel: null,
    targetIndex: -1,
    relatedIndexes: []
  });

  assert.notEqual(hint.targetIndex, 6);
  assert.equal(hint.level, "technique");
});

test("advanced hint copy follows hint.primaryTechnique instead of techniques[0]", function () {
  const zh = createTranslator("zh-CN");
  const expertPuzzle = puzzles.find(function (puzzle) {
    return puzzle.id === "expert-002";
  });
  const hint = getNextHint(createGame(expertPuzzle), "expert", {
    currentLevel: null,
    targetIndex: -1,
    relatedIndexes: []
  }, zh);

  assert.equal(hint.technique, "xy-wing");
  assert.equal(hint.message, "关注枢纽格与两侧翼格的候选关系；这里已形成 XY-Wing。");
});

test("new skilled hint coverage puzzles prefer authoritative metadata", function () {
  const zh = createTranslator("zh-CN");
  const puzzle003 = puzzles.find(function (puzzle) {
    return puzzle.id === "skilled-003";
  });
  const puzzle004 = puzzles.find(function (puzzle) {
    return puzzle.id === "skilled-004";
  });

  const hint003 = getNextHint(createGame(puzzle003), "skilled", {
    currentLevel: "direction",
    targetIndex: -1,
    relatedIndexes: []
  }, zh);
  const hint004 = getNextHint(createGame(puzzle004), "skilled", {
    currentLevel: "direction",
    targetIndex: -1,
    relatedIndexes: []
  }, zh);

  assert.equal(hint003.technique, "naked-pair");
  assert.equal(hint003.targetIndex, 0);
  assert.deepEqual(hint003.relatedIndexes, [1, 9]);

  assert.equal(hint004.technique, "box-line-reduction");
  assert.equal(hint004.targetIndex, 8);
  assert.deepEqual(hint004.relatedIndexes, [17, 26]);
});

test("new expert hint coverage puzzles prefer authoritative metadata", function () {
  const en = createTranslator("en");
  const puzzle003 = puzzles.find(function (puzzle) {
    return puzzle.id === "expert-003";
  });
  const puzzle004 = puzzles.find(function (puzzle) {
    return puzzle.id === "expert-004";
  });

  const hint003 = getNextHint(createGame(puzzle003), "expert", {
    currentLevel: null,
    targetIndex: -1,
    relatedIndexes: []
  }, en);
  const hint004 = getNextHint(createGame(puzzle004), "expert", {
    currentLevel: null,
    targetIndex: -1,
    relatedIndexes: []
  }, en);

  assert.equal(hint003.technique, "x-wing");
  assert.equal(hint003.targetIndex, 0);
  assert.deepEqual(hint003.relatedIndexes, [1, 2, 9, 18]);

  assert.equal(hint004.technique, "xy-wing");
  assert.equal(hint004.targetIndex, 54);
  assert.deepEqual(hint004.relatedIndexes, [45, 63]);
});

test("second-batch skilled hint coverage puzzles prefer authoritative metadata", function () {
  const zh = createTranslator("zh-CN");
  const puzzle005 = puzzles.find(function (puzzle) {
    return puzzle.id === "skilled-005";
  });
  const puzzle006 = puzzles.find(function (puzzle) {
    return puzzle.id === "skilled-006";
  });

  const hint005 = getNextHint(createGame(puzzle005), "skilled", {
    currentLevel: "direction",
    targetIndex: -1,
    relatedIndexes: []
  }, zh);
  const hint006 = getNextHint(createGame(puzzle006), "skilled", {
    currentLevel: "direction",
    targetIndex: -1,
    relatedIndexes: []
  }, zh);

  assert.equal(hint005.technique, "naked-pair");
  assert.equal(hint005.targetIndex, 9);
  assert.deepEqual(hint005.relatedIndexes, []);

  assert.equal(hint006.technique, "naked-pair");
  assert.equal(hint006.targetIndex, 9);
  assert.deepEqual(hint006.relatedIndexes, []);
});

test("second-batch expert hint coverage puzzles prefer authoritative metadata", function () {
  const en = createTranslator("en");
  const puzzle005 = puzzles.find(function (puzzle) {
    return puzzle.id === "expert-005";
  });
  const puzzle006 = puzzles.find(function (puzzle) {
    return puzzle.id === "expert-006";
  });

  const hint005 = getNextHint(createGame(puzzle005), "expert", {
    currentLevel: null,
    targetIndex: -1,
    relatedIndexes: []
  }, en);
  const hint006 = getNextHint(createGame(puzzle006), "expert", {
    currentLevel: null,
    targetIndex: -1,
    relatedIndexes: []
  }, en);

  assert.equal(hint005.technique, "x-wing");
  assert.equal(hint005.targetIndex, 0);
  assert.deepEqual(hint005.relatedIndexes, [1, 2, 9, 18]);

  assert.equal(hint006.technique, "x-wing");
  assert.equal(hint006.targetIndex, 0);
  assert.deepEqual(hint006.relatedIndexes, [1, 2, 9, 18]);
});

test("final-batch skilled hint coverage puzzles prefer authoritative metadata", function () {
  const zh = createTranslator("zh-CN");
  const puzzle009 = puzzles.find(function (puzzle) {
    return puzzle.id === "skilled-009";
  });
  const puzzle010 = puzzles.find(function (puzzle) {
    return puzzle.id === "skilled-010";
  });

  const hint009 = getNextHint(createGame(puzzle009), "skilled", {
    currentLevel: "direction",
    targetIndex: -1,
    relatedIndexes: []
  }, zh);
  const hint010 = getNextHint(createGame(puzzle010), "skilled", {
    currentLevel: "direction",
    targetIndex: -1,
    relatedIndexes: []
  }, zh);

  assert.equal(hint009.technique, "naked-pair");
  assert.equal(hint009.targetIndex, 9);
  assert.deepEqual(hint009.relatedIndexes, []);

  assert.equal(hint010.technique, "naked-pair");
  assert.equal(hint010.targetIndex, 0);
  assert.deepEqual(hint010.relatedIndexes, [1, 9]);
});

test("polish-batch skilled hint coverage puzzles prefer authoritative metadata", function () {
  const zh = createTranslator("zh-CN");
  const puzzle011 = puzzles.find(function (puzzle) {
    return puzzle.id === "skilled-011";
  });
  const puzzle012 = puzzles.find(function (puzzle) {
    return puzzle.id === "skilled-012";
  });

  const hint011 = getNextHint(createGame(puzzle011), "skilled", {
    currentLevel: "direction",
    targetIndex: -1,
    relatedIndexes: []
  }, zh);
  const hint012 = getNextHint(createGame(puzzle012), "skilled", {
    currentLevel: "direction",
    targetIndex: -1,
    relatedIndexes: []
  }, zh);

  assert.equal(hint011.technique, "box-line-reduction");
  assert.equal(hint011.targetIndex, 0);
  assert.deepEqual(hint011.relatedIndexes, [9, 18]);

  assert.equal(hint012.technique, "naked-pair");
  assert.equal(hint012.targetIndex, 0);
  assert.deepEqual(hint012.relatedIndexes, [1, 9]);
});

test("final-batch expert hint coverage puzzles prefer authoritative metadata", function () {
  const en = createTranslator("en");
  const puzzle009 = puzzles.find(function (puzzle) {
    return puzzle.id === "expert-009";
  });
  const puzzle010 = puzzles.find(function (puzzle) {
    return puzzle.id === "expert-010";
  });

  const hint009 = getNextHint(createGame(puzzle009), "expert", {
    currentLevel: null,
    targetIndex: -1,
    relatedIndexes: []
  }, en);
  const hint010 = getNextHint(createGame(puzzle010), "expert", {
    currentLevel: null,
    targetIndex: -1,
    relatedIndexes: []
  }, en);

  assert.equal(hint009.technique, "x-wing");
  assert.equal(hint009.targetIndex, 0);
  assert.deepEqual(hint009.relatedIndexes, [1, 2, 9, 18]);

  assert.equal(hint010.technique, "x-wing");
  assert.equal(hint010.targetIndex, 0);
  assert.deepEqual(hint010.relatedIndexes, [1, 2, 9, 18]);
});

test("polish-batch expert hint coverage puzzles prefer authoritative metadata", function () {
  const en = createTranslator("en");
  const puzzle011 = puzzles.find(function (puzzle) {
    return puzzle.id === "expert-011";
  });
  const puzzle012 = puzzles.find(function (puzzle) {
    return puzzle.id === "expert-012";
  });

  const hint011 = getNextHint(createGame(puzzle011), "expert", {
    currentLevel: null,
    targetIndex: -1,
    relatedIndexes: []
  }, en);
  const hint012 = getNextHint(createGame(puzzle012), "expert", {
    currentLevel: null,
    targetIndex: -1,
    relatedIndexes: []
  }, en);

  assert.equal(hint011.technique, "xy-wing");
  assert.equal(hint011.targetIndex, 0);
  assert.deepEqual(hint011.relatedIndexes, [1, 9, 36]);

  assert.equal(hint012.technique, "x-wing");
  assert.equal(hint012.targetIndex, 0);
  assert.deepEqual(hint012.relatedIndexes, [1, 2, 9, 18]);
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

test("home scene keeps locked difficulties in the picker payload", function () {
  const homeScene = createHomeScene({
    canvasWidth: 375,
    canvasHeight: 812
  });
  const metrics = homeScene.getMetrics({
    difficultyPickerOpen: true,
    selectedDifficulty: "beginner",
    t: createTranslator("zh-CN")
  });

  const lockedHit = homeScene.hitTest(
    metrics.difficultyLeft + 20,
    metrics.difficultyTop + metrics.difficultyHeight + metrics.difficultyGap + 20,
    {
      selectedDifficulty: "beginner",
      difficultyPickerOpen: true,
      difficultyStates: {
        beginner: { unlocked: true },
        intermediate: { unlocked: false },
        skilled: { unlocked: false },
        expert: { unlocked: false }
      }
    }
  );

  assert.deepEqual(lockedHit, {
    type: "locked-difficulty",
    value: "intermediate"
  });
});

test("home scene exposes initial exam difficulty actions on first entry", function () {
  const homeScene = createHomeScene({
    canvasWidth: 375,
    canvasHeight: 812
  });
  const metrics = homeScene.getMetrics({
    initialExamChoiceVisible: true,
    selectedDifficulty: "beginner",
    t: createTranslator("zh-CN")
  });

  assert.deepEqual(
    homeScene.hitTest(
      metrics.difficultyLeft + 20,
      metrics.difficultyTop + 20,
      {
        hasSavedGame: false,
        initialExamChoiceVisible: true,
        selectedDifficulty: "beginner",
        difficultyStates: {
          beginner: { unlocked: true },
          intermediate: { unlocked: false },
          skilled: { unlocked: false },
          expert: { unlocked: false }
        }
      }
    ),
    { type: "action", value: "start-initial-exam:beginner" }
  );

  assert.deepEqual(
    homeScene.hitTest(
      metrics.difficultyLeft + 20,
      metrics.difficultyTop + metrics.difficultyHeight + metrics.difficultyGap + 20,
      {
        hasSavedGame: false,
        initialExamChoiceVisible: true,
        selectedDifficulty: "beginner",
        difficultyStates: {
          beginner: { unlocked: true },
          intermediate: { unlocked: false },
          skilled: { unlocked: false },
          expert: { unlocked: false }
        }
      }
    ),
    { type: "action", value: "start-initial-exam:intermediate" }
  );
});

test("home scene exposes locked dialog actions for exam and points", function () {
  const homeScene = createHomeScene({
    canvasWidth: 375,
    canvasHeight: 812
  });
  const metrics = homeScene.getMetrics({
    selectedDifficulty: "beginner",
    lockedDifficultyDialog: {
      difficulty: "intermediate",
      mode: "actions"
    },
    t: createTranslator("zh-CN")
  });

  assert.deepEqual(
    homeScene.hitTest(
      metrics.lockedDialogExamLeft + 12,
      metrics.lockedDialogActionsTop + 12,
      {
        selectedDifficulty: "beginner",
        lockedDifficultyDialog: {
          difficulty: "intermediate",
          mode: "actions"
        }
      }
    ),
    { type: "action", value: "start-locked-exam" }
  );

  assert.deepEqual(
    homeScene.hitTest(
      metrics.lockedDialogPointsLeft + 12,
      metrics.lockedDialogActionsTop + 12,
      {
        selectedDifficulty: "beginner",
        lockedDifficultyDialog: {
          difficulty: "intermediate",
          mode: "actions"
        }
      }
    ),
    { type: "action", value: "view-locked-points" }
  );
});

test("home scene gives the locked difficulty dialog more vertical breathing room", function () {
  const homeScene = createHomeScene({
    canvasWidth: 375,
    canvasHeight: 812
  });
  const metrics = homeScene.getMetrics({
    selectedDifficulty: "beginner",
    lockedDifficultyDialog: {
      difficulty: "intermediate",
      mode: "actions"
    },
    t: createTranslator("zh-CN")
  });

  assert.equal(metrics.lockedDialogCardHeight, 176);
  assert.equal(metrics.lockedDialogActionsTop - metrics.lockedDialogCardTop, 128);
  assert.equal(metrics.lockedDialogActionHeight, 28);
});

test("home scene initial exam choice does not show lock copy", function () {
  const texts = [];
  const homeScene = createHomeScene({
    canvasWidth: 375,
    canvasHeight: 812
  });
  const context = {
    fillStyle: "",
    font: "",
    textAlign: "",
    textBaseline: "",
    lineWidth: 1,
    beginPath: function () {},
    moveTo: function () {},
    lineTo: function () {},
    arcTo: function () {},
    closePath: function () {},
    fillRect: function () {},
    fill: function () {},
    stroke: function () {},
    fillText: function (text) {
      texts.push(String(text));
    }
  };

  homeScene.draw(context, {
    hasSavedGame: false,
    selectedDifficulty: "beginner",
    initialExamChoiceVisible: true,
    difficultyStates: {
      beginner: { unlocked: true },
      intermediate: { unlocked: false },
      skilled: { unlocked: false },
      expert: { unlocked: false }
    },
    t: createTranslator("zh-CN")
  });

  assert.equal(texts.includes("LOCK"), false);
  assert.equal(texts.includes("难度测试"), true);
  assert.equal(texts.includes("点击开始"), true);
});

test("home scene does not depend on difficulty image assets when they are available", function () {
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

  assert.equal(drawCalls.includes("beginner"), false);
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

test("home scene no longer exposes a hidden debug near-complete action on the title area", function () {
  const homeScene = createHomeScene({
    canvasWidth: 375,
    canvasHeight: 812
  });
  const metrics = homeScene.getMetrics();

  assert.equal(
    homeScene.hitTest(metrics.contentLeft + metrics.contentWidth / 2, metrics.brandTop, {
      debugShortcutEnabled: true
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

  assert.ok(metrics.primaryButtonTop > 262);
  assert.ok(metrics.primaryButtonTop < 287);
  assert.ok(metrics.returnCardTop - metrics.secondaryButtonTop < 76);
  assert.ok(metrics.difficultyTop - metrics.returnCardTop < 138);
  assert.ok(metrics.settingsTop - metrics.difficultyTop < 104);
  assert.ok(metrics.footerTop - metrics.settingsTop < 80);
});

test("home scene can show a recent completion summary under the footer status", function () {
  const homeScene = createHomeScene({
    canvasWidth: 375,
    canvasHeight: 812
  });
  const drawnTexts = [];

  homeScene.draw({
    fillStyle: "",
    font: "",
    textAlign: "",
    textBaseline: "",
    lineWidth: 1,
    strokeStyle: "",
    clearRect: function () {},
    fillRect: function () {},
    fillText: function (text) {
      drawnTexts.push(String(text));
    },
    beginPath: function () {},
    moveTo: function () {},
    lineTo: function () {},
    closePath: function () {},
    fill: function () {},
    stroke: function () {}
  }, {
    hasSavedGame: true,
    selectedDifficulty: "expert",
    recentSummary: "最近完成：专家 · 280s · 连续 2 天",
    t: createTranslator("zh-CN")
  });

  assert.ok(drawnTexts.includes("最近完成：专家 · 280s · 连续 2 天"));
});

test("home scene surfaces a return-loop module with streak and result tags", function () {
  const homeScene = createHomeScene({
    canvasWidth: 375,
    canvasHeight: 812
  });
  const drawnTexts = [];

  homeScene.draw({
    fillStyle: "",
    font: "",
    textAlign: "",
    textBaseline: "",
    lineWidth: 1,
    strokeStyle: "",
    clearRect: function () {},
    fillRect: function () {},
    fillText: function (text) {
      drawnTexts.push(String(text));
    },
    beginPath: function () {},
    moveTo: function () {},
    lineTo: function () {},
    closePath: function () {},
    fill: function () {},
    stroke: function () {}
  }, {
    hasSavedGame: true,
    selectedDifficulty: "expert",
    recentSummary: "最近完成：专家 · 280s · 连续 2 天",
    homeReturnCard: {
      title: "最近一局",
      summary: "专家 · 280s",
      streakLabel: "连续 2 天",
      tags: ["零错误", "零提示"],
      prompt: "继续这局，或者马上再开一局。"
    },
    t: createTranslator("zh-CN")
  });

  assert.ok(drawnTexts.includes("最近一局"));
  assert.ok(drawnTexts.includes("专家 · 280s"));
  assert.ok(drawnTexts.includes("连续 2 天"));
  assert.ok(drawnTexts.includes("零错误"));
  assert.ok(drawnTexts.includes("零提示"));
  assert.ok(drawnTexts.includes("继续这局，或者马上再开一局。"));
});

test("home scene keeps the return-loop card secondary to the primary actions", function () {
  const homeScene = createHomeScene({
    canvasWidth: 375,
    canvasHeight: 812
  });
  const fontCalls = [];
  const context = {
    _font: "",
    fillStyle: "",
    textAlign: "",
    textBaseline: "",
    lineWidth: 1,
    strokeStyle: "",
    clearRect: function () {},
    fillRect: function () {},
    beginPath: function () {},
    moveTo: function () {},
    lineTo: function () {},
    closePath: function () {},
    fill: function () {},
    stroke: function () {},
    fillText: function (text) {
      fontCalls.push([String(text), this.font]);
    }
  };

  Object.defineProperty(context, "font", {
    get: function () {
      return this._font;
    },
    set: function (value) {
      this._font = value;
    }
  });

  homeScene.draw(context, {
    hasSavedGame: true,
    selectedDifficulty: "expert",
    homeReturnCard: {
      title: "最近一局",
      summary: "专家 · 280s",
      streakLabel: "连续 2 天",
      tags: ["零错误", "零提示"],
      prompt: "继续这局，或者马上再开一局。"
    },
    t: createTranslator("zh-CN")
  });

  assert.ok(fontCalls.some(function (entry) {
    return entry[0] === "继续游戏" && /bold 19px/.test(entry[1]);
  }));
  assert.ok(fontCalls.some(function (entry) {
    return entry[0] === "最近一局" && /12px/.test(entry[1]);
  }));
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
  assert.equal(typeof playfulSpec.accentInnerFill, "string");
  assert.equal(typeof proSpec.brandFrameFill, "string");
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

test("board scene renders exam status and remaining time labels", function () {
  const boardScene = createBoardScene({
    canvasWidth: 375,
    canvasHeight: 812
  });
  const texts = [];
  const context = {
    fillStyle: "",
    font: "",
    textAlign: "",
    textBaseline: "",
    lineWidth: 1,
    fillRect: function () {},
    beginPath: function () {},
    moveTo: function () {},
    lineTo: function () {},
    stroke: function () {},
    fill: function () {},
    fillText: function (text) {
      texts.push(text);
    }
  };

  boardScene.draw(context, buildBoardView(createGame(puzzles[0]), -1), {
    theme: getThemeByDifficulty("beginner"),
    feedbackMessage: "考试未通过",
    feedbackType: "warning",
    examState: {
      active: true,
      failed: true,
      remainingLabel: "剩余 00:00"
    },
    t: createTranslator("zh-CN"),
    title: "方庭九屿",
    difficultyLabel: "新手",
    timerLabel: "计时 00:15",
    settingsLabel: "设置"
  });

  assert.ok(texts.includes("考试未通过"));
  assert.ok(texts.includes("剩余 00:00"));
});

test("board scene keeps givens dark while editable digits use the softer accent color", function () {
  const boardScene = createBoardScene({
    canvasWidth: 375,
    canvasHeight: 812
  });
  const game = createGame(puzzles[0]);
  const coloredGame = applyInputValue(game, 2, "4");
  const cells = buildBoardView(coloredGame, -1);
  const fillCalls = [];
  const textCalls = [];
  const context = {
    _fillStyle: "",
    font: "",
    textAlign: "",
    textBaseline: "",
    lineWidth: 1,
    fillRect: function () {},
    beginPath: function () {},
    moveTo: function () {},
    lineTo: function () {},
    stroke: function () {},
    fill: function () {},
    fillText: function (text) {
      fillCalls.push(this.fillStyle);
      textCalls.push(String(text));
    }
  };

  Object.defineProperty(context, "fillStyle", {
    get: function () {
      return this._fillStyle;
    },
    set: function (value) {
      this._fillStyle = value;
    }
  });

  boardScene.draw(context, cells, {
    theme: getThemeByDifficulty("beginner"),
    feedbackMessage: "",
    feedbackType: "info",
    completionSummary: null,
    completionVisible: false,
    statsOverlayVisible: false,
    statsSnapshot: null,
    t: createTranslator("zh-CN"),
    title: "方庭九屿",
    difficultyLabel: "新手",
    settingsLabel: "设置"
  });

  const givenDigitIndex = textCalls.indexOf("5");
  const editableDigitIndex = textCalls.indexOf("4");

  assert.ok(givenDigitIndex >= 0);
  assert.ok(editableDigitIndex >= 0);
  assert.equal(fillCalls[givenDigitIndex], "#1f2933");
  assert.equal(fillCalls[editableDigitIndex], "#8A5F45");
});

test("board scene exposes layered completion actions by difficulty", function () {
  const boardScene = createBoardScene({
    canvasWidth: 375,
    canvasHeight: 812
  });

  const beginnerActions = boardScene.getCompletionActions({
    difficulty: "beginner"
  });
  const expertActions = boardScene.getCompletionActions({
    difficulty: "expert"
  });

  assert.deepEqual(beginnerActions, ["new-game", "home"]);
  assert.deepEqual(expertActions, ["new-game", "home", "stats"]);
});

test("board scene wraps long feedback messages into multiple lines", function () {
  const boardScene = createBoardScene({
    canvasWidth: 375,
    canvasHeight: 812
  });
  const cells = buildBoardView(createGame(puzzles[0]), -1);
  const feedbackDraws = [];
  const context = {
    fillStyle: "",
    font: "",
    textAlign: "",
    textBaseline: "",
    lineWidth: 1,
    strokeStyle: "",
    beginPath: function () {},
    moveTo: function () {},
    lineTo: function () {},
    closePath: function () {},
    fill: function () {},
    stroke: function () {},
    fillRect: function () {},
    measureText: function (text) {
      return { width: String(text).length * 9 };
    },
    fillText: function (text, x, y) {
      if (String(text).indexOf("提示") >= 0 || String(text).indexOf("需要") >= 0) {
        feedbackDraws.push({ text: text, x: x, y: y });
      }
    }
  };

  boardScene.draw(context, cells, {
    theme: {},
    feedbackMessage: "提示文案需要在这里自动换行，避免一整句被挤在同一行里影响阅读，也让较长的策略提示、技巧提示和答案提示在窄屏设备上保持清晰稳定。",
    feedbackType: "info",
    completionSummary: null,
    completionVisible: false,
    statsOverlayVisible: false,
    statsSnapshot: null,
    t: createTranslator("zh-CN"),
    title: "方庭九屿",
    difficultyLabel: "新手",
    settingsLabel: "设置"
  });

  assert.ok(feedbackDraws.length >= 2);
});

test("board scene shows hint progress inside the feedback panel", function () {
  const boardScene = createBoardScene({
    canvasWidth: 375,
    canvasHeight: 812
  });
  const cells = buildBoardView(createGame(puzzles[0]), -1);
  const drawnTexts = [];
  const context = {
    fillStyle: "",
    font: "",
    textAlign: "",
    textBaseline: "",
    lineWidth: 1,
    strokeStyle: "",
    beginPath: function () {},
    moveTo: function () {},
    lineTo: function () {},
    closePath: function () {},
    fill: function () {},
    stroke: function () {},
    fillRect: function () {},
    measureText: function (text) {
      return { width: String(text).length * 9 };
    },
    fillText: function (text) {
      drawnTexts.push(String(text));
    }
  };

  boardScene.draw(context, cells, {
    theme: {},
    feedbackMessage: "先看这一片区域。",
    feedbackType: "info",
    hintProgress: {
      current: 2,
      total: 4
    },
    completionSummary: null,
    completionVisible: false,
    statsOverlayVisible: false,
    statsSnapshot: null,
    t: createTranslator("zh-CN"),
    title: "方庭九屿",
    difficultyLabel: "新手",
    settingsLabel: "设置"
  });

  assert.ok(drawnTexts.includes("2/4"));
});

test("board scene keeps hint progress visually lighter than the feedback text", function () {
  const boardScene = createBoardScene({
    canvasWidth: 375,
    canvasHeight: 812
  });
  const cells = buildBoardView(createGame(puzzles[0]), -1);
  const fontCalls = [];
  const context = {
    _font: "",
    fillStyle: "",
    textAlign: "",
    textBaseline: "",
    lineWidth: 1,
    strokeStyle: "",
    beginPath: function () {},
    moveTo: function () {},
    lineTo: function () {},
    closePath: function () {},
    fill: function () {},
    stroke: function () {},
    fillRect: function () {},
    measureText: function (text) {
      return { width: String(text).length * 9 };
    },
    fillText: function (text) {
      fontCalls.push([String(text), this.font]);
    }
  };

  Object.defineProperty(context, "font", {
    get: function () {
      return this._font;
    },
    set: function (value) {
      this._font = value;
    }
  });

  boardScene.draw(context, cells, {
    theme: {},
    feedbackMessage: "先看这一片区域。",
    feedbackType: "info",
    hintProgress: {
      current: 2,
      total: 4
    },
    completionSummary: null,
    completionVisible: false,
    statsOverlayVisible: false,
    statsSnapshot: null,
    t: createTranslator("zh-CN"),
    title: "方庭九屿",
    difficultyLabel: "新手",
    settingsLabel: "设置"
  });

  assert.ok(fontCalls.some(function (entry) {
    return entry[0] === "先看这一片区域。" && /15px/.test(entry[1]);
  }));
  assert.ok(fontCalls.some(function (entry) {
    return entry[0] === "2/4" && /11px/.test(entry[1]);
  }));
});

test("board scene wraps hint text earlier when progress occupies the top-right corner", function () {
  const boardScene = createBoardScene({
    canvasWidth: 375,
    canvasHeight: 812
  });
  const cells = buildBoardView(createGame(puzzles[0]), -1);
  const feedbackMessage = "alpha beta gamma delta";
  
  function countFeedbackLines(hintProgress) {
    const messageDraws = [];
    const context = {
      fillStyle: "",
      font: "",
      textAlign: "",
      textBaseline: "",
      lineWidth: 1,
      strokeStyle: "",
      beginPath: function () {},
      moveTo: function () {},
      lineTo: function () {},
      closePath: function () {},
      fill: function () {},
      stroke: function () {},
      fillRect: function () {},
      measureText: function (text) {
        return { width: String(text).length * 13 };
      },
      fillText: function (text, x, y) {
        const value = String(text);

        if (feedbackMessage.indexOf(value) >= 0) {
          messageDraws.push({
            text: value,
            x: x,
            y: y
          });
        }
      }
    };

    boardScene.draw(context, cells, {
      theme: {},
      feedbackMessage: feedbackMessage,
      feedbackType: "info",
      hintProgress: hintProgress,
      completionSummary: null,
      completionVisible: false,
      statsOverlayVisible: false,
      statsSnapshot: null,
      t: createTranslator("zh-CN"),
      title: "方庭九屿",
      difficultyLabel: "新手",
      settingsLabel: "设置"
    });

    return messageDraws.length;
  }

  const withoutProgressLines = countFeedbackLines(null);
  const withProgressLines = countFeedbackLines({
    current: 1,
    total: 4
  });

  assert.ok(withProgressLines > withoutProgressLines);
});

test("board scene stats overlay shows completion count and average hints for the active difficulty", function () {
  const boardScene = createBoardScene({
    canvasWidth: 375,
    canvasHeight: 812
  });
  const cells = buildBoardView(createGame(puzzles[0]), -1);
  const drawnTexts = [];
  const context = {
    fillStyle: "",
    font: "",
    textAlign: "",
    textBaseline: "",
    lineWidth: 1,
    strokeStyle: "",
    beginPath: function () {},
    moveTo: function () {},
    lineTo: function () {},
    closePath: function () {},
    fill: function () {},
    stroke: function () {},
    fillRect: function () {},
    measureText: function (text) {
      return { width: String(text).length * 9 };
    },
    fillText: function (text) {
      drawnTexts.push(String(text));
    }
  };

  boardScene.draw(context, cells, {
    theme: {},
    feedbackMessage: "",
    feedbackType: "info",
    hintProgress: null,
    completionSummary: {
      difficulty: "expert"
    },
    completionVisible: false,
    statsOverlayVisible: true,
    statsSnapshot: {
      totalCompleted: 6,
      bestTimeByDifficulty: {
        beginner: 0,
        intermediate: 0,
        skilled: 0,
        expert: 280
      },
      averageTimeByDifficulty: {
        beginner: 0,
        intermediate: 0,
        skilled: 0,
        expert: 360
      },
      completionCountByDifficulty: {
        beginner: 0,
        intermediate: 0,
        skilled: 0,
        expert: 3
      },
      hintCountByDifficulty: {
        beginner: 0,
        intermediate: 0,
        skilled: 0,
        expert: 6
      }
    },
    t: createTranslator("zh-CN"),
    title: "方庭九屿",
    difficultyLabel: "专家",
    settingsLabel: "设置"
  });

  assert.ok(drawnTexts.includes("当前难度完成 3"));
  assert.ok(drawnTexts.includes("当前难度平均提示 2"));
});

test("board scene stats overlay shows current and best streak values", function () {
  const boardScene = createBoardScene({
    canvasWidth: 375,
    canvasHeight: 812
  });
  const cells = buildBoardView(createGame(puzzles[0]), -1);
  const drawnTexts = [];
  const context = {
    fillStyle: "",
    font: "",
    textAlign: "",
    textBaseline: "",
    lineWidth: 1,
    strokeStyle: "",
    beginPath: function () {},
    moveTo: function () {},
    lineTo: function () {},
    closePath: function () {},
    fill: function () {},
    stroke: function () {},
    fillRect: function () {},
    measureText: function (text) {
      return { width: String(text).length * 9 };
    },
    fillText: function (text) {
      drawnTexts.push(String(text));
    }
  };

  boardScene.draw(context, cells, {
    theme: {},
    feedbackMessage: "",
    feedbackType: "info",
    hintProgress: null,
    completionSummary: {
      difficulty: "expert"
    },
    completionVisible: false,
    statsOverlayVisible: true,
    statsSnapshot: {
      totalCompleted: 6,
      currentStreakDays: 2,
      bestStreakDays: 5,
      bestTimeByDifficulty: {
        beginner: 0,
        intermediate: 0,
        skilled: 0,
        expert: 280
      },
      averageTimeByDifficulty: {
        beginner: 0,
        intermediate: 0,
        skilled: 0,
        expert: 360
      },
      completionCountByDifficulty: {
        beginner: 0,
        intermediate: 0,
        skilled: 0,
        expert: 3
      },
      hintCountByDifficulty: {
        beginner: 0,
        intermediate: 0,
        skilled: 0,
        expert: 6
      }
    },
    t: createTranslator("zh-CN"),
    title: "方庭九屿",
    difficultyLabel: "专家",
    settingsLabel: "设置"
  });

  assert.ok(drawnTexts.includes("当前连续 2 天"));
  assert.ok(drawnTexts.includes("最佳连续 5 天"));
});

test("settings scene exposes back, language toggle, and restart actions", function () {
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
    settingsScene.hitTest(metrics.languageCardLeft + 8, metrics.languageCardTop + 8, {
      languagePickerOpen: false
    }),
    { type: "action", value: "toggle-language-picker" }
  );
  assert.deepEqual(
    settingsScene.hitTest(metrics.contentLeft + 8, metrics.restartCardTop + 8),
    { type: "action", value: "restart-game" }
  );
});

test("settings scene exposes a resume action when opened from the board", function () {
  const settingsScene = createSettingsScene({
    canvasWidth: 375,
    canvasHeight: 812
  });
  const metrics = settingsScene.getMetrics({
    showResumeAction: true,
    t: createTranslator("zh-CN")
  });

  assert.deepEqual(
    settingsScene.hitTest(
      metrics.contentLeft + 20,
      metrics.resumeCardTop + 20,
      {
        showResumeAction: true
      }
    ),
    { type: "action", value: "resume-game" }
  );
});

test("settings scene keeps the language action on the centered main card", function () {
  const settingsScene = createSettingsScene({
    canvasWidth: 375,
    canvasHeight: 812
  });
  const metrics = settingsScene.getMetrics();

  assert.deepEqual(
    settingsScene.hitTest(
      metrics.languageCardLeft + metrics.languageCardWidth / 2,
      metrics.languageCardTop + metrics.languageCardHeight / 2,
      { languagePickerOpen: false }
    ),
    { type: "action", value: "toggle-language-picker" }
  );
  assert.deepEqual(
    settingsScene.hitTest(metrics.contentLeft + metrics.contentWidth / 2, metrics.restartCardTop + metrics.restartCardHeight / 2),
    { type: "action", value: "restart-game" }
  );
});

test("settings scene disables restart and difficulty actions during exam restriction", function () {
  const settingsScene = createSettingsScene({
    canvasWidth: 375,
    canvasHeight: 812
  });
  const metrics = settingsScene.getMetrics();
  const examRestrictedState = {
    examSettingsRestricted: true
  };

  assert.deepEqual(
    settingsScene.hitTest(metrics.backLeft + 8, metrics.backTop + 8, examRestrictedState),
    { type: "action", value: "back" }
  );
  assert.deepEqual(
    settingsScene.hitTest(metrics.languageCardLeft + 8, metrics.languageCardTop + 8, examRestrictedState),
    { type: "action", value: "toggle-language-picker" }
  );
  assert.deepEqual(
    settingsScene.hitTest(metrics.contentLeft + 8, metrics.restartCardTop + 8, examRestrictedState),
    { type: "action", value: "exit-exam" }
  );
  assert.equal(
    settingsScene.hitTest(metrics.difficultyCardLeft + 10, metrics.difficultyCardTop + 10, examRestrictedState),
    null
  );
});

test("settings scene disables locked difficulties outside exams", function () {
  const settingsScene = createSettingsScene({
    canvasWidth: 375,
    canvasHeight: 812
  });
  const metrics = settingsScene.getMetrics();
  const lockedDifficultyState = {
    selectedDifficulty: "beginner",
    difficultyStates: {
      beginner: { unlocked: true },
      intermediate: { unlocked: false },
      skilled: { unlocked: false },
      expert: { unlocked: false }
    }
  };

  assert.equal(
    settingsScene.hitTest(
      metrics.difficultyCardLeft + metrics.difficultyCardWidth + metrics.difficultyCardGap + 10,
      metrics.difficultyCardTop + 10,
      lockedDifficultyState
    ),
    null
  );
  assert.deepEqual(
    settingsScene.hitTest(
      metrics.difficultyCardLeft + 10,
      metrics.difficultyCardTop + 10,
      lockedDifficultyState
    ),
    { type: "difficulty", value: "beginner" }
  );
});

test("language scene exposes compact language options", function () {
  const languageScene = createLanguageScene({
    canvasWidth: 375,
    canvasHeight: 812
  });
  const metrics = languageScene.getMetrics();

  assert.deepEqual(
    languageScene.hitTest(metrics.optionLeft + 20, metrics.optionTop + 20),
    { type: "language", value: "zh-CN" }
  );
  assert.deepEqual(
    languageScene.hitTest(
      metrics.optionLeft + 20,
      metrics.optionTop + metrics.optionHeight + metrics.optionGap + 20
    ),
    { type: "language", value: "en" }
  );
  assert.equal(metrics.optionWidth < metrics.contentWidth, true);
});

test("language scene exposes three language options", function () {
  const languageScene = createLanguageScene({
    canvasWidth: 375,
    canvasHeight: 812
  });
  const metrics = languageScene.getMetrics();

  assert.deepEqual(
    languageScene.hitTest(
      metrics.optionLeft + 20,
      metrics.optionTop + (metrics.optionHeight + metrics.optionGap) * 2 + 20
    ),
    { type: "language", value: "ja" }
  );
});

test("settings scene shows Japanese as the current language label", function () {
  const settingsScene = createSettingsScene({
    canvasWidth: 375,
    canvasHeight: 812
  });
  const drawnTexts = [];

  settingsScene.draw({
    fillStyle: "",
    font: "",
    textAlign: "",
    textBaseline: "",
    lineWidth: 1,
    strokeStyle: "",
    beginPath: function () {},
    moveTo: function () {},
    lineTo: function () {},
    closePath: function () {},
    fill: function () {},
    stroke: function () {},
    fillRect: function () {},
    fillText: function (text) {
      drawnTexts.push(String(text));
    }
  }, {
    language: "ja",
    selectedDifficulty: "beginner",
    t: createTranslator("ja")
  });

  assert.ok(drawnTexts.includes("日本語"));
});

test("board scene localizes streak labels inside stats overlay for Japanese", function () {
  const boardScene = createBoardScene({
    canvasWidth: 375,
    canvasHeight: 812
  });
  const cells = buildBoardView(createGame(puzzles[0]), -1);
  const drawnTexts = [];
  const context = {
    fillStyle: "",
    font: "",
    textAlign: "",
    textBaseline: "",
    lineWidth: 1,
    strokeStyle: "",
    beginPath: function () {},
    moveTo: function () {},
    lineTo: function () {},
    closePath: function () {},
    fill: function () {},
    stroke: function () {},
    fillRect: function () {},
    measureText: function (text) {
      return { width: String(text).length * 9 };
    },
    fillText: function (text) {
      drawnTexts.push(String(text));
    }
  };

  boardScene.draw(context, cells, {
    theme: {},
    feedbackMessage: "",
    feedbackType: "info",
    hintProgress: null,
    completionSummary: {
      difficulty: "expert"
    },
    completionVisible: false,
    statsOverlayVisible: true,
    statsSnapshot: {
      totalCompleted: 6,
      currentStreakDays: 2,
      bestStreakDays: 5,
      bestTimeByDifficulty: {
        beginner: 0,
        intermediate: 0,
        skilled: 0,
        expert: 280
      },
      averageTimeByDifficulty: {
        beginner: 0,
        intermediate: 0,
        skilled: 0,
        expert: 360
      },
      completionCountByDifficulty: {
        beginner: 0,
        intermediate: 0,
        skilled: 0,
        expert: 3
      },
      hintCountByDifficulty: {
        beginner: 0,
        intermediate: 0,
        skilled: 0,
        expert: 6
      }
    },
    t: createTranslator("ja"),
    title: "方庭九屿",
    difficultyLabel: "上級者向け",
    settingsLabel: "設定"
  });

  assert.ok(drawnTexts.includes("現在の連続 2日"));
  assert.ok(drawnTexts.includes("最長連続 5日"));
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

test("settings scene keeps the ink-paper palette for pro difficulties", function () {
  const settingsScene = createSettingsScene({
    canvasWidth: 375,
    canvasHeight: 812
  });

  assert.equal(
    settingsScene.getVisualSpec({ selectedDifficulty: "expert" }).background,
    "#f2f1ea"
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

test("createCompletionSummary builds layered completion data", function () {
  const zh = createTranslator("zh-CN");
  const summary = createCompletionSummary({
    difficulty: "expert",
    elapsedSeconds: 428,
    hintCount: 0,
    checkCount: 0,
    mistakeCount: 0,
    completedAt: "2026-06-09T10:00:00.000Z",
    t: zh
  });

  assert.equal(summary.difficulty, "expert");
  assert.equal(summary.elapsedSeconds, 428);
  assert.equal(summary.title, "已完成本局");
  assert.equal(summary.encouragement, "这是一局很克制的完成。");
  assert.deepEqual(summary.resultTags, ["零提示", "零错误", "一次完成"]);
});

test("createCompletionSummary localizes tags for Japanese", function () {
  const ja = createTranslator("ja");
  const summary = createCompletionSummary({
    difficulty: "expert",
    elapsedSeconds: 428,
    hintCount: 0,
    checkCount: 0,
    mistakeCount: 0,
    completedAt: "2026-06-09T10:00:00.000Z",
    t: ja
  });

  assert.equal(summary.title, "盤面をクリアしました");
  assert.deepEqual(summary.resultTags, ["ヒントなし", "ミスなし", "一発クリア"]);
});

test("buildCompletionTags can omit one-shot badge when checks already happened", function () {
  const tags = buildCompletionTags({
    hintCount: 0,
    checkCount: 2,
    mistakeCount: 0
  });

  assert.deepEqual(tags, ["零提示", "零错误"]);
});

test("applyCompletionToStats updates totals and best time by difficulty", function () {
  const summary = createCompletionSummary({
    difficulty: "skilled",
    elapsedSeconds: 380,
    hintCount: 1,
    checkCount: 3,
    mistakeCount: 1,
    completedAt: "2026-06-09T10:00:00.000Z"
  });
  const nextStats = applyCompletionToStats(createEmptyStats(), summary);

  assert.equal(nextStats.totalCompleted, 1);
  assert.equal(nextStats.lastCompletedAt, "2026-06-09T10:00:00.000Z");
  assert.equal(nextStats.bestTimeByDifficulty.skilled, 380);
  assert.equal(nextStats.averageTimeByDifficulty.skilled, 380);
  assert.equal(nextStats.completionCountByDifficulty.skilled, 1);
  assert.equal(nextStats.hintCountByDifficulty.skilled, 1);
  assert.equal(nextStats.currentStreakDays, 1);
  assert.equal(nextStats.bestStreakDays, 1);
  assert.equal(nextStats.lastCompletedDifficulty, "skilled");
  assert.equal(nextStats.lastElapsedSeconds, 380);
});

test("applyCompletionToStats extends or resets streaks based on completion date", function () {
  const baseStats = Object.assign(createEmptyStats(), {
    totalCompleted: 3,
    lastCompletedAt: "2026-06-08T10:00:00.000Z",
    currentStreakDays: 2,
    bestStreakDays: 2
  });
  const continued = applyCompletionToStats(baseStats, createCompletionSummary({
    difficulty: "expert",
    elapsedSeconds: 300,
    hintCount: 1,
    checkCount: 0,
    mistakeCount: 0,
    completedAt: "2026-06-09T08:00:00.000Z"
  }));
  const reset = applyCompletionToStats(baseStats, createCompletionSummary({
    difficulty: "expert",
    elapsedSeconds: 300,
    hintCount: 1,
    checkCount: 0,
    mistakeCount: 0,
    completedAt: "2026-06-11T08:00:00.000Z"
  }));

  assert.equal(continued.currentStreakDays, 3);
  assert.equal(continued.bestStreakDays, 3);
  assert.equal(reset.currentStreakDays, 1);
  assert.equal(reset.bestStreakDays, 2);
});

test("loadStats falls back to an empty stats snapshot and saveStats persists it", function () {
  const writes = [];
  const loaded = loadStats({
    getStorageSync: function () {
      return "";
    }
  });
  const saved = saveStats(loaded, {
    setStorageSync: function (key, value) {
      writes.push([key, value]);
    }
  });

  assert.equal(loaded.totalCompleted, 0);
  assert.equal(saved, true);
  assert.equal(writes[0][0], STORAGE_KEYS.stats);
});

test("loadStats backfills newer stat fields for older saved snapshots", function () {
  const loaded = loadStats({
    getStorageSync: function () {
      return {
        totalCompleted: 3,
        lastCompletedAt: "2026-06-09T10:00:00.000Z",
        bestTimeByDifficulty: {
          beginner: 120,
          intermediate: 0,
          skilled: 0,
          expert: 0
        },
        averageTimeByDifficulty: {
          beginner: 180,
          intermediate: 0,
          skilled: 0,
          expert: 0
        },
        completionCountByDifficulty: {
          beginner: 3,
          intermediate: 0,
          skilled: 0,
          expert: 0
        },
        totalTimeByDifficulty: {
          beginner: 540,
          intermediate: 0,
          skilled: 0,
          expert: 0
        }
      };
    }
  });

  assert.equal(loaded.totalCompleted, 3);
  assert.equal(loaded.bestTimeByDifficulty.beginner, 120);
  assert.equal(loaded.hintCountByDifficulty.beginner, 0);
});

test("createEmptyProgress starts with only beginner unlocked", function () {
  const progress = createEmptyProgress();

  assert.deepEqual(progress.unlockedDifficulties, ["beginner"]);
  assert.equal(progress.totalPoints, 0);
  assert.equal(progress.examRecordByDifficulty.intermediate.passed, false);
});

test("applyExamPassToProgress unlocks current and lower difficulties", function () {
  const progress = applyExamPassToProgress(createEmptyProgress(), "skilled");

  assert.equal(isDifficultyUnlocked(progress, "beginner"), true);
  assert.equal(isDifficultyUnlocked(progress, "intermediate"), true);
  assert.equal(isDifficultyUnlocked(progress, "skilled"), true);
  assert.equal(isDifficultyUnlocked(progress, "expert"), false);
});

test("applyPointsToProgress unlocks difficulties by threshold order", function () {
  const progress = applyPointsToProgress(createEmptyProgress(), 260);

  assert.equal(progress.totalPoints, 260);
  assert.equal(isDifficultyUnlocked(progress, "intermediate"), true);
  assert.equal(isDifficultyUnlocked(progress, "skilled"), true);
  assert.equal(isDifficultyUnlocked(progress, "expert"), false);
});

test("getPointsReward and getUnlockCost expose the agreed values", function () {
  assert.equal(getPointsReward("beginner"), 10);
  assert.equal(getPointsReward("expert"), 40);
  assert.equal(getUnlockCost("intermediate"), 100);
  assert.equal(getUnlockCost("expert"), 450);
});

test("loadProgress falls back to default progress when storage is empty", function () {
  const progress = loadProgress({
    getStorageSync: function (key) {
      assert.equal(key, STORAGE_KEYS.progress);
      return "";
    }
  });

  assert.deepEqual(progress.unlockedDifficulties, ["beginner"]);
  assert.equal(progress.totalPoints, 0);
});

test("saveProgress writes the progress payload", function () {
  const writes = [];
  const saved = saveProgress(createEmptyProgress(), {
    setStorageSync: function (key, value) {
      writes.push([key, value]);
    }
  });

  assert.equal(saved, true);
  assert.equal(writes[0][0], STORAGE_KEYS.progress);
});

test("validatePuzzle reports invalid advanced hint metadata", function () {
  const errors = [];
  const seenIds = {};

  validatePuzzle({
    id: "expert-invalid",
    difficulty: "expert",
    puzzle: "000000012000000003002300000070050000000000000000040080000009600400000000830000000",
    solution: "653974812184265793792318465376852941548197236921643587215439678467581329839726154",
    techniques: ["x-wing"],
    hint: {
      primaryTechnique: "xy-wing",
      targetIndex: 0,
      relatedIndexes: [0, 99]
    }
  }, seenIds, errors);

  assert.deepEqual(errors, [
    "expert-invalid: hint.primaryTechnique must be included in techniques.",
    "expert-invalid: hint.relatedIndexes cannot contain targetIndex.",
    "expert-invalid: hint.relatedIndexes[1] must be an integer from 0 to 80."
  ]);
});

test("validatePuzzle requires hint metadata for advanced puzzles", function () {
  const errors = [];
  const seenIds = {};

  validatePuzzle({
    id: "skilled-missing-hint",
    difficulty: "skilled",
    puzzle: "040000000000600004018040000900006008080090020100800009000030980300008000000000060",
    solution: "546371892793682514218945673937216458485793126162854739621437985359168247874529361",
    techniques: ["naked-pair", "box-line-reduction"]
  }, seenIds, errors);

  assert.deepEqual(errors, [
    "skilled-missing-hint: advanced puzzles must provide hint metadata."
  ]);
});

test("normalizePuzzleLayout treats digit remaps as the same structure", function () {
  const layoutA = "120".padEnd(81, "0");
  const layoutB = "340".padEnd(81, "0");
  const layoutC = "102".padEnd(81, "0");

  assert.equal(normalizePuzzleLayout(layoutA), normalizePuzzleLayout(layoutB));
  assert.notEqual(normalizePuzzleLayout(layoutA), normalizePuzzleLayout(layoutC));
});

test("summarizeStructureClusters groups ids by normalized layout", function () {
  const summary = summarizeStructureClusters([
    { id: "same-a", puzzle: "120".padEnd(81, "0") },
    { id: "same-b", puzzle: "340".padEnd(81, "0") },
    { id: "diff-c", puzzle: "102".padEnd(81, "0") }
  ]);

  assert.equal(summary.normalizedUnique, 2);
  assert.deepEqual(summary.clusters, [
    { size: 2, ids: ["same-a", "same-b"] },
    { size: 1, ids: ["diff-c"] }
  ]);
});

test("beginner and intermediate banks expose at least three structure prototypes", function () {
  const groups = groupPuzzlesByDifficulty(puzzles);

  assert.equal(
    summarizeStructureClusters(groups.beginner).normalizedUnique >= STRUCTURE_MINIMUMS.beginner,
    true
  );
  assert.equal(
    summarizeStructureClusters(groups.intermediate).normalizedUnique >= STRUCTURE_MINIMUMS.intermediate,
    true
  );
});

test("skilled and expert banks expose at least four structure prototypes", function () {
  const groups = groupPuzzlesByDifficulty(puzzles);

  assert.equal(
    summarizeStructureClusters(groups.skilled).normalizedUnique >= STRUCTURE_MINIMUMS.skilled,
    true
  );
  assert.equal(
    summarizeStructureClusters(groups.expert).normalizedUnique >= STRUCTURE_MINIMUMS.expert,
    true
  );
});

test("findStructureShortfalls reports the current minimum gap by difficulty", function () {
  const errors = findStructureShortfalls({
    beginner: [
      { id: "same-a", puzzle: "120".padEnd(81, "0") },
      { id: "same-b", puzzle: "340".padEnd(81, "0") }
    ]
  }, {
    beginner: 3
  });

  assert.deepEqual(errors, [
    "beginner: normalizedUnique 1 is below minimum 3."
  ]);
});

test("validatePuzzleBank reports duplicate puzzle layouts within the same difficulty", function () {
  const errors = validatePuzzleBank([
    {
      id: "skilled-dup-a",
      difficulty: "skilled",
      puzzle: "040000000000600004018040000900006008080090020100800009000030980300008000000000060",
      solution: "546371892793682514218945673937216458485793126162854739621437985359168247874529361",
      techniques: ["naked-pair", "box-line-reduction"],
      hint: {
        primaryTechnique: "naked-pair",
        targetIndex: 9,
        relatedIndexes: [],
        context: {
          pattern: "pair"
        }
      }
    },
    {
      id: "skilled-dup-b",
      difficulty: "skilled",
      puzzle: "040000000000600004018040000900006008080090020100800009000030980300008000000000060",
      solution: "546371892793682514218945673937216458485793126162854739621437985359168247874529361",
      techniques: ["naked-pair", "box-line-reduction"],
      hint: {
        primaryTechnique: "box-line-reduction",
        targetIndex: 8,
        relatedIndexes: [17, 26],
        context: {
          pattern: "box-line"
        }
      }
    }
  ]);

  assert.deepEqual(errors, [
    "skilled-dup-b: duplicate puzzle layout for difficulty skilled.",
    "skilled: normalizedUnique 1 is below minimum 4."
  ]);
});

test("validatePuzzleBank reports structure diversity shortfalls", function () {
  const errors = validatePuzzleBank([
    {
      id: "beginner-a",
      difficulty: "beginner",
      puzzle: "120".padEnd(81, "0"),
      solution: "123456789456789123789123456214365897365897214897214365531642978642978531978531642",
      techniques: ["naked-single"]
    }
  ]);

  assert.equal(
    errors.some(function (error) {
      return /normalizedUnique .* below minimum/.test(error);
    }),
    true
  );
});

test("puzzle data contains all four supported difficulties", function () {
  const difficulties = Array.from(new Set(puzzles.map(function (puzzle) {
    return puzzle.difficulty;
  })));
  const countsByDifficulty = puzzles.reduce(function (counts, puzzle) {
    counts[puzzle.difficulty] = (counts[puzzle.difficulty] || 0) + 1;
    return counts;
  }, {});

  assert.deepEqual(difficulties, [
    "beginner",
    "intermediate",
    "skilled",
    "expert"
  ]);
  assert.ok(countsByDifficulty.beginner >= 10);
  assert.ok(countsByDifficulty.intermediate >= 10);
  assert.ok(countsByDifficulty.skilled >= 10);
  assert.ok(countsByDifficulty.expert >= 10);
});

test("puzzle bank currently expands to 60 puzzles", function () {
  assert.equal(puzzles.length, 60);
});

test("puzzle validation script accepts the current puzzle bank", function () {
  const result = childProcess.spawnSync("node", ["scripts/validate-puzzles.js"], {
    cwd: path.join(__dirname, ".."),
    encoding: "utf8"
  });

  assert.equal(result.status, 0);
  assert.match(result.stdout, /Puzzle validation passed/);
});

test("puzzle summary script reports structure clusters by difficulty", function () {
  const result = childProcess.spawnSync("node", ["scripts/summarize-puzzles.js"], {
    cwd: path.join(__dirname, ".."),
    encoding: "utf8"
  });

  assert.equal(result.status, 0);
  assert.match(result.stdout, /beginner: count=15/);
  assert.match(result.stdout, /intermediate: count=15/);
  assert.match(result.stdout, /skilled: count=15/);
  assert.match(result.stdout, /expert: count=15/);
  assert.match(result.stdout, /givens=/);
  assert.match(result.stdout, /hintCoverage=/);
  assert.match(result.stdout, /duplicatePuzzles=/);
  assert.match(result.stdout, /normalizedUnique=/);
  assert.match(result.stdout, /structureClusters=/);
});

test("harder difficulties start with fewer given cells than easier ones", function () {
  function countGivens(difficulty) {
    const puzzle = puzzles.find(function (item) {
      return item.difficulty === difficulty;
    });

    return puzzle.puzzle.split("").filter(function (value) {
      return value !== "0";
    }).length;
  }

  const beginnerGivens = countGivens("beginner");
  const intermediateGivens = countGivens("intermediate");
  const skilledGivens = countGivens("skilled");
  const expertGivens = countGivens("expert");

  assert.ok(beginnerGivens >= intermediateGivens);
  assert.ok(intermediateGivens >= skilledGivens);
  assert.ok(skilledGivens >= expertGivens);
});

test("skilled and expert puzzle banks keep a tighter givens range", function () {
  function getRange(difficulty) {
    const givens = puzzles
      .filter(function (puzzle) {
        return puzzle.difficulty === difficulty;
      })
      .map(function (puzzle) {
        return puzzle.puzzle.split("").filter(function (value) {
          return value !== "0";
        }).length;
      });

    return {
      min: Math.min.apply(null, givens),
      max: Math.max.apply(null, givens)
    };
  }

  const skilledRange = getRange("skilled");
  const expertRange = getRange("expert");

  assert.ok(skilledRange.min >= 21);
  assert.ok(skilledRange.max <= 28);
  assert.ok(expertRange.min >= 14);
  assert.ok(expertRange.max <= 20);
});

test("skilled and expert puzzle metadata stays aligned with their intended technique bands", function () {
  const skilledPuzzles = puzzles.filter(function (puzzle) {
    return puzzle.difficulty === "skilled";
  });
  const expertPuzzles = puzzles.filter(function (puzzle) {
    return puzzle.difficulty === "expert";
  });

  skilledPuzzles.forEach(function (puzzle) {
    assert.ok(puzzle.techniques.includes("naked-pair"));
    assert.ok(
      puzzle.techniques.includes("pointing-pair") ||
      puzzle.techniques.includes("box-line-reduction")
    );
  });

  expertPuzzles.forEach(function (puzzle) {
    assert.ok(puzzle.techniques.includes("x-wing"));
    assert.ok(!puzzle.techniques.includes("swordfish"));
    assert.ok(
      puzzle.techniques.includes("box-line-reduction") ||
      puzzle.techniques.includes("xy-wing")
    );
  });
});

test("registerShareSupport enables share menu and returns fixed share payloads", function () {
  const calls = [];
  let appMessageHandler = null;
  let timelineHandler = null;
  const zh = createTranslator("zh-CN");
  const en = createTranslator("en");
  const ja = createTranslator("ja");

  registerShareSupport({
    showShareMenu: function (options) {
      calls.push(["showShareMenu", options]);
    },
    onShareAppMessage: function (handler) {
      appMessageHandler = handler;
    },
    onShareTimeline: function (handler) {
      timelineHandler = handler;
    }
  }, zh);

  assert.deepEqual(calls[0], ["showShareMenu", {
    withShareTicket: true,
    menus: ["shareAppMessage", "shareTimeline"]
  }]);
  assert.equal(typeof appMessageHandler, "function");
  assert.equal(typeof timelineHandler, "function");
  assert.deepEqual(appMessageHandler(), {
    title: zh("share.friendTitle")
  });
  assert.deepEqual(timelineHandler(), {
    title: zh("share.timelineTitle")
  });
  assert.equal(en("share.friendTitle"), "Fangting Jiuyu: a local-first Sudoku WeChat game");
  assert.equal(en("share.timelineTitle"), "Fangting Jiuyu | A local-first Sudoku mini game");
  assert.equal(ja("share.friendTitle"), "方庭九屿：ローカルファーストの数独WeChatミニゲーム");
  assert.equal(ja("share.timelineTitle"), "方庭九屿｜ローカルファーストの数独ミニゲーム");
});

test("registerShareSupport degrades safely when share APIs are unavailable", function () {
  assert.doesNotThrow(function () {
    registerShareSupport({
      showShareMenu: null,
      onShareAppMessage: null,
      onShareTimeline: null
    });
  });
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

      if (key === STORAGE_KEYS.progress) {
        return applyExamPassToProgress(createEmptyProgress(), "expert", 0);
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

test("main entry enables WeChat share menu during boot", function () {
  const calls = [];
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
    getStorageSync: function () {
      return "";
    },
    onTouchStart: function () {},
    showShareMenu: function (options) {
      calls.push(["showShareMenu", options]);
    },
    onShareAppMessage: function (handler) {
      calls.push(["onShareAppMessage", typeof handler]);
    },
    onShareTimeline: function (handler) {
      calls.push(["onShareTimeline", typeof handler]);
    }
  };

  try {
    require("../js/main");
    assert.deepEqual(calls[0], ["showShareMenu", {
      withShareTicket: true,
      menus: ["shareAppMessage", "shareTimeline"]
    }]);
    assert.deepEqual(calls[1], ["onShareAppMessage", "function"]);
    assert.deepEqual(calls[2], ["onShareTimeline", "function"]);
  } finally {
    delete require.cache[mainPath];
    global.wx = originalWx;
  }
});

test("main entry configures a high-DPR canvas during boot", function () {
  const originalWx = global.wx;
  const mainPath = require.resolve("../js/main");
  const scaleCalls = [];
  const canvas = {
    width: 0,
    height: 0,
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
        fillText: function () {},
        scale: function (x, y) {
          scaleCalls.push([x, y]);
        }
      };
    }
  };

  delete require.cache[mainPath];
  global.wx = {
    createCanvas: function () {
      return canvas;
    },
    createImage: function () {
      return {
        onload: null,
        onerror: null,
        src: ""
      };
    },
    getWindowInfo: function () {
      return {
        windowWidth: 375,
        windowHeight: 812,
        pixelRatio: 3
      };
    },
    getStorageSync: function () {
      return "";
    },
    onTouchStart: function () {}
  };

  try {
    require("../js/main");
    assert.equal(canvas.width, 1125);
    assert.equal(canvas.height, 2436);
    assert.deepEqual(scaleCalls[0], [3, 3]);
  } finally {
    delete require.cache[mainPath];
    global.wx = originalWx;
  }
});

test("main entry advances and persists elapsed time during an active game", function () {
  const texts = [];
  const writes = [];
  const originalWx = global.wx;
  const originalSetInterval = global.setInterval;
  const originalClearInterval = global.clearInterval;
  const mainPath = require.resolve("../js/main");
  let touchHandler = null;
  let tick = null;

  delete require.cache[mainPath];
  global.setInterval = function (handler) {
    tick = handler;
    return 1;
  };
  global.clearInterval = function () {};
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

      if (key === STORAGE_KEYS.progress) {
        return applyExamPassToProgress(createEmptyProgress(), "expert", 0);
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
    assert.equal(typeof tick, "function");

    const homeScene = createHomeScene({
      canvasWidth: 375,
      canvasHeight: 812
    });
    const homeMetrics = homeScene.getMetrics({
      difficultyPickerOpen: false,
      t: createTranslator("zh-CN")
    });

    touchHandler({
      touches: [{
        clientX: homeMetrics.primaryButtonLeft + 20,
        clientY: homeMetrics.primaryButtonTop + 20
      }]
    });

    tick();
    tick();

    assert.ok(texts.includes("计时 00:02"));
    const savedSession = writes.filter(function (entry) {
      return entry[0] === STORAGE_KEYS.currentGame;
    }).pop();
    assert.ok(savedSession);
    assert.equal(savedSession[1].game.elapsedSeconds, 2);
  } finally {
    delete require.cache[mainPath];
    global.wx = originalWx;
    global.setInterval = originalSetInterval;
    global.clearInterval = originalClearInterval;
  }
});

test("exam difficulty labels are distinct from normal difficulty labels", function () {
  const zh = createTranslator("zh-CN");
  const en = createTranslator("en");
  const ja = createTranslator("ja");

  assert.equal(
    zh("board.examDifficultyLabel", { difficulty: zh("difficulty.beginner") }),
    "新手考试"
  );
  assert.equal(zh("difficulty.beginner"), "新手");

  assert.equal(
    en("board.examDifficultyLabel", { difficulty: en("difficulty.beginner") }),
    "Beginner Exam"
  );
  assert.equal(en("difficulty.beginner"), "Beginner");

  assert.equal(
    ja("board.examDifficultyLabel", { difficulty: ja("difficulty.beginner") }),
    "初級試験"
  );
  assert.equal(ja("difficulty.beginner"), "初級");
});

test("main entry treats a completed saved game as a finished run instead of a resumable game", function () {
  const texts = [];
  const originalWx = global.wx;
  const mainPath = require.resolve("../js/main");
  const expertPuzzle = puzzles.find(function (puzzle) {
    return puzzle.difficulty === "expert";
  });

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
          preferredDifficulty: "expert",
          language: "zh-CN"
        };
      }

      if (key === STORAGE_KEYS.currentGame) {
        return {
          game: {
            puzzleId: expertPuzzle.id,
            difficulty: expertPuzzle.difficulty,
            puzzle: expertPuzzle.puzzle,
            solution: expertPuzzle.solution,
            cells: expertPuzzle.solution.split("").map(function (value, index) {
              return {
                index: index,
                value: value,
                given: expertPuzzle.puzzle[index] !== "0",
                notes: []
              };
            }),
            elapsedSeconds: 428,
            mistakes: 0,
            hintsUsed: 0,
            history: []
          },
          selectedIndex: -1,
          noteMode: false
        };
      }

      if (key === STORAGE_KEYS.progress) {
        return applyExamPassToProgress(createEmptyProgress(), "expert", 0);
      }

      return "";
    },
    onTouchStart: function () {}
  };

  try {
    require("../js/main");
    assert.ok(texts.includes("开始新局"));
    assert.ok(!texts.includes("继续游戏"));
    assert.ok(texts.includes("还没有可继续的棋局"));
  } finally {
    delete require.cache[mainPath];
    global.wx = originalWx;
  }
});

test("main entry can open settings from home and switch language inline", function () {
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

      if (key === STORAGE_KEYS.progress) {
        return applyExamPassToProgress(createEmptyProgress(), "expert", 0);
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
    const settingsMetrics = settingsScene.getMetrics({
      showResumeAction: true
    });
    const languageMetrics = createLanguageScene({
      canvasWidth: 375,
      canvasHeight: 812
    }).getMetrics();

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
          clientY: languageMetrics.optionTop + (languageMetrics.optionHeight + languageMetrics.optionGap) * 2 + 20
        }
      ]
    });

    assert.ok(texts.includes("日本語"));
    const savedSettings = writes.filter(function (entry) {
      return entry[0] === STORAGE_KEYS.settings;
    }).pop();
    assert.ok(savedSettings);
    assert.equal(savedSettings[1].language, "ja");
  } finally {
    delete require.cache[mainPath];
    global.wx = originalWx;
  }
});

test("main entry can open settings from board and send the top-left action back home", function () {
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

    const homeScene = createHomeScene({
      canvasWidth: 375,
      canvasHeight: 812
    });
    const boardScene = createBoardScene({
      canvasWidth: 375,
      canvasHeight: 812
    });
    const settingsScene = createSettingsScene({
      canvasWidth: 375,
      canvasHeight: 812
    });
    const homeMetrics = homeScene.getMetrics({
      difficultyPickerOpen: false,
      t: createTranslator("zh-CN")
    });
    const boardMetrics = boardScene.getMetrics();
    const settingsMetrics = settingsScene.getMetrics({
      showResumeAction: true,
      t: createTranslator("zh-CN")
    });

    touchHandler({
      touches: [{
        clientX: homeMetrics.primaryButtonLeft + 20,
        clientY: homeMetrics.primaryButtonTop + 20
      }]
    });
    touchHandler({
      touches: [{
        clientX: boardMetrics.settingsLeft + 12,
        clientY: boardMetrics.settingsTop + 12
      }]
    });
    touchHandler({
      touches: [{
        clientX: settingsMetrics.backLeft + 12,
        clientY: settingsMetrics.backTop + 12
      }]
    });

    assert.ok(texts.includes("设置"));
    assert.ok(texts.includes("专家"));
    assert.ok(texts.includes("方庭九屿"));
    assert.ok(texts.includes("回到首页"));
  } finally {
    delete require.cache[mainPath];
    global.wx = originalWx;
  }
});

test("main entry pauses elapsed time in settings and can resume back to the board", function () {
  const texts = [];
  const writes = [];
  const originalWx = global.wx;
  const originalSetInterval = global.setInterval;
  const originalClearInterval = global.clearInterval;
  const mainPath = require.resolve("../js/main");
  let touchHandler = null;
  let tick = null;

  delete require.cache[mainPath];
  global.setInterval = function (handler) {
    tick = handler;
    return 1;
  };
  global.clearInterval = function () {};
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
              texts.push(String(text));
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

      if (key === STORAGE_KEYS.progress) {
        return applyExamPassToProgress(createEmptyProgress(), "expert", 0);
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
    assert.equal(typeof tick, "function");

    const homeScene = createHomeScene({
      canvasWidth: 375,
      canvasHeight: 812
    });
    const boardScene = createBoardScene({
      canvasWidth: 375,
      canvasHeight: 812
    });
    const settingsScene = createSettingsScene({
      canvasWidth: 375,
      canvasHeight: 812
    });
    const homeMetrics = homeScene.getMetrics({
      difficultyPickerOpen: false,
      t: createTranslator("zh-CN")
    });
    const boardMetrics = boardScene.getMetrics();
    const settingsMetrics = settingsScene.getMetrics({
      showResumeAction: true,
      t: createTranslator("zh-CN")
    });

    touchHandler({
      touches: [{
        clientX: homeMetrics.primaryButtonLeft + 20,
        clientY: homeMetrics.primaryButtonTop + 20
      }]
    });

    tick();

    touchHandler({
      touches: [{
        clientX: boardMetrics.settingsLeft + 12,
        clientY: boardMetrics.settingsTop + 12
      }]
    });

    tick();
    tick();

    touchHandler({
      touches: [{
        clientX: settingsMetrics.contentLeft + 20,
        clientY: settingsMetrics.resumeCardTop + 20
      }]
    });

    tick();

    assert.ok(texts.includes("回到游戏"));

    const savedSession = writes.filter(function (entry) {
      return entry[0] === STORAGE_KEYS.currentGame;
    }).pop();
    assert.ok(savedSession);
    assert.equal(savedSession[1].game.elapsedSeconds, 2);
  } finally {
    delete require.cache[mainPath];
    global.wx = originalWx;
    global.setInterval = originalSetInterval;
    global.clearInterval = originalClearInterval;
  }
});

test("main entry restricts settings actions during an exam and sends back to home", function () {
  const texts = [];
  const writes = [];
  const originalWx = global.wx;
  const mainPath = require.resolve("../js/main");
  let touchHandler = null;
  const beginnerPuzzle = puzzles.find(function (puzzle) {
    return puzzle.difficulty === "beginner";
  });

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
              texts.push(String(text));
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

      if (key === STORAGE_KEYS.currentGame) {
        return {
          game: {
            puzzleId: beginnerPuzzle.id,
            difficulty: "intermediate",
            puzzle: beginnerPuzzle.puzzle,
            solution: beginnerPuzzle.solution,
            cells: beginnerPuzzle.puzzle.split("").map(function (value, index) {
              return {
                index: index,
                value: value === "0" ? "" : value,
                given: value !== "0",
                notes: []
              };
            }),
            elapsedSeconds: 120,
            mistakes: 0,
            hintsUsed: 0,
            history: [{
              index: 0,
              mode: "value",
              value: "1",
              notes: []
            }]
          },
          selectedIndex: -1,
          noteMode: false,
          examState: {
            active: true,
            difficulty: "intermediate",
            timeLimitSeconds: 600,
            deadlineReached: false
          }
        };
      }

      if (key === STORAGE_KEYS.progress) {
        return applyExamPassToProgress(createEmptyProgress(), "expert", 0);
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
    const boardScene = createBoardScene({
      canvasWidth: 375,
      canvasHeight: 812
    });
    const homeMetrics = homeScene.getMetrics({
      difficultyPickerOpen: false,
      t: createTranslator("zh-CN")
    });
    const boardMetrics = boardScene.getMetrics();
    const settingsScene = createSettingsScene({
      canvasWidth: 375,
      canvasHeight: 812
    });
    const settingsMetrics = settingsScene.getMetrics({
      showResumeAction: true
    });

    touchHandler({
      touches: [{
        clientX: homeMetrics.primaryButtonLeft + 20,
        clientY: homeMetrics.primaryButtonTop + 20
      }]
    });

    touchHandler({
      touches: [{
        clientX: boardMetrics.settingsLeft + 12,
        clientY: boardMetrics.settingsTop + 12
      }]
    });

    assert.ok(texts.includes("回到首页"));

    touchHandler({
      touches: [{
        clientX: settingsMetrics.difficultyCardLeft + 20,
        clientY: settingsMetrics.difficultyCardTop + 20
      }]
    });

    const difficultyWrites = writes.filter(function (entry) {
      return entry[0] === STORAGE_KEYS.settings;
    });
    assert.equal(difficultyWrites.length, 0);

    touchHandler({
      touches: [{
        clientX: settingsMetrics.backLeft + 12,
        clientY: settingsMetrics.backTop + 12
      }]
    });

    assert.ok(texts.includes("首次进入，先完成一次难度测试"));
    assert.ok(texts.includes("回到首页"));
  } finally {
    delete require.cache[mainPath];
    global.wx = originalWx;
  }
});

test("main entry exits exam to normal beginner home", function () {
  const texts = [];
  const writes = [];
  const originalWx = global.wx;
  const mainPath = require.resolve("../js/main");
  let touchHandler = null;
  const beginnerPuzzle = puzzles.find(function (puzzle) {
    return puzzle.difficulty === "beginner";
  });

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
              texts.push(String(text));
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

      if (key === STORAGE_KEYS.currentGame) {
        return {
          game: {
            puzzleId: beginnerPuzzle.id,
            difficulty: "intermediate",
            puzzle: beginnerPuzzle.puzzle,
            solution: beginnerPuzzle.solution,
            cells: beginnerPuzzle.puzzle.split("").map(function (value, index) {
              return {
                index: index,
                value: value === "0" ? "" : value,
                given: value !== "0",
                notes: []
              };
            }),
            elapsedSeconds: 120,
            mistakes: 0,
            hintsUsed: 0,
            history: [{
              index: 0,
              mode: "value",
              value: "1",
              notes: []
            }]
          },
          selectedIndex: -1,
          noteMode: false,
          examState: {
            active: true,
            difficulty: "intermediate",
            timeLimitSeconds: 600,
            deadlineReached: false
          }
        };
      }

      if (key === STORAGE_KEYS.progress) {
        return applyExamPassToProgress(createEmptyProgress(), "beginner", 0);
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
    const boardScene = createBoardScene({
      canvasWidth: 375,
      canvasHeight: 812
    });
    const settingsScene = createSettingsScene({
      canvasWidth: 375,
      canvasHeight: 812
    });
    const homeMetrics = homeScene.getMetrics({
      difficultyPickerOpen: false,
      t: createTranslator("zh-CN")
    });
    const boardMetrics = boardScene.getMetrics();
    const settingsMetrics = settingsScene.getMetrics({
      showResumeAction: true
    });

    touchHandler({
      touches: [{
        clientX: homeMetrics.primaryButtonLeft + 20,
        clientY: homeMetrics.primaryButtonTop + 20
      }]
    });

    touchHandler({
      touches: [{
        clientX: boardMetrics.settingsLeft + 12,
        clientY: boardMetrics.settingsTop + 12
      }]
    });

    touchHandler({
      touches: [{
        clientX: settingsMetrics.contentLeft + 20,
        clientY: settingsMetrics.restartCardTop + 20
      }]
    });

    assert.ok(texts.includes("继续游戏"));
    assert.ok(texts.includes("当前难度: 新手"));
    assert.equal(texts.includes("首次进入，先完成一次难度测试"), false);

    const savedSettings = writes.filter(function (entry) {
      return entry[0] === STORAGE_KEYS.settings;
    }).pop();
    assert.ok(savedSettings);
    assert.equal(savedSettings[1].preferredDifficulty, "beginner");
  } finally {
    delete require.cache[mainPath];
    global.wx = originalWx;
  }
});

test("main entry can restart a game from settings and return to board", function () {
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
          preferredDifficulty: "expert",
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

    const settingsScene = createSettingsScene({
      canvasWidth: 375,
      canvasHeight: 812
    });
    const settingsMetrics = settingsScene.getMetrics();

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
      touches: [{
        clientX: settingsMetrics.contentLeft + 20,
        clientY: settingsMetrics.restartCardTop + 20
      }]
    });

    const restartedGame = writes.find(function (entry) {
      return entry[0] === STORAGE_KEYS.currentGame &&
        entry[1] &&
        entry[1].game &&
        entry[1].game.difficulty === "expert" &&
        entry[1].selectedIndex === -1 &&
        entry[1].noteMode === false;
    });

    assert.ok(restartedGame);
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

      if (key === STORAGE_KEYS.progress) {
        return applyExamPassToProgress(createEmptyProgress(), "expert", 0);
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

test("main entry keeps locked difficulties disabled inside settings after a failed exam", function () {
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

      if (key === STORAGE_KEYS.progress) {
        return applyExamFailureToProgress(createEmptyProgress(), "beginner");
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
        clientY: settingsMetrics.difficultyCardTop + 20
      }]
    });

    const settingsWrites = writes.filter(function (entry) {
      return entry[0] === STORAGE_KEYS.settings;
    });
    assert.equal(settingsWrites.length, 0);
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

      if (key === STORAGE_KEYS.progress) {
        return applyExamPassToProgress(createEmptyProgress(), "expert", 0);
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

test("main entry shows completion card and writes stats when a game is completed", function () {
  const texts = [];
  const writes = [];
  const originalWx = global.wx;
  const mainPath = require.resolve("../js/main");
  let touchHandler = null;
  const expertPuzzle = puzzles.find(function (puzzle) {
    return puzzle.difficulty === "expert";
  });
  const nearCompleteSession = {
    game: {
      puzzleId: expertPuzzle.id,
      difficulty: expertPuzzle.difficulty,
      puzzle: expertPuzzle.puzzle,
      solution: expertPuzzle.solution,
      cells: expertPuzzle.solution.split("").map(function (value, index) {
        const isMissing = index === 2;
        const isGiven = expertPuzzle.puzzle[index] !== "0";
        return {
          index: index,
          value: isMissing ? "" : value,
          given: isGiven,
          notes: []
        };
      }),
      elapsedSeconds: 428,
      mistakes: 0,
      hintsUsed: 0,
      history: []
    },
    selectedIndex: -1,
    noteMode: false
  };

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
          preferredDifficulty: "expert",
          language: "zh-CN"
        };
      }

      if (key === STORAGE_KEYS.currentGame) {
        return nearCompleteSession;
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
    const boardScene = createBoardScene({
      canvasWidth: 375,
      canvasHeight: 812
    });
    const toolbar = createToolbar({
      canvasWidth: 375,
      canvasHeight: 812,
      boardMetrics: boardScene.getMetrics()
    });
    const homeMetrics = homeScene.getMetrics({
      difficultyPickerOpen: false,
      t: createTranslator("zh-CN")
    });
    const boardMetrics = boardScene.getMetrics();
    const toolbarMetrics = toolbar.getMetrics();

    touchHandler({
      touches: [{
        clientX: homeMetrics.primaryButtonLeft + 20,
        clientY: homeMetrics.primaryButtonTop + 20
      }]
    });

    touchHandler({
      touches: [{
        clientX: boardMetrics.boardLeft + boardMetrics.cellSize * 2.5,
        clientY: boardMetrics.boardTop + boardMetrics.cellSize * 0.5
      }]
    });

    const expectedCompletionValue = Number(expertPuzzle.solution[2]);

    touchHandler({
      touches: [{
        clientX: toolbarMetrics.left + (toolbarMetrics.width / 9) * (expectedCompletionValue - 0.5),
        clientY: toolbarMetrics.top + toolbarMetrics.numberHeight / 2
      }]
    });

    assert.ok(texts.includes("已完成本局"));
    assert.ok(texts.includes("查看统计"));

    const savedStats = writes.find(function (entry) {
      return entry[0] === STORAGE_KEYS.stats;
    });

    assert.ok(savedStats);
    assert.equal(savedStats[1].hintCountByDifficulty.expert, 0);
  } finally {
    delete require.cache[mainPath];
    global.wx = originalWx;
  }
});

test("main entry opens locked difficulty exam flow from home", function () {
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
            fill: function () {},
            arcTo: function () {},
            closePath: function () {},
            fillText: function (text) {
              texts.push(String(text));
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

      if (key === STORAGE_KEYS.progress) {
        return applyExamPassToProgress(createEmptyProgress(), "beginner", 0);
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
    const collapsedMetrics = homeScene.getMetrics({
      difficultyPickerOpen: false,
      selectedDifficulty: "beginner",
      t: createTranslator("zh-CN")
    });
    const expandedMetrics = homeScene.getMetrics({
      difficultyPickerOpen: true,
      selectedDifficulty: "beginner",
      t: createTranslator("zh-CN")
    });

    touchHandler({
      touches: [{
        clientX: collapsedMetrics.difficultyLeft + 20,
        clientY: collapsedMetrics.difficultyTop + 20
      }]
    });

    touchHandler({
      touches: [{
        clientX: expandedMetrics.difficultyLeft + 20,
        clientY: expandedMetrics.difficultyTop + expandedMetrics.difficultyHeight + expandedMetrics.difficultyGap + 20
      }]
    });

    assert.ok(texts.includes("参加考试"));
    assert.ok(texts.includes("进阶 尚未解锁"));
    assert.ok(texts.includes("通过考试可直接解锁当前难度"));
  } finally {
    delete require.cache[mainPath];
    global.wx = originalWx;
  }
});

test("initial exam choices all start with the same 10-minute limit", function () {
  const difficulties = ["beginner", "intermediate", "skilled", "expert"];

  difficulties.forEach(function (difficulty, index) {
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
      const metrics = homeScene.getMetrics({
        initialExamChoiceVisible: true,
        selectedDifficulty: "beginner",
        t: createTranslator("zh-CN")
      });

      touchHandler({
        touches: [{
          clientX: metrics.difficultyLeft + 20,
          clientY: metrics.difficultyTop + index * (metrics.difficultyHeight + metrics.difficultyGap) + 20
        }]
      });

      const savedSession = writes.filter(function (entry) {
        return entry[0] === STORAGE_KEYS.currentGame;
      }).pop();

      assert.ok(savedSession);
      assert.equal(savedSession[1].game.difficulty, difficulty);
      assert.equal(savedSession[1].examState.difficulty, difficulty);
      assert.equal(savedSession[1].examState.timeLimitSeconds, 600);
    } finally {
      delete require.cache[mainPath];
      global.wx = originalWx;
    }
  });
});

test("main entry shows initial exam difficulty choice on first launch", function () {
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
              texts.push(String(text));
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
    setStorageSync: function () {},
    onTouchStart: function (handler) {
      touchHandler = handler;
    }
  };

  try {
    require("../js/main");
    assert.equal(typeof touchHandler, "function");
    assert.ok(texts.some(function (text) { return String(text).indexOf("首次进入，先完成一次难度测试") >= 0; }));
    assert.ok(texts.some(function (text) { return String(text).indexOf("在时限内完成，可解锁当前难度及以下难度") >= 0; }));
    assert.equal(texts.includes("开始新局"), false);
  } finally {
    delete require.cache[mainPath];
    global.wx = originalWx;
  }
});

test("main entry lets locked difficulty dialog switch to points view", function () {
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
              texts.push(String(text));
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

      if (key === STORAGE_KEYS.progress) {
        return applyExamPassToProgress(createEmptyProgress(), "beginner", 0);
      }

      return "";
    },
    setStorageSync: function () {},
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
    const expandedMetrics = homeScene.getMetrics({
      difficultyPickerOpen: true,
      selectedDifficulty: "beginner",
      t: createTranslator("zh-CN")
    });

    touchHandler({
      touches: [{
        clientX: expandedMetrics.difficultyLeft + 20,
        clientY: expandedMetrics.difficultyTop + 20
      }]
    });

    touchHandler({
      touches: [{
        clientX: expandedMetrics.difficultyLeft + 20,
        clientY: expandedMetrics.difficultyTop + expandedMetrics.difficultyHeight + expandedMetrics.difficultyGap + 20
      }]
    });

    const dialogMetrics = homeScene.getMetrics({
      selectedDifficulty: "beginner",
      lockedDifficultyDialog: {
        difficulty: "intermediate",
        mode: "actions"
      },
      t: createTranslator("zh-CN")
    });

    touchHandler({
      touches: [{
        clientX: dialogMetrics.lockedDialogPointsLeft + 12,
        clientY: dialogMetrics.lockedDialogActionsTop + 12
      }]
    });

    assert.ok(texts.some(function (text) { return String(text).indexOf("当前积分 0 / 100") >= 0; }));
    assert.ok(texts.some(function (text) { return String(text).indexOf("还差 100 积分解锁") >= 0; }));
  } finally {
    delete require.cache[mainPath];
    global.wx = originalWx;
  }
});

test("main entry does not award points when an exam is finished after timeout", function () {
  const texts = [];
  const writes = [];
  const originalWx = global.wx;
  const originalSetInterval = global.setInterval;
  const originalClearInterval = global.clearInterval;
  const mainPath = require.resolve("../js/main");
  let touchHandler = null;
  let tick = null;
  const beginnerPuzzle = puzzles.find(function (puzzle) {
    return puzzle.difficulty === "beginner";
  });
  const overdueExamSession = {
    game: {
      puzzleId: beginnerPuzzle.id,
      difficulty: "intermediate",
      puzzle: beginnerPuzzle.puzzle,
      solution: beginnerPuzzle.solution,
      cells: beginnerPuzzle.solution.split("").map(function (value, index) {
        const isMissing = index === 2;
        const isGiven = beginnerPuzzle.puzzle[index] !== "0";
        return {
          index: index,
          value: isMissing ? "" : value,
          given: isGiven,
          notes: []
        };
      }),
      elapsedSeconds: 599,
      mistakes: 0,
      hintsUsed: 0,
      history: []
    },
    selectedIndex: -1,
    noteMode: false,
    examState: {
      active: true,
      difficulty: "intermediate",
      timeLimitSeconds: 600,
      deadlineReached: false
    }
  };

  delete require.cache[mainPath];
  global.setInterval = function (handler) {
    tick = handler;
    return 1;
  };
  global.clearInterval = function () {};
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
              texts.push(String(text));
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

      if (key === STORAGE_KEYS.currentGame) {
        return overdueExamSession;
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
    assert.equal(typeof tick, "function");

    const homeScene = createHomeScene({
      canvasWidth: 375,
      canvasHeight: 812
    });
    const homeMetrics = homeScene.getMetrics({
      difficultyPickerOpen: false,
      t: createTranslator("zh-CN")
    });

    touchHandler({
      touches: [{
        clientX: homeMetrics.primaryButtonLeft + 20,
        clientY: homeMetrics.primaryButtonTop + 20
      }]
    });

    tick();

    const boardScene = createBoardScene({
      canvasWidth: 375,
      canvasHeight: 812
    });
    const toolbar = createToolbar({
      canvasWidth: 375,
      canvasHeight: 812,
      boardMetrics: boardScene.getMetrics()
    });
    const boardMetrics = boardScene.getMetrics();
    const toolbarMetrics = toolbar.getMetrics();
    const expectedCompletionValue = Number(beginnerPuzzle.solution[2]);

    touchHandler({
      touches: [{
        clientX: boardMetrics.boardLeft + boardMetrics.cellSize * 2.5,
        clientY: boardMetrics.boardTop + boardMetrics.cellSize * 0.5
      }]
    });

    touchHandler({
      touches: [{
        clientX: toolbarMetrics.left + (toolbarMetrics.width / 9) * (expectedCompletionValue - 0.5),
        clientY: toolbarMetrics.top + toolbarMetrics.numberHeight / 2
      }]
    });

    const savedProgress = writes.filter(function (entry) {
      return entry[0] === STORAGE_KEYS.progress;
    }).pop();

    assert.ok(savedProgress);
    assert.equal(savedProgress[1].totalPoints, 0);
    assert.ok(texts.includes("本局不计入积分"));
  } finally {
    delete require.cache[mainPath];
    global.wx = originalWx;
    global.setInterval = originalSetInterval;
    global.clearInterval = originalClearInterval;
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
  assert.equal(typeof playful.hintRelated, "string");
  assert.equal(playful.givenDigit, "#1f2933");
  assert.equal(playful.editableDigit, "#8A5F45");
  assert.equal(playful.noteDigit, "#607078");
  assert.equal(typeof pro.surfaceTint, "string");
  assert.equal(typeof pro.ornament, "string");
  assert.equal(typeof pro.hintRelated, "string");
  assert.equal(pro.givenDigit, "#1f2933");
  assert.equal(pro.editableDigit, "#8A5F45");
  assert.equal(pro.noteDigit, "#607078");
});

test("theme policy exposes layered hint tokens for playful and pro modes", function () {
  const playful = getThemeByDifficulty("beginner");
  const pro = getThemeByDifficulty("expert");

  assert.equal(typeof playful.hintTarget, "string");
  assert.equal(typeof playful.hintRelatedSoft, "string");
  assert.equal(typeof playful.hintRelatedStrong, "string");
  assert.equal(typeof pro.hintTarget, "string");
  assert.equal(typeof pro.hintRelatedSoft, "string");
  assert.equal(typeof pro.hintRelatedStrong, "string");
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
  assert.equal(typeof visualSpec.badgeInnerFill, "string");
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
  assert.equal(visualSpec.brandSubtitle, "Find a focused solving rhythm.");
  assert.equal(visualSpec.primaryLabel, "Continue");
  assert.equal(visualSpec.settingsLabel, "Settings");
  assert.equal(typeof visualSpec.decorTone, "string");
  assert.equal(typeof visualSpec.secondaryInnerFill, "string");
});

test("home scene keeps the same brand title font across playful and pro difficulties", function () {
  const fontCalls = [];
  const homeScene = createHomeScene({
    canvasWidth: 375,
    canvasHeight: 812
  });
  const context = {
    _font: "",
    fillStyle: "",
    textAlign: "",
    textBaseline: "",
    lineWidth: 1,
    beginPath: function () {},
    moveTo: function () {},
    lineTo: function () {},
    arcTo: function () {},
    closePath: function () {},
    fillRect: function () {},
    fill: function () {},
    stroke: function () {},
    measureText: function (text) {
      return { width: String(text || "").length * 8 };
    },
    fillText: function (text) {
      if (text === "方庭九屿") {
        fontCalls.push(this.font);
      }
    }
  };

  Object.defineProperty(context, "font", {
    get: function () {
      return this._font;
    },
    set: function (value) {
      this._font = value;
    }
  });

  homeScene.draw(context, {
    hasSavedGame: false,
    selectedDifficulty: "beginner",
    difficultyPickerOpen: false,
    t: createTranslator("zh-CN")
  });
  homeScene.draw(context, {
    hasSavedGame: false,
    selectedDifficulty: "skilled",
    difficultyPickerOpen: false,
    t: createTranslator("zh-CN")
  });

  assert.deepEqual(fontCalls, [
    "bold 36px sans-serif",
    "bold 36px sans-serif"
  ]);
});

test("normalizeLocale falls back to zh-CN for unsupported languages", function () {
  assert.equal(DEFAULT_LOCALE, "zh-CN");
  assert.equal(normalizeLocale("en"), "en");
  assert.equal(normalizeLocale("ja"), "ja");
  assert.equal(normalizeLocale("fr"), "zh-CN");
});

test("createTranslator returns translated difficulty labels and interpolated copy", function () {
  const zh = createTranslator("zh-CN");
  const en = createTranslator("en");
  const ja = createTranslator("ja");

  assert.equal(zh("difficulty.beginner"), "新手");
  assert.equal(en("difficulty.beginner"), "Beginner");
  assert.equal(ja("difficulty.beginner"), "初級");
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
  assert.equal(ja("settings.title"), "設定");
  assert.equal(
    ja("settings.difficultyChanged", {
      difficulty: ja("difficulty.expert")
    }),
    "難易度を上級者向けに切り替え、新しい盤面を開始しました。"
  );
});

test("createTranslator exposes home return-loop copy", function () {
  const zh = createTranslator("zh-CN");
  const en = createTranslator("en");

  assert.equal(zh("home.returnCard.title"), "最近一局");
  assert.equal(zh("home.returnCard.prompt.hasSave"), "继续这局，或马上新开。");
  assert.equal(en("home.returnCard.title"), "Recent run");
  assert.equal(en("home.returnCard.prompt.noSave"), "Start fresh and keep the streak going.");
});

test("createTranslator exposes shorter home support copy", function () {
  const zh = createTranslator("zh-CN");
  const en = createTranslator("en");

  assert.equal(zh("home.status.hasSave"), "可继续上局");
  assert.equal(zh("home.returnCard.prompt.hasSave"), "继续这局，或马上新开。");
  assert.equal(en("home.status.hasSave"), "Continue your last run.");
  assert.equal(en("home.returnCard.prompt.noSave"), "Start fresh and keep the streak going.");
});

test("createTranslator exposes locked difficulty and exam copy", function () {
  const zh = createTranslator("zh-CN");
  const en = createTranslator("en");
  const ja = createTranslator("ja");

  assert.equal(zh("home.difficultyLocked"), "未解锁");
  assert.equal(zh("home.lockedDialog.examAction"), "参加考试");
  assert.equal(zh("home.lockedDialog.examUnlockHint"), "通过考试可直接解锁当前难度");
  assert.equal(zh("home.initialExam.entryTag"), "难度测试");
  assert.equal(zh("settings.backHome"), "回到首页");
  assert.equal(zh("settings.exitExamLabel"), "退出考试");
  assert.equal(en("home.lockedDialog.pointsAction"), "View points");
  assert.equal(en("home.lockedDialog.examUnlockHint"), "Pass the exam to unlock this level directly");
  assert.equal(en("home.initialExam.entryAction"), "Tap to start");
  assert.equal(en("settings.examLockedHint"), "During an exam, only Home and language switching stay available.");
  assert.equal(ja("home.initialExam.entryTag"), "難易度テスト");
  assert.equal(ja("settings.exitExamLabel"), "試験を終了");
  assert.equal(ja("home.lockedDialog.examUnlockHint"), "試験に合格するとこの難易度を直接解放できます");
});

test("createTranslator exposes exam board and completion copy", function () {
  const zh = createTranslator("zh-CN");
  const en = createTranslator("en");
  const ja = createTranslator("ja");

  assert.equal(zh("board.examActive"), "考试中");
  assert.equal(zh("completion.pointsBlocked"), "本局不计入积分");
  assert.equal(en("completion.pointsAwarded", { points: "20" }), "Points +20");
  assert.equal(ja("board.examFailed"), "試験不合格");
  assert.equal(ja("completion.pointsBlocked"), "この一局はポイント対象外です");
});

test("ja locale keeps the same exam and settings key coverage as zh-CN", function () {
  const { LOCALES } = require("../js/i18n/locales");
  const sections = [
    "home.initialExam",
    "home.lockedDialog",
    "settings",
    "completion",
    "board"
  ];

  function getValue(source, path) {
    return path.split(".").reduce(function (current, segment) {
      return current ? current[segment] : undefined;
    }, source);
  }

  function collectLeafPaths(node, prefix) {
    return Object.keys(node).reduce(function (paths, key) {
      const nextPrefix = prefix ? prefix + "." + key : key;
      const value = node[key];
      if (value && typeof value === "object" && !Array.isArray(value)) {
        return paths.concat(collectLeafPaths(value, nextPrefix));
      }
      paths.push(nextPrefix);
      return paths;
    }, []);
  }

  sections.forEach(function (section) {
    const zhSection = getValue(LOCALES["zh-CN"], section);
    const jaSection = getValue(LOCALES.ja, section);
    const zhLeafPaths = collectLeafPaths(zhSection, section);

    zhLeafPaths.forEach(function (leafPath) {
      assert.notEqual(getValue(jaSection, leafPath.slice(section.length + 1)), undefined, "Missing ja locale key: " + leafPath);
    });
  });
});
