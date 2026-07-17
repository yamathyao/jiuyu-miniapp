# 难度考试与积分解锁 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为小游戏新增“考试限时解锁 + 普通通关积分保底解锁”机制，并明确考试失败后继续完成也不计入积分。

**Architecture:** 新增 `progress-service` 作为独立进度规则层，`storage` 负责持久化 `progress`，`main.js` 负责把首页、考试运行态、计时与通关结算串起来。UI 只做增量扩展：首页负责锁定态与考试入口，棋盘负责考试状态与结果提示。

**Tech Stack:** WeChat Mini Game JavaScript, Node `node:test`, local sync storage, existing scene-based canvas rendering

---

## File Structure

- Create: `docs/superpowers/plans/2026-06-13-exam-unlock-implementation.md`
- Create: `js/services/progress-service.js`
- Modify: `js/services/storage.js`
- Modify: `js/main.js`
- Modify: `js/scene/home-scene.js`
- Modify: `js/scene/board-scene.js`
- Modify: `js/i18n/locales.js`
- Modify: `tests/game-engine.test.js`

## Task 1: 落地进度模型与存储边界

**Files:**
- Create: `js/services/progress-service.js`
- Modify: `js/services/storage.js`
- Test: `tests/game-engine.test.js`

- [ ] **Step 1: 为 progress-service 写失败单测，固定默认进度与积分/解锁规则**

```js
const {
  createEmptyProgress,
  isDifficultyUnlocked,
  applyExamPassToProgress,
  applyPointsToProgress,
  getPointsReward,
  getUnlockCost
} = require("../js/services/progress-service");

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
```

- [ ] **Step 2: 运行单测，确认 progress-service 相关导入尚不存在而失败**

Run: `node --test tests/game-engine.test.js`

Expected: FAIL with messages like `Cannot find module '../js/services/progress-service'` or missing export errors.

- [ ] **Step 3: 新建 progress-service，封装默认进度、考试通过、积分奖励与自动解锁逻辑**

```js
const DIFFICULTIES = ["beginner", "intermediate", "skilled", "expert"];

const EXAM_UNLOCK_INDEX = {
  beginner: 0,
  intermediate: 1,
  skilled: 2,
  expert: 3
};

const POINT_REWARDS = {
  beginner: 10,
  intermediate: 20,
  skilled: 30,
  expert: 40
};

const UNLOCK_COSTS = {
  intermediate: 100,
  skilled: 250,
  expert: 450
};

function createExamRecord() {
  return {
    passed: false,
    attempted: false,
    failedCount: 0,
    bestRemainingSeconds: 0
  };
}

function createEmptyProgress() {
  return {
    unlockedDifficulties: ["beginner"],
    totalPoints: 0,
    examRecordByDifficulty: {
      beginner: createExamRecord(),
      intermediate: createExamRecord(),
      skilled: createExamRecord(),
      expert: createExamRecord()
    }
  };
}

function normalizeUnlockedDifficulties(difficulties) {
  return DIFFICULTIES.filter(function (difficulty) {
    return Array.isArray(difficulties) && difficulties.indexOf(difficulty) >= 0;
  });
}

function isDifficultyUnlocked(progress, difficulty) {
  return normalizeUnlockedDifficulties(progress.unlockedDifficulties).indexOf(difficulty) >= 0;
}

function unlockThroughDifficulty(progress, difficulty) {
  const unlockIndex = EXAM_UNLOCK_INDEX[difficulty];
  const nextProgress = JSON.parse(JSON.stringify(progress));

  nextProgress.unlockedDifficulties = DIFFICULTIES.filter(function (item) {
    return EXAM_UNLOCK_INDEX[item] <= unlockIndex ||
      nextProgress.unlockedDifficulties.indexOf(item) >= 0;
  });

  return nextProgress;
}

function applyExamPassToProgress(progress, difficulty, remainingSeconds) {
  const nextProgress = unlockThroughDifficulty(progress, difficulty);
  const record = nextProgress.examRecordByDifficulty[difficulty];

  record.attempted = true;
  record.passed = true;
  record.bestRemainingSeconds = Math.max(record.bestRemainingSeconds, remainingSeconds || 0);
  return nextProgress;
}

function applyExamFailureToProgress(progress, difficulty) {
  const nextProgress = JSON.parse(JSON.stringify(progress));
  const record = nextProgress.examRecordByDifficulty[difficulty];

  record.attempted = true;
  record.failedCount += 1;
  return nextProgress;
}

function getPointsReward(difficulty) {
  return POINT_REWARDS[difficulty] || 0;
}

function getUnlockCost(difficulty) {
  return UNLOCK_COSTS[difficulty] || 0;
}

function applyPointsToProgress(progress, points) {
  const nextProgress = JSON.parse(JSON.stringify(progress));
  nextProgress.totalPoints += points;

  ["intermediate", "skilled", "expert"].forEach(function (difficulty) {
    if (nextProgress.totalPoints >= getUnlockCost(difficulty) && !isDifficultyUnlocked(nextProgress, difficulty)) {
      nextProgress.unlockedDifficulties = normalizeUnlockedDifficulties(
        nextProgress.unlockedDifficulties.concat([difficulty])
      );
    }
  });

  return nextProgress;
}

module.exports = {
  DIFFICULTIES,
  UNLOCK_COSTS,
  POINT_REWARDS,
  createEmptyProgress,
  isDifficultyUnlocked,
  applyExamPassToProgress,
  applyExamFailureToProgress,
  applyPointsToProgress,
  getPointsReward,
  getUnlockCost
};
```

- [ ] **Step 4: 扩展 storage，增加 progress 的读写与兼容兜底**

```js
const { createEmptyStats } = require("./stats-service");
const { createEmptyProgress } = require("./progress-service");

const STORAGE_KEYS = {
  currentGame: "jiuyu.currentGame",
  settings: "jiuyu.settings",
  stats: "jiuyu.stats",
  progress: "jiuyu.progress"
};

function isValidProgress(progress) {
  return Boolean(progress) &&
    Array.isArray(progress.unlockedDifficulties) &&
    typeof progress.totalPoints === "number" &&
    Boolean(progress.examRecordByDifficulty);
}

function loadProgress(storageApi) {
  const savedProgress = readStorage(STORAGE_KEYS.progress, null, storageApi);
  const emptyProgress = createEmptyProgress();

  if (!isValidProgress(savedProgress)) {
    return emptyProgress;
  }

  return {
    unlockedDifficulties: Array.isArray(savedProgress.unlockedDifficulties)
      ? savedProgress.unlockedDifficulties.slice()
      : emptyProgress.unlockedDifficulties.slice(),
    totalPoints: typeof savedProgress.totalPoints === "number" ? savedProgress.totalPoints : 0,
    examRecordByDifficulty: Object.assign(
      {},
      emptyProgress.examRecordByDifficulty,
      savedProgress.examRecordByDifficulty || {}
    )
  };
}

function saveProgress(progress, storageApi) {
  return writeStorage(STORAGE_KEYS.progress, progress, storageApi);
}

module.exports = {
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
};
```

- [ ] **Step 5: 为 storage 兼容补单测，覆盖 progress 默认值与写回**

```js
const {
  loadProgress,
  saveProgress
} = require("../js/services/storage");

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
```

- [ ] **Step 6: 运行测试，确认 progress 与 storage 规则通过**

Run: `node --test tests/game-engine.test.js`

Expected: PASS for the new `progress-service` and `storage progress` tests.

- [ ] **Step 7: 提交 Task 1**

```bash
git add js/services/progress-service.js js/services/storage.js tests/game-engine.test.js
git commit -m "feat(progress): 新增考试解锁进度模型"
```

## Task 2: 扩展首页锁定态与考试入口

**Files:**
- Modify: `js/scene/home-scene.js`
- Modify: `js/i18n/locales.js`
- Test: `tests/game-engine.test.js`

- [ ] **Step 1: 先写首页场景单测，固定锁定态 hitTest 与辅助文案**

```js
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
```

- [ ] **Step 2: 运行测试，确认首页尚未识别 locked-difficulty 而失败**

Run: `node --test tests/game-engine.test.js`

Expected: FAIL because `homeScene.hitTest(...)` still returns `difficulty`.

- [ ] **Step 3: 修改 home-scene，给难度项增加锁定态渲染与 locked-difficulty 事件**

```js
function getSelectableDifficulties(selectedDifficulty) {
  return DIFFICULTIES.filter(function (difficulty) {
    return difficulty !== selectedDifficulty;
  });
}

function getDifficultyState(renderState, difficulty) {
  const states = renderState && renderState.difficultyStates ? renderState.difficultyStates : {};
  return states[difficulty] || { unlocked: true };
}

function drawDifficultyCard(context, left, top, width, height, difficultyKey, label, selected, visualSpec, difficultyState) {
  drawDifficultyBadge(context, left, top, width, height, label, selected, visualSpec);

  if (!difficultyState.unlocked) {
    context.fillStyle = visualSpec.helperFill;
    context.font = "12px sans-serif";
    context.textAlign = "right";
    context.textBaseline = "middle";
    context.fillText("LOCK", left + width - 16, top + height / 2);
  }
}

function hitTest(x, y, state) {
  const metrics = getMetrics(state);
  const selectedDifficulty = state && state.selectedDifficulty ? state.selectedDifficulty : "beginner";
  const pickerOpen = Boolean(state && state.difficultyPickerOpen);

  if (pickerOpen) {
    const selectableDifficulties = getSelectableDifficulties(selectedDifficulty);

    for (let index = 0; index < selectableDifficulties.length; index += 1) {
      const difficulty = selectableDifficulties[index];
      const top = metrics.difficultyTop + (index + 1) * (metrics.difficultyHeight + metrics.difficultyGap);
      const difficultyState = getDifficultyState(state, difficulty);

      if (isInsideRect(x, y, metrics.difficultyLeft, top, metrics.difficultyWidth, metrics.difficultyHeight)) {
        return difficultyState.unlocked
          ? { type: "difficulty", value: difficulty }
          : { type: "locked-difficulty", value: difficulty };
      }
    }
  }
}
```

- [ ] **Step 4: 扩展首页文案，加入锁定与考试入口说明**

```js
home: {
  difficultyLocked: "未解锁",
  difficultyExamHint: "考试可快速解锁",
  difficultyPointHint: "普通通关可累积积分",
  lockedDialog: {
    title: "{difficulty} 尚未解锁",
    examAction: "参加考试",
    pointsAction: "查看积分",
    pointsProgress: "当前积分 {points} / {cost}",
    fallbackHint: "考试失败后可继续练习，但不计积分"
  }
}
```

- [ ] **Step 5: 为新文案加翻译断言**

```js
test("createTranslator exposes locked difficulty and exam copy", function () {
  const zh = createTranslator("zh-CN");
  const en = createTranslator("en");

  assert.equal(zh("home.difficultyLocked"), "未解锁");
  assert.equal(zh("home.lockedDialog.examAction"), "参加考试");
  assert.equal(en("home.lockedDialog.pointsAction"), "View points");
});
```

- [ ] **Step 6: 运行测试，确认首页场景与文案通过**

Run: `node --test tests/game-engine.test.js`

Expected: PASS for the `locked-difficulty` scene test and the new locale assertions.

- [ ] **Step 7: 提交 Task 2**

```bash
git add js/scene/home-scene.js js/i18n/locales.js tests/game-engine.test.js
git commit -m "feat(home): 新增难度锁定态与考试入口"
```

## Task 3: 扩展棋盘考试态与结算展示

**Files:**
- Modify: `js/scene/board-scene.js`
- Modify: `js/i18n/locales.js`
- Test: `tests/game-engine.test.js`

- [ ] **Step 1: 先补棋盘渲染断言，固定考试标签、剩余时间与失败提示入口**

```js
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

  assert.ok(texts.includes("考试中"));
  assert.ok(texts.includes("剩余 00:00"));
});
```

- [ ] **Step 2: 运行测试，确认 board-scene 还未消费 examState 而失败**

Run: `node --test tests/game-engine.test.js`

Expected: FAIL because `考试中` and `剩余 00:00` are not rendered yet.

- [ ] **Step 3: 修改 board-scene，在 header 区域渲染考试状态并在反馈区显示失败态**

```js
function drawHeader(context, renderState, theme, metrics) {
  const examState = renderState ? renderState.examState || null : null;

  if (examState && examState.active) {
    context.fillStyle = theme.buttonShadow || "#8f7569";
    context.font = "13px sans-serif";
    context.textAlign = "right";
    context.textBaseline = "middle";
    context.fillText(
      examState.failed ? renderState.t("board.examFailed") : renderState.t("board.examActive"),
      boardLeft + boardSize,
      difficultyTop
    );

    if (examState.remainingLabel) {
      context.textAlign = "left";
      context.fillText(examState.remainingLabel, boardLeft + 184, difficultyTop);
    }
  }
}

function drawCompletionCard(context, renderState, theme, metrics) {
  const summary = renderState.completionSummary;
  const pointsMessage = summary.pointsAwarded > 0
    ? renderState.t("completion.pointsAwarded", { points: String(summary.pointsAwarded) })
    : renderState.t("completion.pointsBlocked");

  context.fillStyle = theme.buttonShadow || "#8f7569";
  context.font = "14px sans-serif";
  context.fillText(pointsMessage, cardLeft + cardWidth / 2, cardTop + 116);
}
```

- [ ] **Step 4: 扩展棋盘与结算文案，覆盖考试中、考试失败和积分阻断提示**

```js
board: {
  timerLabel: "计时",
  examActive: "考试中",
  examFailed: "考试未通过",
  examRemaining: "剩余 {time}"
},
completion: {
  pointsAwarded: "积分 +{points}",
  pointsBlocked: "本局不计入积分",
  examPassedTitle: "考试通过",
  examFailedTitle: "考试未通过"
}
```

- [ ] **Step 5: 为棋盘/结算新文案补翻译断言**

```js
test("createTranslator exposes exam board and completion copy", function () {
  const zh = createTranslator("zh-CN");
  const en = createTranslator("en");

  assert.equal(zh("board.examActive"), "考试中");
  assert.equal(zh("completion.pointsBlocked"), "本局不计入积分");
  assert.equal(en("completion.pointsAwarded", { points: "20" }), "Points +20");
});
```

- [ ] **Step 6: 运行测试，确认棋盘考试态与结算文案通过**

Run: `node --test tests/game-engine.test.js`

Expected: PASS for the new board-scene rendering test and locale assertions.

- [ ] **Step 7: 提交 Task 3**

```bash
git add js/scene/board-scene.js js/i18n/locales.js tests/game-engine.test.js
git commit -m "feat(board): 新增考试状态与积分结算提示"
```

## Task 4: 把 progress、考试流程与结算规则接入 main.js

**Files:**
- Modify: `js/main.js`
- Modify: `tests/game-engine.test.js`
- Test: `tests/game-engine.test.js`

- [ ] **Step 1: 先写集成测试，覆盖考试通过与考试失败不计积分**

```js
test("main entry unlocks difficulty and saves progress when an exam is completed in time", function () {
  const writes = [];
  const originalWx = global.wx;
  const mainPath = require.resolve("../js/main");
  let touchHandler = null;
  let intervalHandler = null;

  delete require.cache[mainPath];
  global.setInterval = function (handler) {
    intervalHandler = handler;
    return { unref: function () {} };
  };
  global.wx = {
    createCanvas: function () { /* reuse existing canvas stub */ },
    createImage: function () { return { onload: null, onerror: null, src: "" }; },
    getStorageSync: function (key) {
      if (key === STORAGE_KEYS.settings) {
        return { preferredDifficulty: "beginner", language: "zh-CN" };
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
    assert.equal(typeof intervalHandler, "function");
  } finally {
    delete require.cache[mainPath];
    global.wx = originalWx;
  }
});

test("main entry does not award points when an exam is finished after timeout", function () {
  const progressSnapshots = [];

  // arrange: start exam, force timeout, complete board afterwards
  // assert: saved progress.totalPoints stays unchanged and locked difficulty stays locked

  assert.equal(progressSnapshots[progressSnapshots.length - 1].totalPoints, 0);
});
```

- [ ] **Step 2: 运行测试，确认 main.js 还没有 progress/exam 流程而失败**

Run: `node --test tests/game-engine.test.js`

Expected: FAIL because `STORAGE_KEYS.progress` is never written and exam transitions do not exist.

- [ ] **Step 3: 在 main.js 中接入 progress 初始化与考试运行态**

```js
const {
  loadProgress,
  saveProgress
} = require("./services/storage");
const {
  DIFFICULTIES,
  isDifficultyUnlocked,
  applyExamPassToProgress,
  applyExamFailureToProgress,
  applyPointsToProgress,
  getPointsReward,
  getUnlockCost
} = require("./services/progress-service");

let progress = loadProgress();
let examState = null;

function createExamSession(difficulty) {
  return {
    active: true,
    failed: false,
    difficulty: difficulty,
    timeLimitSeconds: difficulty === "intermediate" ? 600 : difficulty === "skilled" ? 900 : 1200,
    deadlineReached: false
  };
}

function persistProgressState() {
  saveProgress(progress);
}
```

- [ ] **Step 4: 修改首页事件流，让未解锁难度不再直接开局，而是进入考试/积分分支**

```js
let lockedDifficultyDialog = null;

function openLockedDifficultyDialog(difficulty) {
  lockedDifficultyDialog = {
    difficulty: difficulty,
    points: progress.totalPoints,
    cost: getUnlockCost(difficulty)
  };
  switchScreen("home");
}

function handleHomeAction(homeAction) {
  if (homeAction.type === "locked-difficulty") {
    openLockedDifficultyDialog(homeAction.value);
    return true;
  }
}

function startExamGame(difficulty) {
  selectedDifficulty = difficulty;
  examState = createExamSession(difficulty);
  resetCompletionState();
  clearFeedbackState();
  applyGameSnapshot(createGame(findPuzzleByDifficulty(difficulty, puzzleCursorByDifficulty)), -1, false);
  switchScreen("board");
}
```

- [ ] **Step 5: 在计时器与通关结算里实现考试通过、超时失败、失败后不积分**

```js
function advanceElapsedTime() {
  if (activeScreen !== "board" || completionVisible || statsOverlayVisible) {
    return;
  }

  game.elapsedSeconds += 1;

  if (examState && examState.active && !examState.deadlineReached) {
    if (game.elapsedSeconds >= examState.timeLimitSeconds) {
      examState.deadlineReached = true;
      examState.failed = true;
      progress = applyExamFailureToProgress(progress, examState.difficulty);
      persistProgressState();
      feedbackMessage = t("board.examFailed");
      feedbackType = "warning";
    }
  }

  persistGameState();
  draw();
}

function finalizeCompletionRewards() {
  const passedInTime = examState && examState.active && !examState.deadlineReached;
  const pointsAwarded = passedInTime || !examState
    ? getPointsReward(game.difficulty)
    : 0;

  if (passedInTime) {
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

function openCompletionState() {
  const pointsAwarded = finalizeCompletionRewards();
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
    pointsAwarded: pointsAwarded
  });

  if (!examState || !examState.deadlineReached) {
    stats = applyCompletionToStats(stats, summary);
    saveStats(stats);
  }

  examState = null;
  completionVisible = true;
  statsOverlayVisible = false;
}
```

- [ ] **Step 6: 把考试态和 progress 渲染参数传给首页与棋盘**

```js
function buildDifficultyStates() {
  return {
    beginner: { unlocked: isDifficultyUnlocked(progress, "beginner") },
    intermediate: { unlocked: isDifficultyUnlocked(progress, "intermediate") },
    skilled: { unlocked: isDifficultyUnlocked(progress, "skilled") },
    expert: { unlocked: isDifficultyUnlocked(progress, "expert") }
  };
}

function drawHome() {
  homeScene.draw(context, {
    hasSavedGame: hasSavedGame,
    selectedDifficulty: selectedDifficulty,
    difficultyPickerOpen: difficultyPickerOpen,
    difficultyStates: buildDifficultyStates(),
    lockedDifficultyDialog: lockedDifficultyDialog,
    progressSnapshot: progress,
    t: t
  });
}

function drawBoard() {
  boardScene.draw(context, cells, {
    theme: Object.assign({}, theme, { t: t }),
    feedbackMessage: feedbackMessage,
    feedbackType: feedbackType,
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
    difficultyLabel: t("difficulty." + game.difficulty),
    timerLabel: t("board.timerLabel") + " " + formatElapsedClock(game.elapsedSeconds),
    settingsLabel: t("settings.title")
  });
}
```

- [ ] **Step 7: 补齐 main 集成测试，覆盖考试通过解锁、普通局积分和考试失败零积分**

```js
test("main entry writes progress unlocks after an in-time exam clear", function () {
  const savedProgress = writes
    .filter(function (entry) { return entry[0] === STORAGE_KEYS.progress; })
    .map(function (entry) { return entry[1]; })
    .pop();

  assert.equal(savedProgress.examRecordByDifficulty.intermediate.passed, true);
  assert.ok(savedProgress.unlockedDifficulties.includes("intermediate"));
  assert.equal(savedProgress.totalPoints, 20);
});

test("main entry blocks points after an overdue exam clear", function () {
  const savedProgress = writes
    .filter(function (entry) { return entry[0] === STORAGE_KEYS.progress; })
    .map(function (entry) { return entry[1]; })
    .pop();

  assert.equal(savedProgress.examRecordByDifficulty.intermediate.failedCount, 1);
  assert.equal(savedProgress.totalPoints, 0);
  assert.equal(savedProgress.unlockedDifficulties.includes("intermediate"), false);
});
```

- [ ] **Step 8: 运行完整测试，确认主流程与考试规则全部通过**

Run: `node --test tests/game-engine.test.js`

Expected: PASS with the full suite green, including progress, scene, locale, and main integration tests.

- [ ] **Step 9: 提交 Task 4**

```bash
git add js/main.js tests/game-engine.test.js
git commit -m "feat(game): 接入考试与积分解锁流程"
```

## Final Verification

- [ ] **Step 1: 运行最终回归测试**

Run: `node --test tests/game-engine.test.js`

Expected: PASS

- [ ] **Step 2: 查看工作区状态**

Run: `git -c safe.directory=D:/GithubWorkspace/jiuyu-miniapp status --short`

Expected: only expected tracked changes remain, with no accidental file edits outside this feature.

- [ ] **Step 3: 整理提交**

```bash
git log --oneline -3
```

Expected: includes the three feature commits from this plan plus the earlier spec commit.
