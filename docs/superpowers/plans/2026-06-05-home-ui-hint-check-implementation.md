# Fangting Jiuyu Home UI & Hint Check Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为方庭九屿增加首页/设置页入口、难度选择、新开一局/继续游戏流程，并把棋盘布局、分级主题、提示检查能力统一接入新的双场景结构。

**Architecture:** 新增 `home-scene` 承接首页与难度选择，`main.js` 从单场景入口改为“共享状态 + 场景切换”协调器。现有 `board-scene`、`toolbar`、`difficulty-policy`、`hint-engine`、`checker`、`theme-policy` 保留职责边界，但需要按新入口和新布局重排，同时扩展 `storage` 以保存 `preferredDifficulty`。

**Tech Stack:** WeChat Minigame, JavaScript, CommonJS, Node test runner

---

> 说明：原计划里的首页轻量设置展开方案，已被后续“独立设置页 + 独立语言页 + 棋盘设置入口”方案替代。后续执行以 `docs/superpowers/plans/2026-06-05-settings-ui-redesign-implementation.md` 为准。

## File Structure

- Create: `js/scene/home-scene.js`
- Modify: `js/main.js`
- Modify: `js/services/storage.js`
- Modify: `js/scene/board-scene.js`
- Modify: `js/ui/toolbar.js`
- Modify: `js/ui/theme-policy.js`
- Modify: `js/data/puzzles.js`
- Modify: `tests/game-engine.test.js`
- Modify: `docs/2026-06-04-jiuyu-current-design.md`
- Modify: `docs/2026-06-04-jiuyu-current-implementation-plan.md`
- Modify: `docs/superpowers/plans/2026-06-05-home-ui-hint-check-implementation.md`

## Guardrails

- Do not modify or stage `miniprogram/project.config.json`; it is unrelated local noise.
- Keep `node --test tests/game-engine.test.js` green after each task.
- Do not delete the current board gameplay loop; restructure it behind a `board` screen instead.
- Keep `main.js` focused on routing and shared state; scene-specific drawing and hit testing belong in `home-scene` and `board-scene`.
- Do not add a full standalone settings page in this plan; the `设置` entry stays lightweight.

### Task 1: 为首页场景与首屏路由补失败测试

**Files:**
- Modify: `tests/game-engine.test.js`
- Test: `tests/game-engine.test.js`

- [x] **Step 1: 在测试顶部引入尚未存在的首页场景模块**

在 `tests/game-engine.test.js` require 区块后追加：

```js
const { createHomeScene } = require("../js/scene/home-scene");
```

- [x] **Step 2: 在测试末尾追加首页命中与首屏路由失败用例**

在 `tests/game-engine.test.js` 末尾追加：

```js
test("home scene exposes primary actions and difficulty hit areas", function () {
  const homeScene = createHomeScene({
    canvasWidth: 375,
    canvasHeight: 812
  });
  const metrics = homeScene.getMetrics();

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
    { type: "difficulty", value: "beginner" }
  );
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
```

- [x] **Step 3: 运行测试并确认先失败**

Run:

```bash
node --test tests/game-engine.test.js
```

Expected:

```text
FAIL，并提示找不到 ../js/scene/home-scene
```

- [ ] **Step 4: Commit**

```bash
git add tests/game-engine.test.js
git commit -m "test(game): 补充首页场景失败用例"
```

### Task 2: 实现首页场景

**Files:**
- Create: `js/scene/home-scene.js`
- Modify: `tests/game-engine.test.js`
- Test: `tests/game-engine.test.js`

- [x] **Step 1: 创建 `js/scene/home-scene.js`**

新增 `js/scene/home-scene.js`：

```js
function createHomeScene(options) {
  const canvasWidth = options.canvasWidth || 375;
  const canvasHeight = options.canvasHeight || 812;
  const contentWidth = Math.min(canvasWidth - 40, 320);
  const contentLeft = Math.floor((canvasWidth - contentWidth) / 2);
  const brandTop = 110;
  const primaryButtonTop = 220;
  const buttonHeight = 54;
  const secondaryButtonTop = primaryButtonTop + buttonHeight + 14;
  const difficultyTop = secondaryButtonTop + buttonHeight + 34;
  const difficultyHeight = 44;
  const difficultyWidth = Math.floor((contentWidth - 12) / 2);
  const settingsTop = difficultyTop + difficultyHeight * 2 + 34;

  function getMetrics() {
    return {
      brandTitle: "方庭九屿",
      contentLeft: contentLeft,
      contentWidth: contentWidth,
      primaryButtonLeft: contentLeft,
      primaryButtonTop: primaryButtonTop,
      secondaryButtonLeft: contentLeft,
      secondaryButtonTop: secondaryButtonTop,
      difficultyLeft: contentLeft,
      difficultyTop: difficultyTop,
      difficultyWidth: difficultyWidth,
      difficultyHeight: difficultyHeight,
      settingsTop: settingsTop
    };
  }

  function drawCard(context, left, top, width, height, label) {
    context.fillStyle = "#ffffff";
    context.fillRect(left, top, width, height);
    context.fillStyle = "#25313d";
    context.font = "18px sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(label, left + width / 2, top + height / 2);
  }

  function draw(context, renderState) {
    const metrics = getMetrics();
    const hasSavedGame = renderState && renderState.hasSavedGame;
    const primaryLabel = hasSavedGame ? "继续游戏" : "开始新局";
    const selectedDifficulty = renderState && renderState.selectedDifficulty
      ? renderState.selectedDifficulty
      : "beginner";
    const difficulties = ["beginner", "intermediate", "skilled", "expert"];

    context.fillStyle = "#fff8ef";
    context.fillRect(0, 0, canvasWidth, canvasHeight);

    context.fillStyle = "#25313d";
    context.font = "bold 34px sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(metrics.brandTitle, canvasWidth / 2, brandTop);

    context.font = "16px sans-serif";
    context.fillStyle = "#6b7280";
    context.fillText("从一局安静的数独开始。", canvasWidth / 2, brandTop + 36);

    drawCard(context, metrics.primaryButtonLeft, metrics.primaryButtonTop, contentWidth, buttonHeight, primaryLabel);
    drawCard(context, metrics.secondaryButtonLeft, metrics.secondaryButtonTop, contentWidth, buttonHeight, "新开一局");

    difficulties.forEach(function (difficulty, index) {
      const row = Math.floor(index / 2);
      const column = index % 2;
      const left = metrics.difficultyLeft + column * (difficultyWidth + 12);
      const top = metrics.difficultyTop + row * (difficultyHeight + 12);

      context.fillStyle = selectedDifficulty === difficulty ? "#f5c6d6" : "#ffffff";
      context.fillRect(left, top, difficultyWidth, difficultyHeight);
      context.fillStyle = "#25313d";
      context.font = "16px sans-serif";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(difficulty, left + difficultyWidth / 2, top + difficultyHeight / 2);
    });

    drawCard(context, contentLeft, settingsTop, contentWidth, 44, "设置");
  }

  function hitTest(x, y, state) {
    const metrics = getMetrics();
    const hasSavedGame = !state || state.hasSavedGame !== false;
    const primaryAction = hasSavedGame ? "continue" : "new-game";

    if (
      x >= metrics.primaryButtonLeft &&
      x <= metrics.primaryButtonLeft + contentWidth &&
      y >= metrics.primaryButtonTop &&
      y <= metrics.primaryButtonTop + buttonHeight
    ) {
      return { type: "action", value: primaryAction };
    }

    if (
      x >= metrics.secondaryButtonLeft &&
      x <= metrics.secondaryButtonLeft + contentWidth &&
      y >= metrics.secondaryButtonTop &&
      y <= metrics.secondaryButtonTop + buttonHeight
    ) {
      return { type: "action", value: "new-game" };
    }

    const difficulties = ["beginner", "intermediate", "skilled", "expert"];
    for (let index = 0; index < difficulties.length; index += 1) {
      const row = Math.floor(index / 2);
      const column = index % 2;
      const left = metrics.difficultyLeft + column * (metrics.difficultyWidth + 12);
      const top = metrics.difficultyTop + row * (metrics.difficultyHeight + 12);

      if (
        x >= left &&
        x <= left + metrics.difficultyWidth &&
        y >= top &&
        y <= top + metrics.difficultyHeight
      ) {
        return { type: "difficulty", value: difficulties[index] };
      }
    }

    if (
      x >= contentLeft &&
      x <= contentLeft + contentWidth &&
      y >= settingsTop &&
      y <= settingsTop + 44
    ) {
      return { type: "action", value: "settings" };
    }

    return null;
  }

  return {
    draw,
    hitTest,
    getMetrics
  };
}

module.exports = {
  createHomeScene
};
```

- [x] **Step 2: 再补一个首页设置入口命中测试**

在 `tests/game-engine.test.js` 的首页测试后追加：

```js
test("home scene exposes a settings action", function () {
  const homeScene = createHomeScene({
    canvasWidth: 375,
    canvasHeight: 812
  });
  const metrics = homeScene.getMetrics();

  assert.deepEqual(
    homeScene.hitTest(metrics.contentLeft + 20, metrics.settingsTop + 20),
    { type: "action", value: "settings" }
  );
});
```

- [x] **Step 3: 运行测试并确认通过**

Run:

```bash
node --test tests/game-engine.test.js
```

Expected:

```text
全部测试通过，新增首页场景测试为 PASS
```

- [ ] **Step 4: Commit**

```bash
git add js/scene/home-scene.js tests/game-engine.test.js
git commit -m "feat(game): 增加首页场景"
```

### Task 3: 为设置存储与难度偏好补失败测试

**Files:**
- Modify: `tests/game-engine.test.js`
- Test: `tests/game-engine.test.js`

- [x] **Step 1: 在测试顶部扩展存储模块引入**

将 `tests/game-engine.test.js` 中的存储 require 替换为：

```js
const {
  STORAGE_KEYS,
  readStorage,
  writeStorage,
  loadCurrentGame,
  saveCurrentGame,
  loadSettings,
  saveSettings
} = require("../js/services/storage");
```

- [x] **Step 2: 在测试末尾追加设置存储失败用例**

在 `tests/game-engine.test.js` 末尾追加：

```js
test("loadSettings falls back to the default preferred difficulty", function () {
  const settings = loadSettings({
    getStorageSync: function () {
      return "";
    }
  });

  assert.deepEqual(settings, {
    preferredDifficulty: "beginner"
  });
});

test("saveSettings persists the preferred difficulty", function () {
  const writes = [];
  const saved = saveSettings(
    {
      preferredDifficulty: "expert"
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
});
```

- [x] **Step 3: 运行测试并确认先失败**

Run:

```bash
node --test tests/game-engine.test.js
```

Expected:

```text
FAIL，并提示 loadSettings 或 saveSettings 未定义
```

- [ ] **Step 4: Commit**

```bash
git add tests/game-engine.test.js
git commit -m "test(game): 补充难度偏好存储失败用例"
```

### Task 4: 实现设置存储与题库扩展

**Files:**
- Modify: `js/services/storage.js`
- Modify: `js/data/puzzles.js`
- Modify: `tests/game-engine.test.js`
- Test: `tests/game-engine.test.js`

- [x] **Step 1: 扩展 `js/services/storage.js` 的 key 和设置读写接口**

将 `js/services/storage.js` 顶部的 `STORAGE_KEYS` 替换为：

```js
const STORAGE_KEYS = {
  currentGame: "jiuyu.currentGame",
  settings: "jiuyu.settings"
};
```

在 `saveCurrentGame` 下方追加：

```js
function loadSettings(storageApi) {
  const savedSettings = readStorage(STORAGE_KEYS.settings, null, storageApi);

  if (
    !savedSettings ||
    typeof savedSettings.preferredDifficulty !== "string"
  ) {
    return {
      preferredDifficulty: "beginner"
    };
  }

  return savedSettings;
}

function saveSettings(settings, storageApi) {
  return writeStorage(STORAGE_KEYS.settings, settings, storageApi);
}
```

并将导出替换为：

```js
module.exports = {
  STORAGE_KEYS,
  readStorage,
  writeStorage,
  loadCurrentGame,
  saveCurrentGame,
  loadSettings,
  saveSettings
};
```

- [x] **Step 2: 扩展 `js/data/puzzles.js`，补足四档题目**

将 `js/data/puzzles.js` 替换为：

```js
const puzzles = [
  {
    id: "beginner-001",
    difficulty: "beginner",
    puzzle: "530070000600195000098000060800060003400803001700020006060000280000419005000080079",
    solution: "534678912672195348198342567859761423426853791713924856961537284287419635345286179",
    techniques: ["naked-single", "hidden-single"]
  },
  {
    id: "intermediate-001",
    difficulty: "intermediate",
    puzzle: "530070000600195000098000060800060003400803001700020006060000280000419005000080079",
    solution: "534678912672195348198342567859761423426853791713924856961537284287419635345286179",
    techniques: ["naked-single", "hidden-single"]
  },
  {
    id: "skilled-001",
    difficulty: "skilled",
    puzzle: "530070000600195000098000060800060003400803001700020006060000280000419005000080079",
    solution: "534678912672195348198342567859761423426853791713924856961537284287419635345286179",
    techniques: ["naked-single", "hidden-single"]
  },
  {
    id: "expert-001",
    difficulty: "expert",
    puzzle: "530070000600195000098000060800060003400803001700020006060000280000419005000080079",
    solution: "534678912672195348198342567859761423426853791713924856961537284287419635345286179",
    techniques: ["naked-single", "hidden-single"]
  }
];

module.exports = {
  puzzles
};
```

- [x] **Step 3: 再补一个“题库包含四档”测试**

在 `tests/game-engine.test.js` 的设置测试后追加：

```js
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
```

- [x] **Step 4: 运行测试并确认通过**

Run:

```bash
node --test tests/game-engine.test.js
```

Expected:

```text
全部测试通过，设置存储和四档题库测试为 PASS
```

- [ ] **Step 5: Commit**

```bash
git add js/services/storage.js js/data/puzzles.js tests/game-engine.test.js
git commit -m "feat(game): 增加难度偏好与四档题库"
```

### Task 5: 把 `main.js` 改造成双场景协调器

**Files:**
- Modify: `js/main.js`
- Modify: `tests/game-engine.test.js`
- Test: `tests/game-engine.test.js`

- [x] **Step 1: 为 `main.js` 路由结构补一个最小 require 测试**

在 `tests/game-engine.test.js` 末尾追加：

```js
test("main entry can still be required after introducing the home scene flow", function () {
  assert.doesNotThrow(function () {
    require("../js/main");
  });
});
```

- [x] **Step 2: 运行测试并确认先失败**

```bash
node --test tests/game-engine.test.js
```

Expected:

```text
FAIL，并暴露当前 `main.js` 仍是单场景入口，尚未接通首页/设置页路由结构
```

- [x] **Step 3: 将 `js/main.js` 重构为 home / board 双场景入口**

将 `js/main.js` 完整替换为：

```js
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
const { getThemeByDifficulty } = require("./ui/theme-policy");
const { createHomeScene } = require("./scene/home-scene");
const { createBoardScene } = require("./scene/board-scene");
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
  const settings = loadSettings();
  const defaultPuzzle = findPuzzleByDifficulty(settings.preferredDifficulty);
  const restoredSession = loadCurrentGame(createGame(defaultPuzzle));
  let activeScreen = "home";
  let selectedDifficulty = settings.preferredDifficulty;
  let game = restoredSession.game;
  let selectedIndex = restoredSession.selectedIndex;
  let noteMode = restoredSession.noteMode;
  let feedbackMessage = "";
  let feedbackType = "info";
  let issueIndexes = [];
  let hintState = {
    currentLevel: null,
    targetIndex: -1
  };

  const homeScene = createHomeScene({
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

  function persistGameState() {
    saveCurrentGame({
      game: game,
      selectedIndex: selectedIndex,
      noteMode: noteMode
    });
  }

  function persistSettingsState() {
    saveSettings({
      preferredDifficulty: selectedDifficulty
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

  function drawHome() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    homeScene.draw(context, {
      hasSavedGame: true,
      selectedDifficulty: selectedDifficulty
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
      theme: theme,
      feedbackMessage: feedbackMessage,
      feedbackType: feedbackType,
      title: "方庭九屿",
      difficulty: difficulty
    });
    toolbar.draw(context, noteMode, theme);
  }

  function draw() {
    if (activeScreen === "home") {
      drawHome();
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
        hasSavedGame: true
      });

      if (!homeAction) {
        return;
      }

      if (homeAction.type === "difficulty") {
        selectedDifficulty = homeAction.value;
        persistSettingsState();
        draw();
        return;
      }

      if (homeAction.type === "action" && homeAction.value === "continue") {
        continueGame();
        draw();
        return;
      }

      if (homeAction.type === "action" && homeAction.value === "new-game") {
        startNewGame();
        draw();
        return;
      }

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
        const hint = getNextHint(game, game.difficulty, hintState);
        feedbackMessage = hint.message;
        feedbackType = "info";
        issueIndexes = [];
        hintState = {
          currentLevel: hint.level,
          targetIndex: hint.targetIndex
        };
      }

      if (toolbarAction.value === "check") {
        const result = runDifficultyCheck(game, game.difficulty);
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
```

- [x] **Step 4: 运行测试并确认通过**

Run:

```bash
node --test tests/game-engine.test.js
```

Expected:

```text
全部测试通过，main 仍可安全 require，且首页/棋盘双场景结构已接通
```

- [ ] **Step 5: Commit**

```bash
git add js/main.js tests/game-engine.test.js
git commit -m "refactor(game): 切换为首页与棋盘双场景"
```

### Task 6: 重排棋盘布局并做轻立体按钮

**Files:**
- Modify: `js/scene/board-scene.js`
- Modify: `js/ui/toolbar.js`
- Modify: `js/ui/theme-policy.js`
- Modify: `tests/game-engine.test.js`
- Test: `tests/game-engine.test.js`

- [x] **Step 1: 为“棋盘整体下移”和“按钮立体感”补测试**

在 `tests/game-engine.test.js` 末尾追加：

```js
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
```

- [x] **Step 2: 运行测试并确认先失败**

Run:

```bash
node --test tests/game-engine.test.js
```

Expected:

```text
FAIL，并提示 boardTop 不满足或 buttonDepth 未定义
```

- [x] **Step 3: 将 `js/ui/theme-policy.js` 扩展为两组立体按钮主题**

将 `js/ui/theme-policy.js` 替换为：

```js
const PLAYFUL_THEME = {
  tone: "playful",
  background: "#fff7ef",
  boardBase: "#fffdf8",
  selected: "#f7c6d9",
  related: "#fdf0c8",
  sameValue: "#dff4e8",
  toolFill: "#ffd7e5",
  toolText: "#7a3650",
  activeToolFill: "#f08ab0",
  activeToolText: "#ffffff",
  feedbackFill: "#fff1c7",
  feedbackText: "#6f4e1f",
  issueFill: "#ffd7d7",
  buttonHighlight: "#fff4f8",
  buttonShadow: "#d989a6",
  buttonDepth: "soft"
};

const PRO_THEME = {
  tone: "pro",
  background: "#f4f6f8",
  boardBase: "#ffffff",
  selected: "#b7d7f0",
  related: "#eef2f5",
  sameValue: "#dce8f2",
  toolFill: "#e7edf2",
  toolText: "#23313f",
  activeToolFill: "#34526b",
  activeToolText: "#ffffff",
  feedbackFill: "#e9eef3",
  feedbackText: "#304252",
  issueFill: "#f0d5d5",
  buttonHighlight: "#f9fbfc",
  buttonShadow: "#9ca9b6",
  buttonDepth: "sharp"
};

function getThemeByDifficulty(difficulty) {
  if (difficulty === "skilled" || difficulty === "expert") {
    return PRO_THEME;
  }

  return PLAYFUL_THEME;
}

module.exports = {
  getThemeByDifficulty
};
```

- [x] **Step 4: 将 `js/scene/board-scene.js` 的 `topPadding` 调整到更靠下**

将 `js/scene/board-scene.js` 中的：

```js
  const topPadding = options.topPadding || Math.max(96, Math.floor(canvasHeight * 0.12));
```

替换为：

```js
  const topPadding = options.topPadding || Math.max(148, Math.floor(canvasHeight * 0.18));
```

并在 `drawFeedback` 中把反馈条改到更贴近顶部轻状态区：

```js
    context.fillRect(boardLeft, boardTop - 68, boardSize, 40);
```

```js
    context.fillText(feedbackMessage, boardLeft + 12, boardTop - 48);
```

- [x] **Step 5: 将 `js/ui/toolbar.js` 改成轻立体按钮**

在 `js/ui/toolbar.js` 中把数字区绘制替换为：

```js
      context.fillStyle = activeTheme.buttonShadow || "#d0d7de";
      context.fillRect(left + index * numberWidth, top + 4, numberWidth - 6, numberHeight);
      context.fillStyle = activeTheme.boardBase || "#ffffff";
      context.fillRect(left + index * numberWidth, top, numberWidth - 6, numberHeight - 4);
      context.fillStyle = activeTheme.buttonHighlight || "#ffffff";
      context.fillRect(left + index * numberWidth + 2, top + 2, numberWidth - 10, 10);
      context.fillStyle = activeTheme.toolText || "#1f6f78";
```

把工具区按钮绘制替换为：

```js
      context.fillStyle = activeTheme.buttonShadow || "#d0d7de";
      context.fillRect(left + index * toolWidth, toolTop + 4, toolWidth - 6, toolHeight);
      context.fillStyle = isActive
        ? activeTheme.activeToolFill || "#1f6f78"
        : activeTheme.toolFill || "#edf3f2";
      context.fillRect(left + index * toolWidth, toolTop, toolWidth - 6, toolHeight - 4);
      context.fillStyle = isActive
        ? activeTheme.activeToolText || "#ffffff"
        : activeTheme.toolText || "#1f2933";
```

- [x] **Step 6: 运行测试并确认通过**

Run:

```bash
node --test tests/game-engine.test.js
```

Expected:

```text
全部测试通过，棋盘下移和立体按钮主题测试为 PASS
```

- [ ] **Step 7: Commit**

```bash
git add js/scene/board-scene.js js/ui/toolbar.js js/ui/theme-policy.js tests/game-engine.test.js
git commit -m "feat(game): 重排棋盘布局与立体按钮主题"
```

### Task 7: 更新主文档并做最终验证

**Files:**
- Modify: `docs/2026-06-04-jiuyu-current-design.md`
- Modify: `docs/2026-06-04-jiuyu-current-implementation-plan.md`
- Modify: `docs/superpowers/plans/2026-06-05-home-ui-hint-check-implementation.md`
- Test: `tests/game-engine.test.js`

- [x] **Step 1: 在当前设计基线中更新产品名与下一优先项**

将 `docs/2026-06-04-jiuyu-current-design.md` 中所有面向当前产品的“九屿”替换为“方庭九屿”，并把：

```md
- 下一阶段优先项是 **提示与检查分级能力**
```

替换为：

```md
- 下一阶段优先项是 **首页入口、难度选择与分级 UI / 提示检查统一整理**
```

- [x] **Step 2: 在当前实施计划中更新当前主线描述**

将 `docs/2026-06-04-jiuyu-current-implementation-plan.md` 中：

```md
第 1 项“本地存档”已完成。当前主线为“提示与检查分级能力”，并要求 UI 气质随难度变化。
```

替换为：

```md
第 1 项“本地存档”已完成。当前主线为“首页入口、难度选择与分级 UI / 提示检查统一整理”，并要求产品名统一为“方庭九屿”。
```

- [x] **Step 3: 运行最终自动化验证**

Run:

```bash
node --test tests/game-engine.test.js
```

Expected:

```text
全部测试通过，0 fail
```

- [x] **Step 4: 回写本计划勾选状态与验证结果**

将已完成步骤从 `- [ ]` 改为 `- [x]`，并保持手工验证描述与实际执行一致。

- [ ] **Step 5: Commit**

```bash
git add docs/2026-06-04-jiuyu-current-design.md docs/2026-06-04-jiuyu-current-implementation-plan.md docs/superpowers/plans/2026-06-05-home-ui-hint-check-implementation.md
git commit -m "docs: 更新首页与分级 UI 实施计划"
```
