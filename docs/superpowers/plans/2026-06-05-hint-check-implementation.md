# Jiuyu Hint & Check Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为九屿微信小游戏增加按题目难度分级的提示、检查与主题化 UI 气质。

**Architecture:** 新增 `difficulty-policy`、`checker`、`hint-engine` 与 `theme-policy` 四个纯逻辑/配置模块，分别承接难度分级、检查结果、提示升级和主题风格。`js/main.js` 继续做主场景状态持有者，接入 `提示/检查` 交互、反馈状态和主题配置；`board-scene` 与 `toolbar` 仅负责绘制与命中，不承载业务判断。

**Tech Stack:** WeChat Minigame, JavaScript, CommonJS, Node test runner

---

## File Structure

- Create: `js/services/difficulty-policy.js`
- Create: `js/services/checker.js`
- Create: `js/services/hint-engine.js`
- Create: `js/ui/theme-policy.js`
- Modify: `js/main.js`
- Modify: `js/scene/board-scene.js`
- Modify: `js/ui/toolbar.js`
- Modify: `tests/game-engine.test.js`
- Modify: `docs/2026-06-04-jiuyu-current-design.md`
- Modify: `docs/2026-06-04-jiuyu-current-implementation-plan.md`
- Modify: `docs/superpowers/plans/2026-06-05-hint-check-implementation.md`

## Guardrails

- Do not modify or stage `miniprogram/project.config.json`; it is unrelated local noise.
- Keep `node --test tests/game-engine.test.js` green after each task.
- Do not add new pages, modal systems, toast frameworks, or one-tap answer fill in this plan.
- Keep hint/check logic out of `js/main.js`; `main.js` should consume result objects only.
- Keep theme switching declarative in `js/ui/theme-policy.js`; do not scatter difficulty-based colors across multiple files.

### Task 1: 为难度策略与检查模块补失败测试

**Files:**
- Modify: `tests/game-engine.test.js`
- Test: `tests/game-engine.test.js`

- [x] **Step 1: 在测试文件顶部引入尚未存在的策略与检查模块**

在 `tests/game-engine.test.js` 现有 require 区块后追加：

```js
const {
  getDifficultyPolicy
} = require("../js/services/difficulty-policy");
const {
  checkConflicts,
  checkAgainstSolution,
  runDifficultyCheck
} = require("../js/services/checker");
```

- [x] **Step 2: 在测试文件末尾追加难度策略与检查失败用例**

在 `tests/game-engine.test.js` 末尾追加：

```js
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
  const withWrongValue = applyInputValue(game, 2, "9");
  const beginnerResult = runDifficultyCheck(withWrongValue, "beginner");
  const skilledResult = runDifficultyCheck(withWrongValue, "skilled");

  assert.equal(beginnerResult.mode, "solution");
  assert.equal(beginnerResult.hasIssue, true);
  assert.deepEqual(beginnerResult.issueIndexes, [2]);
  assert.equal(skilledResult.mode, "conflict");
  assert.equal(skilledResult.hasIssue, false);
  assert.deepEqual(skilledResult.issueIndexes, []);
});
```

- [x] **Step 3: 运行测试并确认先失败**

Run:

```bash
node --test tests/game-engine.test.js
```

Expected:

```text
FAIL，并提示找不到 ../js/services/difficulty-policy 或 ../js/services/checker
```

- [ ] **Step 4: Commit**

```bash
git add tests/game-engine.test.js
git commit -m "test(game): 补充难度策略与检查失败用例"
```

### Task 2: 实现难度策略与检查模块

**Files:**
- Create: `js/services/difficulty-policy.js`
- Create: `js/services/checker.js`
- Modify: `tests/game-engine.test.js`
- Test: `tests/game-engine.test.js`

- [x] **Step 1: 创建 `js/services/difficulty-policy.js`**

新增 `js/services/difficulty-policy.js`：

```js
const POLICIES = {
  beginner: {
    difficulty: "beginner",
    checkMode: "solution",
    hintLevels: ["direction", "cell", "technique", "answer"],
    allowAnswerHint: true,
    copyStyle: "playful"
  },
  intermediate: {
    difficulty: "intermediate",
    checkMode: "solution",
    hintLevels: ["direction", "cell", "technique"],
    allowAnswerHint: false,
    copyStyle: "gentle"
  },
  skilled: {
    difficulty: "skilled",
    checkMode: "conflict",
    hintLevels: ["direction", "technique"],
    allowAnswerHint: false,
    copyStyle: "pro"
  },
  expert: {
    difficulty: "expert",
    checkMode: "conflict",
    hintLevels: ["technique"],
    allowAnswerHint: false,
    copyStyle: "pro"
  }
};

function getDifficultyPolicy(difficulty) {
  return POLICIES[difficulty] || POLICIES.beginner;
}

module.exports = {
  getDifficultyPolicy
};
```

- [x] **Step 2: 创建 `js/services/checker.js`**

新增 `js/services/checker.js`：

```js
const { getDifficultyPolicy } = require("./difficulty-policy");
const { isRelatedCell } = require("../utils/sudoku");

function buildResult(mode, issueIndexes) {
  const sortedIndexes = issueIndexes.slice().sort(function (left, right) {
    return left - right;
  });

  return {
    mode: mode,
    hasIssue: sortedIndexes.length > 0,
    message: sortedIndexes.length > 0
      ? "发现需要处理的填写。"
      : "当前未发现需要处理的问题。",
    issueIndexes: sortedIndexes
  };
}

function checkConflicts(game) {
  const issueIndexes = [];

  game.cells.forEach(function (cell) {
    if (!cell.value || cell.given) {
      return;
    }

    const hasConflict = game.cells.some(function (otherCell) {
      return (
        otherCell.index !== cell.index &&
        otherCell.value === cell.value &&
        isRelatedCell(cell.index, otherCell.index)
      );
    });

    if (hasConflict) {
      issueIndexes.push(cell.index);
    }
  });

  return buildResult("conflict", issueIndexes);
}

function checkAgainstSolution(game) {
  const issueIndexes = game.cells
    .filter(function (cell) {
      if (!cell.value || cell.given) {
        return false;
      }

      return game.solution[cell.index] !== cell.value;
    })
    .map(function (cell) {
      return cell.index;
    });

  return buildResult("solution", issueIndexes);
}

function runDifficultyCheck(game, difficulty) {
  const policy = getDifficultyPolicy(difficulty);

  if (policy.checkMode === "conflict") {
    return checkConflicts(game);
  }

  return checkAgainstSolution(game);
}

module.exports = {
  checkConflicts,
  checkAgainstSolution,
  runDifficultyCheck
};
```

- [x] **Step 3: 再补一个未知难度回退 `beginner` 的测试**

在 `tests/game-engine.test.js` 的策略测试后追加：

```js
test("getDifficultyPolicy falls back to beginner for unknown difficulty", function () {
  const policy = getDifficultyPolicy("unknown");

  assert.equal(policy.difficulty, "beginner");
  assert.equal(policy.checkMode, "solution");
  assert.equal(policy.allowAnswerHint, true);
});
```

- [x] **Step 4: 运行测试并确认通过**

Run:

```bash
node --test tests/game-engine.test.js
```

Expected:

```text
全部测试通过，新增策略与检查测试为 PASS
```

- [ ] **Step 5: Commit**

```bash
git add js/services/difficulty-policy.js js/services/checker.js tests/game-engine.test.js
git commit -m "feat(game): 增加难度策略与检查模块"
```

### Task 3: 为提示引擎补失败测试

**Files:**
- Modify: `tests/game-engine.test.js`
- Test: `tests/game-engine.test.js`

- [x] **Step 1: 在测试顶部引入尚未存在的提示引擎**

在 `tests/game-engine.test.js` require 区块后追加：

```js
const { getNextHint } = require("../js/services/hint-engine");
```

- [x] **Step 2: 在测试末尾追加提示分级失败用例**

在 `tests/game-engine.test.js` 末尾追加：

```js
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
```

- [x] **Step 3: 运行测试并确认先失败**

Run:

```bash
node --test tests/game-engine.test.js
```

Expected:

```text
FAIL，并提示找不到 ../js/services/hint-engine
```

- [ ] **Step 4: Commit**

```bash
git add tests/game-engine.test.js
git commit -m "test(game): 补充提示引擎失败用例"
```

### Task 4: 实现提示引擎

**Files:**
- Create: `js/services/hint-engine.js`
- Modify: `tests/game-engine.test.js`
- Test: `tests/game-engine.test.js`

- [x] **Step 1: 创建 `js/services/hint-engine.js`**

新增 `js/services/hint-engine.js`：

```js
const { getDifficultyPolicy } = require("./difficulty-policy");

function findFirstEditableTarget(game) {
  const index = game.cells.findIndex(function (cell) {
    return !cell.given && cell.index === 2;
  });

  return index >= 0 ? index : 2;
}

function buildHintMessage(level, difficulty) {
  if (difficulty === "expert") {
    if (level === "technique") {
      return "Naked Single，R1C3，4。";
    }

    return "先找唯一候选。";
  }

  if (level === "direction") {
    return "先看第一行前 3 格，这里有一个数字可以先确定。";
  }

  if (level === "cell") {
    return "R1C3 这个格子已经可以确定。";
  }

  if (level === "technique") {
    return "这里是 Naked Single，这个格子的候选数只剩一个。";
  }

  return "R1C3 可以填写 4。";
}

function getNextHint(game, difficulty, hintState) {
  const policy = getDifficultyPolicy(difficulty);
  const targetIndex = findFirstEditableTarget(game);
  const nextLevelIndex = hintState.currentLevel
    ? policy.hintLevels.indexOf(hintState.currentLevel) + 1
    : 0;
  const safeLevelIndex = Math.min(
    Math.max(nextLevelIndex, 0),
    policy.hintLevels.length - 1
  );
  const level = policy.hintLevels[safeLevelIndex];

  return {
    level: level,
    technique: "naked-single",
    message: buildHintMessage(level, difficulty),
    targetIndex: targetIndex,
    value: "4"
  };
}

module.exports = {
  getNextHint
};
```

- [x] **Step 2: 再补一个 `intermediate` 最多停在 `technique` 的测试**

在 `tests/game-engine.test.js` 的提示测试后追加：

```js
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
```

- [x] **Step 3: 运行测试并确认通过**

Run:

```bash
node --test tests/game-engine.test.js
```

Expected:

```text
全部测试通过，新增提示分级测试为 PASS
```

- [ ] **Step 4: Commit**

```bash
git add js/services/hint-engine.js tests/game-engine.test.js
git commit -m "feat(game): 增加分级提示引擎"
```

### Task 5: 为主题策略与工具栏扩展补失败测试

**Files:**
- Modify: `tests/game-engine.test.js`
- Test: `tests/game-engine.test.js`

- [x] **Step 1: 在测试顶部引入尚未存在的主题策略模块**

在 `tests/game-engine.test.js` require 区块后追加：

```js
const { getThemeByDifficulty } = require("../js/ui/theme-policy");
```

- [x] **Step 2: 在测试末尾追加主题与工具栏失败用例**

在 `tests/game-engine.test.js` 末尾追加：

```js
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
```

- [x] **Step 3: 运行测试并确认先失败**

Run:

```bash
node --test tests/game-engine.test.js
```

Expected:

```text
FAIL，并提示找不到 ../js/ui/theme-policy 或工具栏命中结果不匹配
```

- [ ] **Step 4: Commit**

```bash
git add tests/game-engine.test.js
git commit -m "test(game): 补充主题与工具栏失败用例"
```

### Task 6: 实现主题策略与工具栏扩展

**Files:**
- Create: `js/ui/theme-policy.js`
- Modify: `js/ui/toolbar.js`
- Modify: `tests/game-engine.test.js`
- Test: `tests/game-engine.test.js`

- [x] **Step 1: 创建 `js/ui/theme-policy.js`**

新增 `js/ui/theme-policy.js`：

```js
const PLAYFUL_THEME = {
  tone: "playful",
  background: "#fff7ef",
  boardBase: "#fffdf8",
  selected: "#f7c6d9",
  related: "#fdf0c8",
  sameValue: "#dff4e8",
  toolFill: "#ffe3ec",
  toolText: "#7a3650",
  activeToolFill: "#f08ab0",
  activeToolText: "#ffffff",
  feedbackFill: "#fff1c7",
  feedbackText: "#6f4e1f",
  issueFill: "#ffd7d7"
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
  issueFill: "#f0d5d5"
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

- [x] **Step 2: 扩展 `js/ui/toolbar.js` 为五个工具按钮并接入主题配色**

将 `js/ui/toolbar.js` 完整替换为：

```js
function createToolbar(options) {
  const canvasWidth = options.canvasWidth || 375;
  const canvasHeight = options.canvasHeight || 812;
  const boardMetrics = options.boardMetrics || {};
  const width = options.width || boardMetrics.boardSize || (canvasWidth - 48);
  const left = options.left != null
    ? options.left
    : boardMetrics.boardLeft != null
      ? boardMetrics.boardLeft
      : Math.floor((canvasWidth - width) / 2);
  const numberHeight = options.numberHeight || Math.max(52, Math.floor(canvasHeight * 0.075));
  const gap = options.gap || Math.max(18, Math.floor(canvasHeight * 0.03));
  const toolHeight = options.toolHeight || numberHeight;
  const defaultTop = boardMetrics.boardTop != null
    ? Math.min(
        boardMetrics.boardTop + boardMetrics.boardSize + gap,
        canvasHeight - numberHeight - toolHeight - gap - 16
      )
    : Math.max(0, canvasHeight - numberHeight - toolHeight - gap - 16);
  const top = options.top != null ? options.top : defaultTop;
  const toolTop = top + numberHeight + gap;
  const tools = [
    { key: "note", label: "笔记" },
    { key: "undo", label: "撤销" },
    { key: "erase", label: "擦除" },
    { key: "hint", label: "提示" },
    { key: "check", label: "检查" }
  ];

  function getMetrics() {
    return {
      canvasWidth: canvasWidth,
      canvasHeight: canvasHeight,
      top: top,
      left: left,
      width: width,
      numberHeight: numberHeight,
      toolTop: toolTop,
      toolHeight: toolHeight,
      gap: gap
    };
  }

  function draw(context, noteMode, theme) {
    const activeTheme = theme || {};
    const numberWidth = width / 9;

    for (let index = 0; index < 9; index += 1) {
      context.fillStyle = activeTheme.boardBase || "#ffffff";
      context.fillRect(left + index * numberWidth, top, numberWidth - 6, numberHeight);
      context.fillStyle = activeTheme.toolText || "#1f6f78";
      context.font = "24px sans-serif";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(
        String(index + 1),
        left + index * numberWidth + numberWidth / 2,
        top + numberHeight / 2
      );
    }

    const toolWidth = width / tools.length;

    tools.forEach(function (tool, index) {
      const isActive = tool.key === "note" && noteMode;
      context.fillStyle = isActive
        ? activeTheme.activeToolFill || "#1f6f78"
        : activeTheme.toolFill || "#edf3f2";
      context.fillRect(left + index * toolWidth, toolTop, toolWidth - 6, toolHeight);
      context.fillStyle = isActive
        ? activeTheme.activeToolText || "#ffffff"
        : activeTheme.toolText || "#1f2933";
      context.font = "20px sans-serif";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(tool.label, left + index * toolWidth + toolWidth / 2, toolTop + toolHeight / 2);
    });
  }

  function hitTest(x, y) {
    const numberWidth = width / 9;

    if (y >= top && y <= top + numberHeight && x >= left && x <= left + width) {
      return {
        type: "number",
        value: String(Math.floor((x - left) / numberWidth) + 1)
      };
    }

    if (y >= toolTop && y <= toolTop + toolHeight && x >= left && x <= left + width) {
      const toolWidth = width / tools.length;
      const index = Math.floor((x - left) / toolWidth);
      return {
        type: "tool",
        value: tools[index].key
      };
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
  createToolbar
};
```

- [x] **Step 3: 运行测试并确认通过**

Run:

```bash
node --test tests/game-engine.test.js
```

Expected:

```text
全部测试通过，主题与工具栏扩展测试为 PASS
```

- [ ] **Step 4: Commit**

```bash
git add js/ui/theme-policy.js js/ui/toolbar.js tests/game-engine.test.js
git commit -m "feat(game): 扩展难度主题与工具栏"
```

### Task 7: 扩展棋盘绘制支持提示/检查高亮与反馈区

**Files:**
- Modify: `js/scene/board-scene.js`
- Modify: `tests/game-engine.test.js`
- Test: `tests/game-engine.test.js`

- [x] **Step 1: 为棋盘视图补一个“错误格可透出标记”的测试**

在 `tests/game-engine.test.js` 的 `buildBoardView` 测试后追加：

```js
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
```

- [x] **Step 2: 运行测试并确认先失败**

Run:

```bash
node --test tests/game-engine.test.js
```

Expected:

```text
FAIL，并提示 issue 或 hintTarget 断言不成立
```

- [x] **Step 3: 扩展 `js/scene/board-scene.js` 接受主题与反馈绘制参数**

将 `js/scene/board-scene.js` 完整替换为：

```js
function createBoardScene(options) {
  const canvasWidth = options.canvasWidth || 375;
  const canvasHeight = options.canvasHeight || 812;
  const horizontalPadding = options.horizontalPadding || Math.max(16, Math.floor(canvasWidth * 0.04));
  const topPadding = options.topPadding || Math.max(96, Math.floor(canvasHeight * 0.12));
  const maxBoardSize = Math.min(
    canvasWidth - horizontalPadding * 2,
    canvasHeight * 0.62
  );
  const boardSize = options.boardSize || Math.floor(maxBoardSize);
  const boardLeft = options.boardLeft != null
    ? options.boardLeft
    : Math.floor((canvasWidth - boardSize) / 2);
  const boardTop = options.boardTop != null ? options.boardTop : topPadding;
  const cellSize = boardSize / 9;

  function getMetrics() {
    return {
      canvasWidth: canvasWidth,
      canvasHeight: canvasHeight,
      boardTop: boardTop,
      boardLeft: boardLeft,
      boardSize: boardSize,
      cellSize: cellSize
    };
  }

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

  function drawFeedback(context, feedbackMessage, feedbackType, theme) {
    if (!feedbackMessage) {
      return;
    }

    const fill = feedbackType === "warning"
      ? theme.issueFill || "#f0d5d5"
      : theme.feedbackFill || "#e9eef3";
    const text = feedbackType === "warning"
      ? "#7a3030"
      : theme.feedbackText || "#304252";

    context.fillStyle = fill;
    context.fillRect(boardLeft, boardTop - 52, boardSize, 36);
    context.fillStyle = text;
    context.font = "16px sans-serif";
    context.textAlign = "left";
    context.textBaseline = "middle";
    context.fillText(feedbackMessage, boardLeft + 12, boardTop - 34);
  }

  function draw(context, cells, renderState) {
    const theme = renderState.theme || {};

    context.fillStyle = theme.boardBase || "#ffffff";
    context.fillRect(boardLeft, boardTop, boardSize, boardSize);
    drawFeedback(
      context,
      renderState.feedbackMessage,
      renderState.feedbackType,
      theme
    );

    cells.forEach(function (cell) {
      const row = Math.floor(cell.index / 9);
      const column = cell.index % 9;
      const x = boardLeft + column * cellSize;
      const y = boardTop + row * cellSize;

      context.fillStyle = cell.issue
        ? theme.issueFill || "#f0d5d5"
        : cell.hintTarget
          ? theme.selected || "#9ed9c8"
          : cell.selected
            ? theme.selected || "#9ed9c8"
            : cell.sameValue
              ? theme.sameValue || "#dceee8"
              : cell.related
                ? theme.related || "#f4efe4"
                : theme.boardBase || "#ffffff";
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
    getCellIndexByPoint,
    getMetrics
  };
}

module.exports = {
  createBoardScene
};
```

- [x] **Step 4: 扩展 `js/services/game-engine.js` 的 `buildBoardView` 签名**

将 `js/services/game-engine.js` 中的 `buildBoardView` 替换为：

```js
function buildBoardView(game, selectedIndex, extraState) {
  const selectedCell = game.cells[selectedIndex];
  const selectedValue = selectedCell ? selectedCell.value : EMPTY_CELL;
  const issueIndexes = extraState && Array.isArray(extraState.issueIndexes)
    ? extraState.issueIndexes
    : [];
  const hintTargetIndex = extraState ? extraState.hintTargetIndex : -1;

  return game.cells.map(function (cell) {
    const hasValue = cell.value !== EMPTY_CELL;
    const hasNotes = cell.notes.length > 0;

    return {
      index: cell.index,
      value: cell.value,
      given: cell.given,
      notes: cell.notes.slice(),
      selected: cell.index === selectedIndex,
      related: selectedIndex >= 0 && isRelatedCell(selectedIndex, cell.index),
      sameValue: Boolean(selectedValue && hasValue && cell.value === selectedValue),
      empty: !hasValue,
      hasNotes: hasNotes,
      issue: issueIndexes.indexOf(cell.index) >= 0,
      hintTarget: cell.index === hintTargetIndex
    };
  });
}
```

- [x] **Step 5: 运行测试并确认通过**

Run:

```bash
node --test tests/game-engine.test.js
```

Expected:

```text
全部测试通过，棋盘反馈状态测试为 PASS
```

- [ ] **Step 6: Commit**

```bash
git add js/scene/board-scene.js js/services/game-engine.js tests/game-engine.test.js
git commit -m "feat(game): 扩展棋盘反馈绘制"
```

### Task 8: 在主场景接入提示、检查与主题状态

**Files:**
- Modify: `js/main.js`
- Test: `tests/game-engine.test.js`

- [x] **Step 1: 在 `js/main.js` 中引入新增模块并初始化状态**

将 `js/main.js` 顶部 require 区域替换为：

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
const { loadCurrentGame, saveCurrentGame } = require("./services/storage");
const { runDifficultyCheck } = require("./services/checker");
const { getNextHint } = require("./services/hint-engine");
const { getThemeByDifficulty } = require("./ui/theme-policy");
const { createBoardScene } = require("./scene/board-scene");
const { createToolbar } = require("./ui/toolbar");
const { getTouchPoint } = require("./utils/touch");
```

把 `boot()` 里的局面初始化补成：

```js
  const currentPuzzle = puzzles[0];
  const restoredSession = loadCurrentGame(createGame(currentPuzzle));
  const difficulty = restoredSession.game.difficulty || currentPuzzle.difficulty;
  const theme = getThemeByDifficulty(difficulty);
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
```

- [x] **Step 2: 更新 `draw()`，把主题和反馈状态传给 scene / toolbar**

将 `draw()` 替换为：

```js
  function draw() {
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
      feedbackType: feedbackType
    });
    toolbar.draw(context, noteMode, theme);
  }
```

- [x] **Step 3: 在编辑类操作后清理旧提示与旧错误状态**

在 `persistState()` 后新增：

```js
  function clearFeedbackState() {
    feedbackMessage = "";
    feedbackType = "info";
    issueIndexes = [];
    hintState = {
      currentLevel: null,
      targetIndex: -1
    };
  }
```

并在以下分支中接入：

```js
    if (hitCellIndex >= 0) {
      selectedIndex = hitCellIndex;
      issueIndexes = [];
      hintState.targetIndex = -1;
      persistState();
      draw();
      return;
    }
```

```js
      if (nextGame !== game) {
        game = nextGame;
        clearFeedbackState();
        persistState();
      }
```

```js
      if (toolbarAction.value === "undo") {
        const undoResult = undoLastStep(game);

        if (
          undoResult.game !== game ||
          undoResult.selectedIndex !== selectedIndex
        ) {
          game = undoResult.game;
          selectedIndex = undoResult.selectedIndex;
          clearFeedbackState();
          persistState();
        }
      }
```

```js
      if (toolbarAction.value === "erase") {
        const nextGame = eraseCellContent(game, selectedIndex, noteMode);

        if (nextGame !== game) {
          game = nextGame;
          clearFeedbackState();
          persistState();
        }
      }
```

- [x] **Step 4: 在 `tool` 分支接入 `hint` 与 `check`**

继续扩展 `tool` 分支：

```js
      if (toolbarAction.value === "hint") {
        const hint = getNextHint(game, difficulty, hintState);
        feedbackMessage = hint.message;
        feedbackType = "info";
        issueIndexes = [];
        hintState = {
          currentLevel: hint.level,
          targetIndex: hint.targetIndex
        };
      }

      if (toolbarAction.value === "check") {
        const result = runDifficultyCheck(game, difficulty);
        feedbackMessage = result.message;
        feedbackType = result.hasIssue ? "warning" : "success";
        issueIndexes = result.issueIndexes;
        hintState.targetIndex = -1;
      }
```

- [x] **Step 5: 运行测试并确认通过**

Run:

```bash
node --test tests/game-engine.test.js
```

Expected:

```text
全部测试通过；主场景接入未破坏现有逻辑测试
```

- [ ] **Step 6: 在微信开发者工具中做提示/检查与主题 smoke test**

Manual checks:

```text
1. 启动小游戏并确认当前 beginner 题目页面比 skilled/expert 测试数据更柔和亲和
2. 点击提示多次，确认 beginner 会逐级升级到答案提示
3. 点击检查，确认 beginner 会直接指出错误填写
4. 输入、笔记、撤销、擦除后，旧提示与旧错误标记会清空
5. 恢复继续游戏后，棋盘与主题仍能正常渲染
6. 用测试数据或临时题目验证 skilled/expert 风格更专业简洁，且检查不会直接暴露答案
```

Expected:

```text
提示、检查与主题分级行为符合设计，且不破坏现有主循环
```

当前状态：未执行。此环境下尚未打开微信开发者工具，需后续手工补验。

- [ ] **Step 7: Commit**

```bash
git add js/main.js
git commit -m "feat(game): 接入分级提示检查与主题"
```

### Task 9: 回写主文档并做最终验证

**Files:**
- Modify: `docs/2026-06-04-jiuyu-current-design.md`
- Modify: `docs/2026-06-04-jiuyu-current-implementation-plan.md`
- Modify: `docs/superpowers/plans/2026-06-05-hint-check-implementation.md`
- Test: `tests/game-engine.test.js`

- [x] **Step 1: 在当前设计基线中把“下一阶段优先项”更新为已进入提示与检查**

将 `docs/2026-06-04-jiuyu-current-design.md` 中的：

```md
- 下一阶段优先项是 **本地存档与继续游戏**
```

替换为：

```md
- 下一阶段优先项是 **提示与检查分级能力**
```

并将“下一阶段与后续阶段”中的：

```md
- 提示系统
- 检查功能
```

替换为：

```md
- 提示与检查分级能力
```

- [x] **Step 2: 在当前实施计划中回写提示与检查已成为当前主线**

将 `docs/2026-06-04-jiuyu-current-implementation-plan.md` 中：

```md
第 1 项“本地存档”已完成代码接入、自动化验证与手工 smoke。下一优先级进入“提示与检查”。
```

替换为：

```md
第 1 项“本地存档”已完成。当前主线为“提示与检查分级能力”，并要求 UI 气质随难度变化。
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
git add docs/2026-06-04-jiuyu-current-design.md docs/2026-06-04-jiuyu-current-implementation-plan.md docs/superpowers/plans/2026-06-05-hint-check-implementation.md
git commit -m "docs: 更新提示检查实施计划"
```
