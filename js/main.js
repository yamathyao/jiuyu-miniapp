const { puzzles } = require("./data/puzzles");
const { foundationLessons } = require("./data/puzzles-foundation");
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
  saveStats,
  loadProgress,
  saveProgress,
  loadTutorialProgress,
  saveTutorialProgress,
  loadPuzzleSelectionHistory,
  savePuzzleSelectionHistory
} = require("./services/storage");
const {
  isLessonUnlocked,
  completeTutorialLesson,
  validateTutorialInput
} = require("./services/tutorial-service");
const {
  selectNormalPuzzle,
  selectExamPuzzle,
  recordPuzzleCompletion,
  recordTimedOutExam
} = require("./services/puzzle-selection-service");
const { runDifficultyCheck } = require("./services/checker");
const { getNextHint } = require("./services/hint-engine");
const {
  createCompletionSummary,
  applyCompletionToStats,
  buildLastResultTags
} = require("./services/stats-service");
const {
  isDifficultyUnlocked,
  applyExamPassToProgress,
  applyExamFailureToProgress,
  applyPointsToProgress,
  getPointsReward,
  getUnlockCost
} = require("./services/progress-service");
const {
  registerShareSupport
} = require("./services/share-service");
const { createTranslator } = require("./i18n");
const { getThemeByDifficulty } = require("./ui/theme-policy");
const { createHomeScene } = require("./scene/home-scene");
const { createBoardScene } = require("./scene/board-scene");
const { createSettingsScene } = require("./scene/settings-scene");
const { createLanguageScene } = require("./scene/language-scene");
const { createTutorialScene } = require("./scene/tutorial-scene");
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

function getExamTimeLimitSeconds(difficulty) {
  if (difficulty === "beginner") {
    return 600;
  }

  if (difficulty === "intermediate") {
    return 600;
  }

  if (difficulty === "skilled") {
    return 600;
  }

  if (difficulty === "expert") {
    return 600;
  }

  return 0;
}

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

function hasAnyExamAttempt(progress) {
  if (!progress || !progress.examRecordByDifficulty) {
    return false;
  }

  return Object.keys(progress.examRecordByDifficulty).some(function (difficulty) {
    const record = progress.examRecordByDifficulty[difficulty];
    return Boolean(record && (record.attempted || record.passed || record.failedCount > 0));
  });
}

function isGameCompletedState(game) {
  return Boolean(game) && Array.isArray(game.cells) && game.cells.every(function (cell) {
    return cell.value === game.solution[cell.index];
  });
}

function isExamSettingsRestricted(examState, settingsEntrySource) {
  return Boolean(
    examState &&
    examState.active &&
    settingsEntrySource === "board"
  );
}

function hasMeaningfulSave(session) {
  return !isGameCompletedState(session.game) && (
    session.game.history.length > 0 ||
    session.game.cells.some(function (cell) {
      return !cell.given && cell.value;
    })
  );
}

function boot() {
  if (typeof wx === "undefined" || !wx.createCanvas) {
    return;
  }

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
  let hasSavedGame = hasMeaningfulSave(restoredSession) || Boolean(restoredSession.tutorialState);
  let activeScreen = "home";
  let selectedDifficulty = settings.preferredDifficulty;
  let difficultyPickerOpen = false;
  let languagePickerOpen = false;
  let language = settings.language;
  const puzzleCursorByDifficulty = {};
  let t = createTranslator(language);
  registerShareSupport(wx, t);
  let game = restoredSession.game;
  let selectedIndex = restoredSession.selectedIndex;
  let noteMode = restoredSession.noteMode;
  let stats = loadStats();
  let progress = loadProgress();
  let tutorialProgress = loadTutorialProgress();
  let puzzleSelectionHistory = loadPuzzleSelectionHistory(puzzles);
  let initialExamChoiceVisible = !hasAnyExamAttempt(progress) &&
    stats.totalCompleted === 0 &&
    tutorialProgress.completedLessonIds.length === 0 &&
    !restoredSession.tutorialState;
  let hintCount = 0;
  let checkCount = 0;
  let mistakeCount = 0;
  let completionVisible = false;
  let statsOverlayVisible = false;
  let completionSummary = null;
  let examState = restoredSession.examState || null;
  let tutorialState = restoredSession.tutorialState || null;
  let lockedDifficultyDialog = null;
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
  const tutorialScene = createTutorialScene({
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
      noteMode: noteMode,
      examState: examState,
      tutorialState: tutorialState
    });
  }

  function persistProgressState() {
    saveProgress(progress);
  }

  function persistTutorialProgress() {
    saveTutorialProgress(tutorialProgress);
  }

  function persistPuzzleSelectionHistory() {
    savePuzzleSelectionHistory(puzzleSelectionHistory, puzzles);
  }

  function persistSettingsState() {
    saveSettings({
      preferredDifficulty: selectedDifficulty,
      language: language
    });
  }

  function restoreUnlockedDifficultySelection() {
    if (isDifficultyUnlocked(progress, selectedDifficulty)) {
      return;
    }

    selectedDifficulty = "beginner";
    persistSettingsState();
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

  function clearLockedDifficultyDialog() {
    lockedDifficultyDialog = null;
  }

  function buildLockedDifficultyDialog(difficulty, mode) {
    const cost = getUnlockCost(difficulty);
    const remaining = Math.max(0, cost - progress.totalPoints);

    return {
      difficulty: difficulty,
      mode: mode || "actions",
      title: t("home.lockedDialog.title", {
        difficulty: t("difficulty." + difficulty)
      }),
      examAction: t("home.lockedDialog.examAction"),
      pointsAction: t("home.lockedDialog.pointsAction"),
      pointsProgress: t("home.lockedDialog.pointsProgress", {
        points: String(progress.totalPoints),
        cost: String(cost)
      }),
      pointsRemaining: t("home.lockedDialog.pointsRemaining", {
        remaining: String(remaining)
      }),
      fallbackHint: t("home.lockedDialog.fallbackHint"),
      examUnlockHint: t("home.lockedDialog.examUnlockHint")
    };
  }

  function isGameCompleted(nextGame) {
    return isGameCompletedState(nextGame);
  }

  function openCompletionState() {
    const completedExam = Boolean(examState && examState.active);
    const passedExam = Boolean(completedExam && !examState.deadlineReached);
    const pointsAwarded = finalizeProgressRewards();
    const summary = createCompletionSummary({
      difficulty: game.difficulty,
      elapsedSeconds: game.elapsedSeconds,
      hintCount: hintCount,
      checkCount: checkCount,
      mistakeCount: mistakeCount,
      completedAt: new Date().toISOString(),
      t: t
    });

    completionSummary = Object.assign({}, summary, {
      pointsAwarded: pointsAwarded,
      examFailed: Boolean(completedExam && !passedExam),
      examPassed: passedExam
    });
    stats = applyCompletionToStats(stats, summary);
    saveStats(stats);
    if (!examState || passedExam) {
      puzzleSelectionHistory = recordPuzzleCompletion(
        puzzleSelectionHistory,
        game.puzzleId,
        puzzles
      );
      persistPuzzleSelectionHistory();
    }
    examState = null;
    completionVisible = true;
    statsOverlayVisible = false;
  }

  function finalizeProgressRewards() {
    const isExamRun = Boolean(examState && examState.active);
    const failedExam = Boolean(isExamRun && examState.deadlineReached);
    const pointsAwarded = failedExam ? 0 : getPointsReward(game.difficulty);

    if (isExamRun && !failedExam) {
      progress = applyExamPassToProgress(
        progress,
        examState.difficulty,
        Math.max(0, examState.timeLimitSeconds - game.elapsedSeconds)
      );
    }

    if (pointsAwarded > 0) {
      progress = applyPointsToProgress(progress, pointsAwarded);
    }

    persistProgressState();
    return pointsAwarded;
  }

  function getTutorialLesson(lessonId) {
    return foundationLessons.find(function (lesson) {
      return lesson.id === lessonId;
    }) || null;
  }

  function getCurrentTutorialStep() {
    const lesson = tutorialState && getTutorialLesson(tutorialState.lessonId);

    return lesson && lesson.tutorialSteps[tutorialState.stepIndex]
      ? lesson.tutorialSteps[tutorialState.stepIndex]
      : null;
  }

  function isTutorialGame() {
    return Boolean(tutorialState && game.difficulty === "foundation");
  }

  function openTutorial() {
    difficultyPickerOpen = false;
    initialExamChoiceVisible = false;
    switchScreen("tutorial");
  }

  function startTutorialLesson(lessonId) {
    const lesson = getTutorialLesson(lessonId);

    if (!lesson || !isLessonUnlocked(tutorialProgress, lessonId)) {
      return;
    }

    const firstStep = lesson.tutorialSteps[0];
    resetCompletionState();
    clearFeedbackState();
    examState = null;
    tutorialState = { lessonId: lessonId, stepIndex: 0 };
    feedbackMessage = t(firstStep.explanationKey);
    feedbackType = "info";
    hintState = {
      currentLevel: null,
      targetIndex: firstStep.targetIndex,
      relatedIndexes: firstStep.relatedIndexes,
      progress: null
    };
    applyGameSnapshot(createGame(lesson), firstStep.targetIndex, false);
    hasSavedGame = true;
    switchScreen("board");
  }

  function handleTutorialInput(value) {
    const lesson = getTutorialLesson(tutorialState.lessonId);
    const step = getCurrentTutorialStep();
    const result = validateTutorialInput(lesson, game, tutorialState.stepIndex, selectedIndex, value);

    if (result.status === "blocked") {
      feedbackMessage = t("tutorial.blocked");
      feedbackType = "warning";
      switchScreen("board");
      return;
    }

    if (result.status === "incorrect") {
      feedbackMessage = t("tutorial.incorrect");
      feedbackType = "warning";
      switchScreen("board");
      return;
    }

    const nextGame = applyInputValue(game, step.targetIndex, value);
    if (result.status === "complete") {
      tutorialProgress = completeTutorialLesson(tutorialProgress, lesson.id);
      persistTutorialProgress();
      tutorialState = null;
      applyGameSnapshot(nextGame, -1, false);
      hasSavedGame = false;
      if (lesson.id === foundationLessons[foundationLessons.length - 1].id) {
        completionSummary = {
          difficulty: "foundation",
          elapsedSeconds: nextGame.elapsedSeconds,
          hintCount: 0,
          checkCount: 0,
          mistakeCount: 0,
          resultTags: [],
          pointsAwarded: 0,
          tutorial: true,
          title: t("tutorial.graduation.title"),
          encouragement: t("tutorial.graduation.encouragement")
        };
        completionVisible = true;
        switchScreen("board");
        return;
      }

      completionSummary = {
        difficulty: "foundation",
        elapsedSeconds: nextGame.elapsedSeconds,
        hintCount: 0,
        checkCount: 0,
        mistakeCount: 0,
        resultTags: [],
        tutorialLesson: true,
        title: t("tutorial.lessonComplete." + lesson.id + ".title"),
        achievement: t("tutorial.lessonComplete." + lesson.id + ".achievement"),
        encouragement: t("tutorial.lessonComplete." + lesson.id + ".advice")
      };
      completionVisible = true;
      switchScreen("board");
      return;
    }

    tutorialState = { lessonId: lesson.id, stepIndex: result.nextStepIndex };
    const nextStep = getCurrentTutorialStep();
    feedbackMessage = t(nextStep.explanationKey);
    feedbackType = "info";
    hintState = {
      currentLevel: null,
      targetIndex: nextStep.targetIndex,
      relatedIndexes: nextStep.relatedIndexes,
      progress: null
    };
    applyGameSnapshot(nextGame, nextStep.targetIndex, false);
    switchScreen("board");
  }

  function startNewGame() {
    const puzzle = selectNormalPuzzle(
      puzzles,
      selectedDifficulty,
      puzzleSelectionHistory,
      puzzleCursorByDifficulty
    );
    resetCompletionState();
    clearFeedbackState();
    clearLockedDifficultyDialog();
    initialExamChoiceVisible = false;
    examState = null;
    tutorialState = null;
    applyGameSnapshot(createGame(puzzle), -1, false);
    hasSavedGame = false;
    switchScreen("board");
  }

  function startExamGame(difficulty) {
    const puzzle = selectExamPuzzle(puzzles, difficulty, puzzleSelectionHistory);
    resetCompletionState();
    clearFeedbackState();
    clearLockedDifficultyDialog();
    initialExamChoiceVisible = false;
    examState = {
      active: true,
      difficulty: difficulty,
      timeLimitSeconds: getExamTimeLimitSeconds(difficulty),
      deadlineReached: false
    };
    applyGameSnapshot(createGame(puzzle), -1, false);
    hasSavedGame = false;
    switchScreen("board");
  }

  function abandonExamToHome() {
    selectedDifficulty = "beginner";
    examState = null;
    languagePickerOpen = false;
    difficultyPickerOpen = false;
    lockedDifficultyDialog = null;
    initialExamChoiceVisible = false;
    const puzzle = selectNormalPuzzle(
      puzzles,
      selectedDifficulty,
      puzzleSelectionHistory,
      puzzleCursorByDifficulty
    );
    game = createGame(puzzle);
    selectedIndex = -1;
    noteMode = false;
    hasSavedGame = false;
    persistSettingsState();
    persistGameState();
    switchScreen("home");
  }

  function openLockedDifficultyDialog(difficulty) {
    lockedDifficultyDialog = buildLockedDifficultyDialog(difficulty, "actions");
    difficultyPickerOpen = false;
    initialExamChoiceVisible = false;
    switchScreen("home");
  }

  function showLockedDifficultyPoints(difficulty) {
    lockedDifficultyDialog = buildLockedDifficultyDialog(difficulty, "points");
    difficultyPickerOpen = false;
    initialExamChoiceVisible = false;
    switchScreen("home");
  }

  function buildDifficultyStates() {
    return {
      foundation: { unlocked: true },
      beginner: { unlocked: isDifficultyUnlocked(progress, "beginner") },
      intermediate: { unlocked: isDifficultyUnlocked(progress, "intermediate") },
      skilled: { unlocked: isDifficultyUnlocked(progress, "skilled") },
      expert: { unlocked: isDifficultyUnlocked(progress, "expert") }
    };
  }

  function applyDifficultySelection(nextDifficulty) {
    if (nextDifficulty === "foundation") {
      openTutorial();
      return false;
    }

    if (selectedDifficulty === nextDifficulty) {
      return false;
    }

    selectedDifficulty = nextDifficulty;
    const puzzle = selectNormalPuzzle(
      puzzles,
      selectedDifficulty,
      puzzleSelectionHistory,
      puzzleCursorByDifficulty
    );
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
    if (isTutorialGame()) {
      const step = getCurrentTutorialStep();
      if (step) {
        selectedIndex = step.targetIndex;
        noteMode = false;
        feedbackMessage = t(step.explanationKey);
        hintState.targetIndex = step.targetIndex;
        hintState.relatedIndexes = step.relatedIndexes;
      }
    }
    switchScreen("board");
  }

  function openSettings(source) {
    difficultyPickerOpen = false;
    languagePickerOpen = false;
    settingsEntrySource = source;
    switchScreen("settings");
  }

  function goBackFromSettings() {
    if (isExamSettingsRestricted(examState, settingsEntrySource)) {
      abandonExamToHome();
      return;
    }

    switchScreen("home");
  }

  function handleHomeAction(homeAction) {
    if (!homeAction) {
      return false;
    }

    if (homeAction.type === "difficulty") {
      if (homeAction.value === "foundation") {
        openTutorial();
        return true;
      }
      selectedDifficulty = homeAction.value;
      difficultyPickerOpen = false;
      clearLockedDifficultyDialog();
      initialExamChoiceVisible = false;
      persistSettingsState();
      switchScreen("home");
      return true;
    }

    if (homeAction.type === "locked-difficulty") {
      openLockedDifficultyDialog(homeAction.value);
      return true;
    }

    if (homeAction.type !== "action") {
      return false;
    }

    if (homeAction.value === "toggle-difficulty-picker") {
      difficultyPickerOpen = !difficultyPickerOpen;
      clearLockedDifficultyDialog();
      initialExamChoiceVisible = false;
      switchScreen("home");
      return true;
    }

    if (homeAction.value.indexOf("start-initial-exam:") === 0) {
      startExamGame(homeAction.value.split(":")[1]);
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

    if (homeAction.value === "start-locked-exam" && lockedDifficultyDialog) {
      startExamGame(lockedDifficultyDialog.difficulty);
      return true;
    }

    if (homeAction.value === "view-locked-points" && lockedDifficultyDialog) {
      showLockedDifficultyPoints(lockedDifficultyDialog.difficulty);
      return true;
    }

    if (homeAction.value === "settings") {
      openSettings("home");
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

    if (settingsAction.type === "action" && settingsAction.value === "resume-game") {
      continueGame();
      return true;
    }

    if (settingsAction.type === "action" && settingsAction.value === "open-tutorial") {
      openTutorial();
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
      if (isTutorialGame()) {
        startTutorialLesson(tutorialState.lessonId);
        return true;
      }
      startNewGame();
      return true;
    }

    if (settingsAction.type === "action" && settingsAction.value === "exit-exam") {
      abandonExamToHome();
      return true;
    }

    if (settingsAction.type === "difficulty") {
      if (settingsAction.value === "foundation") {
        openTutorial();
        return true;
      }
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
      savedGameDifficulty: hasSavedGame && game ? game.difficulty : null,
      selectedDifficulty: selectedDifficulty,
      difficultyPickerOpen: difficultyPickerOpen,
      initialExamChoiceVisible: initialExamChoiceVisible,
      difficultyStates: buildDifficultyStates(),
      lockedDifficultyDialog: lockedDifficultyDialog,
      recentSummary: buildRecentSummary(stats, t),
      homeReturnCard: buildHomeReturnCard(stats, hasSavedGame, t),
      t: t
    });
  }

  function drawSettings() {
    context.clearRect(0, 0, canvasWidth, canvasHeight);
    settingsScene.draw(context, {
      selectedDifficulty: selectedDifficulty,
      difficultyStates: buildDifficultyStates(),
      language: language,
      showResumeAction: settingsEntrySource === "board",
      examSettingsRestricted: isExamSettingsRestricted(examState, settingsEntrySource),
      backLabel: settingsEntrySource === "board" || isExamSettingsRestricted(examState, settingsEntrySource)
        ? t("settings.backHome")
        : t("common.back"),
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

  function drawTutorial() {
    const lessonStates = foundationLessons.reduce(function (states, lesson) {
      states[lesson.id] = {
        locked: !isLessonUnlocked(tutorialProgress, lesson.id),
        completed: tutorialProgress.completedLessonIds.indexOf(lesson.id) >= 0
      };
      return states;
    }, {});

    tutorialScene.draw(context, {
      lessons: foundationLessons,
      lessonStates: lessonStates,
      t: t
    });
  }

  function drawBoard() {
    const difficulty = game.difficulty;
    const theme = getThemeByDifficulty(difficulty);
    const difficultyLabel = examState
      ? t("board.examDifficultyLabel", {
          difficulty: t("difficulty." + difficulty)
        })
      : t("difficulty." + difficulty);
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
      examState: examState ? {
        active: true,
        failed: Boolean(examState.deadlineReached),
        remainingLabel: t("board.examRemaining", {
          time: formatElapsedClock(Math.max(0, examState.timeLimitSeconds - game.elapsedSeconds))
        })
      } : null,
      completionSummary: completionSummary,
      completionVisible: completionVisible,
      statsOverlayVisible: statsOverlayVisible,
      statsSnapshot: stats,
      t: t,
      title: "方庭九屿",
      difficultyLabel: difficultyLabel,
      timerLabel: t("board.timerLabel") + " " + formatElapsedClock(game.elapsedSeconds),
      settingsLabel: t("settings.title")
    });
    toolbar.draw(context, noteMode, Object.assign({}, theme, { t: t }), {
      hideTools: isTutorialGame()
    });
  }

  function advanceElapsedTime() {
    if (activeScreen !== "board" || completionVisible || statsOverlayVisible) {
      return;
    }

    game.elapsedSeconds += 1;

    if (examState && examState.active && !examState.deadlineReached) {
      if (game.elapsedSeconds >= examState.timeLimitSeconds) {
        examState.deadlineReached = true;
        progress = applyExamFailureToProgress(progress, examState.difficulty);
        persistProgressState();
        puzzleSelectionHistory = recordTimedOutExam(
          puzzleSelectionHistory,
          game.puzzleId,
          puzzles
        );
        persistPuzzleSelectionHistory();
        feedbackMessage = t("board.examFailed");
        feedbackType = "warning";
      }
    }

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

    if (activeScreen === "tutorial") {
      drawTutorial();
      return;
    }

    drawBoard();
  }

  if (typeof wx.onShow === "function") {
    wx.onShow(function () {
      configureCanvas(canvas, context, viewport);
      draw();
    });
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
        initialExamChoiceVisible: initialExamChoiceVisible,
        difficultyStates: buildDifficultyStates(),
        lockedDifficultyDialog: lockedDifficultyDialog
      }));
      return;
    }

    if (activeScreen === "tutorial") {
      const tutorialAction = tutorialScene.hitTest(point.x, point.y, {
        lessons: foundationLessons,
        lessonStates: foundationLessons.reduce(function (states, lesson) {
          states[lesson.id] = {
            locked: !isLessonUnlocked(tutorialProgress, lesson.id),
            completed: tutorialProgress.completedLessonIds.indexOf(lesson.id) >= 0
          };
          return states;
        }, {})
      });

      if (tutorialAction && tutorialAction.type === "lesson") {
        startTutorialLesson(tutorialAction.value);
      } else if (tutorialAction && tutorialAction.value === "home") {
        switchScreen("home");
      }
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

      handleSettingsAction(settingsScene.hitTest(point.x, point.y, {
        difficultyStates: buildDifficultyStates(),
        showResumeAction: settingsEntrySource === "board",
        examSettingsRestricted: isExamSettingsRestricted(examState, settingsEntrySource)
      }));
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

      if (completionAction.value === "retry-exam") {
        startExamGame(completionSummary.difficulty);
        return;
      }

      if (completionAction.value === "continue-tutorial") {
        resetCompletionState();
        openTutorial();
        return;
      }

      if (completionAction.value === "start-beginner") {
        selectedDifficulty = "beginner";
        resetCompletionState();
        startNewGame();
        return;
      }

      if (completionAction.value === "replay-tutorial") {
        resetCompletionState();
        openTutorial();
        return;
      }

      if (completionAction.value === "home") {
        resetCompletionState();
        restoreUnlockedDifficultySelection();
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
      if (isTutorialGame()) {
        return;
      }
      issueIndexes = [];
      hintState.targetIndex = -1;
      hintState.relatedIndexes = [];
      hintState.progress = null;
      applyGameSnapshot(game, hitCellIndex, noteMode);
      switchScreen("board");
      return;
    }

    const toolbarAction = toolbar.hitTest(point.x, point.y, {
      hideTools: isTutorialGame()
    });

    if (!toolbarAction) {
      return;
    }

    if (toolbarAction.type === "number" && selectedIndex >= 0) {
      if (isTutorialGame()) {
        handleTutorialInput(toolbarAction.value);
        return;
      }
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
      if (isTutorialGame()) {
        feedbackMessage = t("tutorial.blocked");
        feedbackType = "info";
        switchScreen("board");
        return;
      }
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
        const hintTargetCell = game.cells[localizedHint.targetIndex];
        const nextSelectedIndex = hintTargetCell &&
          !hintTargetCell.given &&
          !hintTargetCell.value
          ? localizedHint.targetIndex
          : selectedIndex;
        feedbackMessage = localizedHint.message;
        feedbackType = "info";
        issueIndexes = [];
        hintState = {
          currentLevel: localizedHint.level,
          targetIndex: localizedHint.targetIndex,
          relatedIndexes: localizedHint.relatedIndexes || [],
          progress: localizedHint.progress || null
        };
        applyGameSnapshot(game, nextSelectedIndex, false);
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
