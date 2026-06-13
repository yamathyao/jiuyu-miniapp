const { puzzles } = require("./data/puzzles");
const {
  createGame,
  applyInputValue,
  toggleCellNote,
  eraseCellContent,
  undoLastStep,
  buildBoardView
} = require("./services/game-engine");
const {
  loadCurrentGame,
  saveCurrentGame,
  loadSettings,
  saveSettings,
  loadStats,
  saveStats
} = require("./services/storage");
const { runDifficultyCheck } = require("./services/checker");
const { getNextHint } = require("./services/hint-engine");
const {
  createCompletionSummary,
  applyCompletionToStats,
  buildLastResultTags
} = require("./services/stats-service");
const {
  registerShareSupport
} = require("./services/share-service");
const { createTranslator } = require("./i18n");
const { getThemeByDifficulty } = require("./ui/theme-policy");
const { createHomeScene } = require("./scene/home-scene");
const { createBoardScene } = require("./scene/board-scene");
const { createSettingsScene } = require("./scene/settings-scene");
const { createLanguageScene } = require("./scene/language-scene");
const { createToolbar } = require("./ui/toolbar");
const { getTouchPoint } = require("./utils/touch");

function buildPuzzlePoolByDifficulty() {
  return puzzles.reduce(function (pool, puzzle) {
    if (!pool[puzzle.difficulty]) {
      pool[puzzle.difficulty] = [];
    }

    pool[puzzle.difficulty].push(puzzle);
    return pool;
  }, {});
}

function findPuzzleByDifficulty(difficulty, cursorByDifficulty) {
  const poolByDifficulty = buildPuzzlePoolByDifficulty();
  const difficultyPool = poolByDifficulty[difficulty];

  if (!difficultyPool || difficultyPool.length === 0) {
    return puzzles[0];
  }

  if (!cursorByDifficulty) {
    return difficultyPool[0];
  }

  const nextIndex = cursorByDifficulty[difficulty] || 0;
  cursorByDifficulty[difficulty] = (nextIndex + 1) % difficultyPool.length;
  return difficultyPool[nextIndex];
}

function buildRecentSummary(stats, t) {
  if (!stats || !stats.lastCompletedDifficulty || !stats.lastElapsedSeconds) {
    return "";
  }

  return t("home.recentSummary", {
    difficulty: t("difficulty." + stats.lastCompletedDifficulty),
    time: String(stats.lastElapsedSeconds),
    streak: String(stats.currentStreakDays || 0)
  });
}

function buildHomeReturnCard(stats, hasSavedGame, t) {
  if (!stats || !stats.lastCompletedDifficulty || !stats.lastElapsedSeconds) {
    return null;
  }

  return {
    title: t("home.returnCard.title"),
    summary: t("home.returnCard.summary", {
      difficulty: t("difficulty." + stats.lastCompletedDifficulty),
      time: String(stats.lastElapsedSeconds)
    }),
    streakLabel: t("home.returnCard.streakLabel", {
      streak: String(stats.currentStreakDays || 0)
    }),
    tags: buildLastResultTags(stats, t).slice(0, 2),
    prompt: hasSavedGame
      ? t("home.returnCard.prompt.hasSave")
      : t("home.returnCard.prompt.noSave")
  };
}

const DEBUG_NEAR_COMPLETE_SHORTCUT_ENABLED = true;

function getViewportMetrics(wxApi, canvas) {
  let windowInfo = null;

  if (wxApi && typeof wxApi.getWindowInfo === "function") {
    try {
      windowInfo = wxApi.getWindowInfo();
    } catch (error) {
      windowInfo = null;
    }
  }

  if (!windowInfo && wxApi && typeof wxApi.getSystemInfoSync === "function") {
    try {
      windowInfo = wxApi.getSystemInfoSync();
    } catch (error) {
      windowInfo = null;
    }
  }

  const canvasWidth = windowInfo && typeof windowInfo.windowWidth === "number"
    ? windowInfo.windowWidth
    : (canvas.width || 375);
  const canvasHeight = windowInfo && typeof windowInfo.windowHeight === "number"
    ? windowInfo.windowHeight
    : (canvas.height || 812);
  const pixelRatio = windowInfo && typeof windowInfo.pixelRatio === "number" && windowInfo.pixelRatio > 0
    ? windowInfo.pixelRatio
    : 1;

  return {
    canvasWidth: canvasWidth,
    canvasHeight: canvasHeight,
    pixelRatio: pixelRatio
  };
}

function configureCanvas(canvas, context, viewport) {
  canvas.width = Math.round(viewport.canvasWidth * viewport.pixelRatio);
  canvas.height = Math.round(viewport.canvasHeight * viewport.pixelRatio);

  if (typeof context.setTransform === "function") {
    context.setTransform(viewport.pixelRatio, 0, 0, viewport.pixelRatio, 0, 0);
    return;
  }

  if (typeof context.scale === "function") {
    context.scale(viewport.pixelRatio, viewport.pixelRatio);
  }
}

function formatElapsedClock(elapsedSeconds) {
  const safeSeconds = Math.max(0, Math.floor(elapsedSeconds || 0));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;

  return String(minutes).padStart(2, "0") + ":" + String(seconds).padStart(2, "0");
}

function isGameCompletedState(game) {
  return Boolean(game) && Array.isArray(game.cells) && game.cells.every(function (cell) {
    return cell.value === game.solution[cell.index];
  });
}

function boot() {
  if (typeof wx === "undefined" || !wx.createCanvas) {
    return;
  }

  registerShareSupport(wx);

  const canvas = wx.createCanvas();
  const context = canvas.getContext("2d");
  const viewport = getViewportMetrics(wx, canvas);
  const canvasWidth = viewport.canvasWidth;
  const canvasHeight = viewport.canvasHeight;
  configureCanvas(canvas, context, viewport);
  const primaryBrushAsset = {
    image: null,
    loaded: false
  };
  const difficultyAssets = {
    beginner: {
      image: null,
      loaded: false,
      src: "assets/ui/brush/difficulty-beginner.png"
    },
    intermediate: {
      image: null,
      loaded: false,
      src: "assets/ui/brush/difficulty-intermediate.png"
    },
    skilled: {
      image: null,
      loaded: false,
      src: "assets/ui/brush/difficulty-skilled.png"
    },
    expert: {
      image: null,
      loaded: false,
      src: "assets/ui/brush/difficulty-expert.png"
    }
  };
  const settings = loadSettings();
  const defaultPuzzle = findPuzzleByDifficulty(settings.preferredDifficulty);
  const restoredSession = loadCurrentGame(createGame(defaultPuzzle));
  const hasSavedGame = !isGameCompletedState(restoredSession.game) && (
    restoredSession.game.history.length > 0 ||
    restoredSession.game.cells.some(function (cell) {
      return !cell.given && cell.value;
    })
  );
  let activeScreen = "home";
  let selectedDifficulty = settings.preferredDifficulty;
  let difficultyPickerOpen = false;
  let languagePickerOpen = false;
  let language = settings.language;
  const puzzleCursorByDifficulty = {};
  let t = createTranslator(language);
  let game = restoredSession.game;
  let selectedIndex = restoredSession.selectedIndex;
  let noteMode = restoredSession.noteMode;
  let stats = loadStats();
  let hintCount = 0;
  let checkCount = 0;
  let mistakeCount = 0;
  let completionVisible = false;
  let statsOverlayVisible = false;
  let completionSummary = null;
  let feedbackMessage = "";
  let feedbackType = "info";
  let issueIndexes = [];
  let settingsEntrySource = "home";
  let hintState = {
    currentLevel: null,
    targetIndex: -1,
    relatedIndexes: [],
    progress: null
  };

  const homeScene = createHomeScene({
    canvasWidth: canvasWidth,
    canvasHeight: canvasHeight,
    primaryBrushAsset: primaryBrushAsset,
    difficultyAssets: difficultyAssets
  });
  const settingsScene = createSettingsScene({
    canvasWidth: canvasWidth,
    canvasHeight: canvasHeight
  });
  const languageScene = createLanguageScene({
    canvasWidth: canvasWidth,
    canvasHeight: canvasHeight
  });
  const boardScene = createBoardScene({
    canvasWidth: canvasWidth,
    canvasHeight: canvasHeight
  });
  const toolbar = createToolbar({
    canvasWidth: canvasWidth,
    canvasHeight: canvasHeight,
    boardMetrics: boardScene.getMetrics()
  });

  if (typeof wx.createImage === "function") {
    primaryBrushAsset.image = wx.createImage();
    primaryBrushAsset.image.onload = function () {
      primaryBrushAsset.loaded = true;
      draw();
    };
    primaryBrushAsset.image.onerror = function () {
      primaryBrushAsset.loaded = false;
    };
    primaryBrushAsset.image.src = "assets/ui/brush/brush-warm-primary.png";

    Object.keys(difficultyAssets).forEach(function (key) {
      const asset = difficultyAssets[key];
      asset.image = wx.createImage();
      asset.image.onload = function () {
        asset.loaded = true;
        draw();
      };
      asset.image.onerror = function () {
        asset.loaded = false;
      };
      asset.image.src = asset.src;
    });
  }

  function persistGameState() {
    saveCurrentGame({
      game: game,
      selectedIndex: selectedIndex,
      noteMode: noteMode
    });
  }

  function persistSettingsState() {
    saveSettings({
      preferredDifficulty: selectedDifficulty,
      language: language
    });
  }

  function applyGameSnapshot(nextGame, nextSelectedIndex, nextNoteMode) {
    game = nextGame;
    selectedIndex = nextSelectedIndex;
    noteMode = nextNoteMode;
    persistGameState();
  }

  function switchScreen(nextScreen) {
    activeScreen = nextScreen;
    draw();
  }

  function clearFeedbackState() {
    feedbackMessage = "";
    feedbackType = "info";
    issueIndexes = [];
    hintState = {
      currentLevel: null,
      targetIndex: -1,
      relatedIndexes: [],
      progress: null
    };
  }

  function resetCompletionState() {
    completionVisible = false;
    statsOverlayVisible = false;
    completionSummary = null;
    hintCount = 0;
    checkCount = 0;
    mistakeCount = 0;
  }

  function isGameCompleted(nextGame) {
    return isGameCompletedState(nextGame);
  }

  function openCompletionState() {
    const summary = createCompletionSummary({
      difficulty: game.difficulty,
      elapsedSeconds: game.elapsedSeconds,
      hintCount: hintCount,
      checkCount: checkCount,
      mistakeCount: mistakeCount,
      completedAt: new Date().toISOString(),
      t: t
    });

    completionSummary = summary;
    stats = applyCompletionToStats(stats, summary);
    saveStats(stats);
    completionVisible = true;
    statsOverlayVisible = false;
  }

  function createNearCompleteSession(difficulty) {
    const puzzle = findPuzzleByDifficulty(difficulty, puzzleCursorByDifficulty);
    const nextGame = createGame(puzzle);
    let lastEditableIndex = -1;

    nextGame.cells.forEach(function (cell) {
      if (!cell.given) {
        lastEditableIndex = cell.index;
      }
    });

    nextGame.cells.forEach(function (cell) {
      if (!cell.given && cell.index !== lastEditableIndex) {
        cell.value = nextGame.solution[cell.index];
      }
    });

    nextGame.elapsedSeconds = 428;

    return {
      game: nextGame,
      selectedIndex: lastEditableIndex,
      noteMode: false
    };
  }

  function loadDebugNearCompleteGame() {
    const session = createNearCompleteSession(selectedDifficulty);

    resetCompletionState();
    clearFeedbackState();
    applyGameSnapshot(session.game, session.selectedIndex, session.noteMode);
    switchScreen("board");
  }

  function startNewGame() {
    const puzzle = findPuzzleByDifficulty(selectedDifficulty, puzzleCursorByDifficulty);
    resetCompletionState();
    clearFeedbackState();
    applyGameSnapshot(createGame(puzzle), -1, false);
    switchScreen("board");
  }

  function applyDifficultySelection(nextDifficulty) {
    if (selectedDifficulty === nextDifficulty) {
      return false;
    }

    selectedDifficulty = nextDifficulty;
    const puzzle = findPuzzleByDifficulty(selectedDifficulty, puzzleCursorByDifficulty);
    clearFeedbackState();
    feedbackMessage = t("settings.difficultyChanged", {
      difficulty: t("difficulty." + selectedDifficulty)
    });
    feedbackType = "info";
    applyGameSnapshot(createGame(puzzle), -1, false);
    persistSettingsState();
    return true;
  }

  function continueGame() {
    clearFeedbackState();
    switchScreen("board");
  }

  function openSettings(source) {
    difficultyPickerOpen = false;
    languagePickerOpen = false;
    settingsEntrySource = source;
    switchScreen("settings");
  }

  function goBackFromSettings() {
    switchScreen(settingsEntrySource === "board" ? "board" : "home");
  }

  function handleHomeAction(homeAction) {
    if (!homeAction) {
      return false;
    }

    if (homeAction.type === "difficulty") {
      selectedDifficulty = homeAction.value;
      difficultyPickerOpen = false;
      persistSettingsState();
      switchScreen("home");
      return true;
    }

    if (homeAction.type !== "action") {
      return false;
    }

    if (homeAction.value === "toggle-difficulty-picker") {
      difficultyPickerOpen = !difficultyPickerOpen;
      switchScreen("home");
      return true;
    }

    if (homeAction.value === "continue" && hasSavedGame) {
      difficultyPickerOpen = false;
      continueGame();
      return true;
    }

    if (homeAction.value === "new-game") {
      difficultyPickerOpen = false;
      startNewGame();
      return true;
    }

    if (homeAction.value === "settings") {
      openSettings("home");
      return true;
    }

    if (homeAction.value === "debug-near-complete" && DEBUG_NEAR_COMPLETE_SHORTCUT_ENABLED) {
      loadDebugNearCompleteGame();
      return true;
    }

    return false;
  }

  function handleSettingsAction(settingsAction) {
    if (!settingsAction) {
      return false;
    }

    if (settingsAction.type === "action" && settingsAction.value === "back") {
      goBackFromSettings();
      return true;
    }

    if (settingsAction.type === "action" && settingsAction.value === "toggle-language-picker") {
      languagePickerOpen = !languagePickerOpen;
      switchScreen("settings");
      return true;
    }

    if (settingsAction.type === "language") {
      language = settingsAction.value;
      t = createTranslator(language);
      languagePickerOpen = false;
      persistSettingsState();
      switchScreen("settings");
      return true;
    }

    if (settingsAction.type === "action" && settingsAction.value === "restart-game") {
      startNewGame();
      return true;
    }

    if (settingsAction.type === "difficulty") {
      applyDifficultySelection(settingsAction.value);
      languagePickerOpen = false;
      switchScreen("settings");
      return true;
    }

    return false;
  }

  function drawHome() {
    context.clearRect(0, 0, canvasWidth, canvasHeight);
    homeScene.draw(context, {
      hasSavedGame: hasSavedGame,
      selectedDifficulty: selectedDifficulty,
      difficultyPickerOpen: difficultyPickerOpen,
      recentSummary: buildRecentSummary(stats, t),
      homeReturnCard: buildHomeReturnCard(stats, hasSavedGame, t),
      t: t
    });
  }

  function drawSettings() {
    context.clearRect(0, 0, canvasWidth, canvasHeight);
    settingsScene.draw(context, {
      selectedDifficulty: selectedDifficulty,
      language: language,
      t: t
    });

    if (languagePickerOpen) {
      languageScene.draw(context, {
        selectedDifficulty: selectedDifficulty,
        language: language,
        t: t
      });
    }
  }

  function drawBoard() {
    const difficulty = game.difficulty;
    const theme = getThemeByDifficulty(difficulty);
    const cells = buildBoardView(game, selectedIndex, {
      issueIndexes: issueIndexes,
      hintTargetIndex: hintState.targetIndex,
      hintRelatedIndexes: hintState.relatedIndexes
    });

    context.clearRect(0, 0, canvasWidth, canvasHeight);
    context.fillStyle = theme.background || "#f7f4ef";
    context.fillRect(0, 0, canvasWidth, canvasHeight);
    boardScene.draw(context, cells, {
      theme: Object.assign({}, theme, { t: t }),
      feedbackMessage: feedbackMessage,
      feedbackType: feedbackType,
      hintProgress: hintState.progress,
      completionSummary: completionSummary,
      completionVisible: completionVisible,
      statsOverlayVisible: statsOverlayVisible,
      statsSnapshot: stats,
      t: t,
      title: "方庭九屿",
      difficultyLabel: t("difficulty." + difficulty),
      timerLabel: t("board.timerLabel") + " " + formatElapsedClock(game.elapsedSeconds),
      settingsLabel: t("settings.title")
    });
    toolbar.draw(context, noteMode, Object.assign({}, theme, { t: t }));
  }

  function advanceElapsedTime() {
    if (activeScreen !== "board" || completionVisible || statsOverlayVisible) {
      return;
    }

    game.elapsedSeconds += 1;
    persistGameState();
    draw();
  }

  if (typeof setInterval === "function") {
    const timerHandle = setInterval(advanceElapsedTime, 1000);
    if (timerHandle && typeof timerHandle.unref === "function") {
      timerHandle.unref();
    }
  }

  function draw() {
    if (activeScreen === "home") {
      drawHome();
      return;
    }

    if (activeScreen === "settings") {
      drawSettings();
      return;
    }

    drawBoard();
  }

  wx.onTouchStart(function (event) {
    const point = getTouchPoint(event);

    if (!point) {
      return;
    }

    if (activeScreen === "home") {
      handleHomeAction(homeScene.hitTest(point.x, point.y, {
        hasSavedGame: hasSavedGame,
        selectedDifficulty: selectedDifficulty,
        difficultyPickerOpen: difficultyPickerOpen,
        debugShortcutEnabled: DEBUG_NEAR_COMPLETE_SHORTCUT_ENABLED
      }));
      return;
    }

    if (activeScreen === "settings") {
      if (languagePickerOpen) {
        const languageAction = languageScene.hitTest(point.x, point.y);
        const languageMetrics = languageScene.getMetrics();

        if (languageAction) {
          handleSettingsAction(languageAction);
          return;
        }

        if (
          point.x < languageMetrics.shellLeft ||
          point.x > languageMetrics.shellRight ||
          point.y < languageMetrics.shellTop ||
          point.y > languageMetrics.shellBottom
        ) {
          languagePickerOpen = false;
          switchScreen("settings");
        }
        return;
      }

      handleSettingsAction(settingsScene.hitTest(point.x, point.y, {}));
      return;
    }

    if (statsOverlayVisible) {
      const statsAction = boardScene.hitTestStatsOverlayAction(point.x, point.y, {
        statsOverlayVisible: statsOverlayVisible
      });

      if (statsAction && statsAction.value === "back-to-completion") {
        statsOverlayVisible = false;
        switchScreen("board");
      }
      return;
    }

    if (completionVisible) {
      const completionAction = boardScene.hitTestCompletionAction(point.x, point.y, {
        completionVisible: completionVisible,
        completionSummary: completionSummary
      });

      if (!completionAction) {
        return;
      }

      if (completionAction.value === "new-game") {
        startNewGame();
        return;
      }

      if (completionAction.value === "home") {
        resetCompletionState();
        switchScreen("home");
        return;
      }

      if (completionAction.value === "stats") {
        statsOverlayVisible = true;
        switchScreen("board");
      }

      return;
    }

    const headerAction = boardScene.hitTestHeaderAction(point.x, point.y);

    if (headerAction && headerAction.type === "action" && headerAction.value === "settings") {
      openSettings("board");
      return;
    }

    const hitCellIndex = boardScene.getCellIndexByPoint(point.x, point.y);

    if (hitCellIndex >= 0) {
      issueIndexes = [];
      hintState.targetIndex = -1;
      hintState.relatedIndexes = [];
      hintState.progress = null;
      applyGameSnapshot(game, hitCellIndex, noteMode);
      switchScreen("board");
      return;
    }

    const toolbarAction = toolbar.hitTest(point.x, point.y);

    if (!toolbarAction) {
      return;
    }

    if (toolbarAction.type === "number" && selectedIndex >= 0) {
      const nextGame = noteMode
        ? toggleCellNote(game, selectedIndex, toolbarAction.value)
        : applyInputValue(game, selectedIndex, toolbarAction.value);

      if (nextGame !== game) {
        clearFeedbackState();
        applyGameSnapshot(nextGame, selectedIndex, noteMode);
        if (isGameCompleted(nextGame)) {
          openCompletionState();
        }
      }

      switchScreen("board");
      return;
    }

    if (toolbarAction.type === "tool") {
      if (toolbarAction.value === "note") {
        applyGameSnapshot(game, selectedIndex, !noteMode);
      }

      if (toolbarAction.value === "undo") {
        const undoResult = undoLastStep(game);

        if (
          undoResult.game !== game ||
          undoResult.selectedIndex !== selectedIndex
        ) {
          clearFeedbackState();
          applyGameSnapshot(undoResult.game, undoResult.selectedIndex, noteMode);
        }
      }

      if (toolbarAction.value === "erase") {
        const nextGame = eraseCellContent(game, selectedIndex, noteMode);

        if (nextGame !== game) {
          clearFeedbackState();
          applyGameSnapshot(nextGame, selectedIndex, noteMode);
        }
      }

      if (toolbarAction.value === "hint") {
        hintCount += 1;
        const localizedHint = getNextHint(game, game.difficulty, hintState, t);
        feedbackMessage = localizedHint.message;
        feedbackType = "info";
        issueIndexes = [];
        hintState = {
          currentLevel: localizedHint.level,
          targetIndex: localizedHint.targetIndex,
          relatedIndexes: localizedHint.relatedIndexes || [],
          progress: localizedHint.progress || null
        };
      }

      if (toolbarAction.value === "check") {
        checkCount += 1;
        const result = runDifficultyCheck(game, game.difficulty, t);
        feedbackMessage = result.message;
        feedbackType = result.hasIssue ? "warning" : "success";
        issueIndexes = result.issueIndexes;
        hintState.targetIndex = -1;
        hintState.relatedIndexes = [];
        hintState.progress = null;
        if (result.hasIssue) {
          mistakeCount += 1;
        }
      }

      switchScreen("board");
    }
  });

  draw();
}

boot();
