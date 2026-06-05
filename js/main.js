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
  saveSettings
} = require("./services/storage");
const { runDifficultyCheck } = require("./services/checker");
const { getNextHint } = require("./services/hint-engine");
const { createTranslator } = require("./i18n");
const { getThemeByDifficulty } = require("./ui/theme-policy");
const { createHomeScene } = require("./scene/home-scene");
const { createBoardScene } = require("./scene/board-scene");
const { createSettingsScene } = require("./scene/settings-scene");
const { createLanguageScene } = require("./scene/language-scene");
const { createToolbar } = require("./ui/toolbar");
const { getTouchPoint } = require("./utils/touch");

function findPuzzleByDifficulty(difficulty) {
  return puzzles.find(function (puzzle) {
    return puzzle.difficulty === difficulty;
  }) || puzzles[0];
}

function boot() {
  if (typeof wx === "undefined" || !wx.createCanvas) {
    return;
  }

  const canvas = wx.createCanvas();
  const context = canvas.getContext("2d");
  const canvasWidth = canvas.width || 375;
  const canvasHeight = canvas.height || 812;
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
  const hasSavedGame = restoredSession.game.history.length > 0 ||
    restoredSession.game.cells.some(function (cell) {
      return !cell.given && cell.value;
    });
  let activeScreen = "home";
  let selectedDifficulty = settings.preferredDifficulty;
  let difficultyPickerOpen = false;
  let language = settings.language;
  let t = createTranslator(language);
  let game = restoredSession.game;
  let selectedIndex = restoredSession.selectedIndex;
  let noteMode = restoredSession.noteMode;
  let feedbackMessage = "";
  let feedbackType = "info";
  let issueIndexes = [];
  let settingsEntrySource = "home";
  let hintState = {
    currentLevel: null,
    targetIndex: -1
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

  function clearFeedbackState() {
    feedbackMessage = "";
    feedbackType = "info";
    issueIndexes = [];
    hintState = {
      currentLevel: null,
      targetIndex: -1
    };
  }

  function startNewGame() {
    const puzzle = findPuzzleByDifficulty(selectedDifficulty);
    game = createGame(puzzle);
    selectedIndex = -1;
    noteMode = false;
    clearFeedbackState();
    persistGameState();
    activeScreen = "board";
  }

  function continueGame() {
    activeScreen = "board";
    clearFeedbackState();
  }

  function openSettings(source) {
    difficultyPickerOpen = false;
    settingsEntrySource = source;
    activeScreen = "settings";
  }

  function goBackFromSettings() {
    activeScreen = settingsEntrySource === "board" ? "board" : "home";
  }

  function drawHome() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    homeScene.draw(context, {
      hasSavedGame: hasSavedGame,
      selectedDifficulty: selectedDifficulty,
      difficultyPickerOpen: difficultyPickerOpen,
      t: t
    });
  }

  function drawSettings() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    settingsScene.draw(context, {
      selectedDifficulty: selectedDifficulty,
      language: language,
      t: t
    });
  }

  function drawLanguage() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    languageScene.draw(context, {
      selectedDifficulty: selectedDifficulty,
      language: language,
      t: t
    });
  }

  function drawBoard() {
    const difficulty = game.difficulty;
    const theme = getThemeByDifficulty(difficulty);
    const cells = buildBoardView(game, selectedIndex, {
      issueIndexes: issueIndexes,
      hintTargetIndex: hintState.targetIndex
    });

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = theme.background || "#f7f4ef";
    context.fillRect(0, 0, canvas.width, canvas.height);
    boardScene.draw(context, cells, {
      theme: Object.assign({}, theme, { t: t }),
      feedbackMessage: feedbackMessage,
      feedbackType: feedbackType,
      title: "方庭九屿",
      difficultyLabel: t("difficulty." + difficulty),
      settingsLabel: t("settings.title")
    });
    toolbar.draw(context, noteMode, Object.assign({}, theme, { t: t }));
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

    if (activeScreen === "language") {
      drawLanguage();
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
      const homeAction = homeScene.hitTest(point.x, point.y, {
        hasSavedGame: hasSavedGame,
        selectedDifficulty: selectedDifficulty,
        difficultyPickerOpen: difficultyPickerOpen
      });

      if (!homeAction) {
        return;
      }

      if (homeAction.type === "difficulty") {
        selectedDifficulty = homeAction.value;
        difficultyPickerOpen = false;
        persistSettingsState();
        draw();
        return;
      }

      if (homeAction.type === "action" && homeAction.value === "toggle-difficulty-picker") {
        difficultyPickerOpen = !difficultyPickerOpen;
        draw();
        return;
      }

      if (homeAction.type === "action" && homeAction.value === "continue" && hasSavedGame) {
        difficultyPickerOpen = false;
        continueGame();
        draw();
        return;
      }

      if (homeAction.type === "action" && homeAction.value === "new-game") {
        difficultyPickerOpen = false;
        startNewGame();
        draw();
        return;
      }

      if (homeAction.type === "action" && homeAction.value === "settings") {
        openSettings("home");
        draw();
        return;
      }

      draw();
      return;
    }

    if (activeScreen === "settings") {
      const settingsAction = settingsScene.hitTest(point.x, point.y);

      if (!settingsAction) {
        return;
      }

      if (settingsAction.type === "action" && settingsAction.value === "back") {
        goBackFromSettings();
        draw();
        return;
      }

      if (settingsAction.type === "action" && settingsAction.value === "language") {
        activeScreen = "language";
        draw();
      }

      return;
    }

    if (activeScreen === "language") {
      const languageAction = languageScene.hitTest(point.x, point.y);

      if (!languageAction) {
        return;
      }

      if (languageAction.type === "action" && languageAction.value === "back") {
        activeScreen = "settings";
        draw();
        return;
      }

      if (languageAction.type === "language") {
        language = languageAction.value;
        t = createTranslator(language);
        persistSettingsState();
        draw();
      }

      return;
    }

    const headerAction = boardScene.hitTestHeaderAction(point.x, point.y);

    if (headerAction && headerAction.type === "action" && headerAction.value === "settings") {
      openSettings("board");
      draw();
      return;
    }

    const hitCellIndex = boardScene.getCellIndexByPoint(point.x, point.y);

    if (hitCellIndex >= 0) {
      selectedIndex = hitCellIndex;
      issueIndexes = [];
      hintState.targetIndex = -1;
      persistGameState();
      draw();
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
        game = nextGame;
        clearFeedbackState();
        persistGameState();
      }

      draw();
      return;
    }

    if (toolbarAction.type === "tool") {
      if (toolbarAction.value === "note") {
        noteMode = !noteMode;
        persistGameState();
      }

      if (toolbarAction.value === "undo") {
        const undoResult = undoLastStep(game);

        if (
          undoResult.game !== game ||
          undoResult.selectedIndex !== selectedIndex
        ) {
          game = undoResult.game;
          selectedIndex = undoResult.selectedIndex;
          clearFeedbackState();
          persistGameState();
        }
      }

      if (toolbarAction.value === "erase") {
        const nextGame = eraseCellContent(game, selectedIndex, noteMode);

        if (nextGame !== game) {
          game = nextGame;
          clearFeedbackState();
          persistGameState();
        }
      }

      if (toolbarAction.value === "hint") {
        const localizedHint = getNextHint(game, game.difficulty, hintState, t);
        feedbackMessage = localizedHint.message;
        feedbackType = "info";
        issueIndexes = [];
        hintState = {
          currentLevel: localizedHint.level,
          targetIndex: localizedHint.targetIndex
        };
      }

      if (toolbarAction.value === "check") {
        const result = runDifficultyCheck(game, game.difficulty, t);
        feedbackMessage = result.message;
        feedbackType = result.hasIssue ? "warning" : "success";
        issueIndexes = result.issueIndexes;
        hintState.targetIndex = -1;
      }

      draw();
    }
  });

  draw();
}

boot();
