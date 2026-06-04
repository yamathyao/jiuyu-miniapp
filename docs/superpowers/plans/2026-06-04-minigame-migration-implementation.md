# Jiuyu Minigame Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将九屿项目从微信小程序目录结构迁移为微信小游戏结构，并在小游戏模式下跑通数独主场景的最小可玩闭环。

**Architecture:** 保留现有数独纯逻辑与测试，将小程序专属页面/组件结构替换为小游戏入口、Canvas 2D 主场景和底部操作区。迁移以“先建新入口与场景、再搬逻辑、最后清旧目录”为主线，确保规则逻辑在重建 UI 时不回退。

**Tech Stack:** WeChat Minigame, JavaScript, Canvas 2D, CommonJS, Node test runner

---

## File Structure

- Create: `game.js`
- Create: `game.json`
- Create: `js/main.js`
- Create: `js/scene/board-scene.js`
- Create: `js/ui/toolbar.js`
- Create: `js/services/game-engine.js`
- Create: `js/utils/sudoku.js`
- Create: `js/data/puzzles.js`
- Create: `js/constants.js`
- Modify: `project.config.json`
- Modify: `tests/game-engine.test.js`
- Delete: `miniprogram/app.js`
- Delete: `miniprogram/app.json`
- Delete: `miniprogram/app.wxss`
- Delete: `miniprogram/pages/**`
- Delete: `miniprogram/components/**`
- Preserve during migration: `miniprogram/services/*.js`
- Preserve during migration: `miniprogram/utils/*.js`
- Preserve during migration: `miniprogram/data/*.js`

## Guardrails

- Do not modify the already-dirty root `project.config.json` blindly; inspect and merge only the fields required for minigame startup.
- Do not rely on `miniprogram/project.config.json`; treat it as unrelated local noise unless later evidence proves otherwise.
- Keep `tests/game-engine.test.js` green after every logic move.
- Do not delete old `miniprogram/services` / `utils` / `data` files until the new `js/` copies are wired and verified.

## Task 1: 建立小游戏入口并切换项目配置

**Files:**
- Create: `game.js`
- Create: `game.json`
- Create: `js/main.js`
- Modify: `project.config.json`

- [ ] **Step 1: 写失败配置检查脚本，锁定小游戏入口缺失问题**

```js
const assert = require("node:assert/strict");
const test = require("node:test");
const fs = require("node:fs");
const path = require("node:path");

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
```

将以上内容先追加到 `tests/game-engine.test.js` 末尾，作为迁移入口护栏。

- [ ] **Step 2: 运行测试并确认失败**

Run:

```bash
node --test tests/game-engine.test.js
```

Expected:

```text
至少 1 个失败，原因是缺少 game.js/game.json 或 compileType 仍为 miniprogram
```

- [ ] **Step 3: 创建最小小游戏入口文件**

`game.js`

```js
require("./js/main");
```

`game.json`

```json
{
  "deviceOrientation": "portrait",
  "showStatusBar": "true"
}
```

`js/main.js`

```js
function boot() {
  if (typeof wx === "undefined" || !wx.createCanvas) {
    return;
  }

  const canvas = wx.createCanvas();
  const context = canvas.getContext("2d");

  context.fillStyle = "#f7f4ef";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#1f2933";
  context.font = "24px sans-serif";
  context.fillText("Jiuyu Minigame Booting", 24, 48);
}

boot();
```

- [ ] **Step 4: 修改 `project.config.json` 为小游戏入口配置**

将关键字段调整为：

```json
{
  "compileType": "game",
  "minigameRoot": "./"
}
```

保留现有 `appid`、`projectname`、`setting` 等字段，只替换与项目形态直接相关的配置，不顺手清理其它本地字段。

- [ ] **Step 5: 运行测试并确认入口护栏通过**

Run:

```bash
node --test tests/game-engine.test.js
```

Expected:

```text
新增的入口检查通过；旧的 game-engine 测试此时仍可能因为 require 路径未切换而继续通过或待后续任务接线
```

- [ ] **Step 6: Commit**

```bash
git add game.js game.json js/main.js project.config.json tests/game-engine.test.js
git commit -m "feat(game): 建立小游戏入口结构"
```

## Task 2: 迁移纯逻辑模块到 `js/` 目录

**Files:**
- Create: `js/services/game-engine.js`
- Create: `js/utils/sudoku.js`
- Create: `js/data/puzzles.js`
- Create: `js/constants.js`
- Modify: `tests/game-engine.test.js`

- [ ] **Step 1: 调整测试引用到新目录，先制造失败**

将 `tests/game-engine.test.js` 中的 require 改为：

```js
const { puzzles } = require("../js/data/puzzles");
const {
  createGame,
  applyInputValue,
  toggleCellNote,
  eraseCellContent,
  undoLastStep,
  buildBoardView
} = require("../js/services/game-engine");
```

- [ ] **Step 2: 运行测试并确认失败**

Run:

```bash
node --test tests/game-engine.test.js
```

Expected:

```text
FAIL，并提示找不到 ../js/data/puzzles 或 ../js/services/game-engine
```

- [ ] **Step 3: 复制纯逻辑模块到新目录**

`js/utils/sudoku.js`

```js
function getRow(index) {
  return Math.floor(index / 9);
}

function getColumn(index) {
  return index % 9;
}

function getBox(index) {
  const row = getRow(index);
  const column = getColumn(index);
  return Math.floor(row / 3) * 3 + Math.floor(column / 3);
}

function isSameRow(leftIndex, rightIndex) {
  return getRow(leftIndex) === getRow(rightIndex);
}

function isSameColumn(leftIndex, rightIndex) {
  return getColumn(leftIndex) === getColumn(rightIndex);
}

function isSameBox(leftIndex, rightIndex) {
  return getBox(leftIndex) === getBox(rightIndex);
}

function isRelatedCell(leftIndex, rightIndex) {
  return (
    leftIndex === rightIndex ||
    isSameRow(leftIndex, rightIndex) ||
    isSameColumn(leftIndex, rightIndex) ||
    isSameBox(leftIndex, rightIndex)
  );
}

module.exports = {
  getRow,
  getColumn,
  getBox,
  isSameRow,
  isSameColumn,
  isSameBox,
  isRelatedCell
};
```

`js/data/puzzles.js`

```js
const puzzles = [
  {
    id: "beginner-001",
    difficulty: "beginner",
    puzzle: "530070000600195000098000060800060003400803001700020006060000280000419005000080079",
    solution: "534678912672195348198342567859761423426853791713924856961537284287419635345286179",
    techniques: ["naked-single", "hidden-single"]
  }
];

module.exports = {
  puzzles
};
```

`js/constants.js`

```js
const DIFFICULTIES = {
  beginner: "入门",
  advanced: "进阶",
  skilled: "熟练",
  expert: "专家"
};

module.exports = {
  DIFFICULTIES
};
```

`js/services/game-engine.js`

```js
const EMPTY_CELL = "";
const { isRelatedCell } = require("../utils/sudoku");

function cloneCell(cell) {
  return {
    index: cell.index,
    value: cell.value,
    given: cell.given,
    notes: cell.notes.slice()
  };
}

function cloneGame(game) {
  return {
    puzzleId: game.puzzleId,
    difficulty: game.difficulty,
    puzzle: game.puzzle,
    solution: game.solution,
    cells: game.cells.map(cloneCell),
    elapsedSeconds: game.elapsedSeconds,
    mistakes: game.mistakes,
    hintsUsed: game.hintsUsed,
    history: game.history.slice()
  };
}

function createGame(puzzle) {
  return {
    puzzleId: puzzle.id,
    difficulty: puzzle.difficulty,
    puzzle: puzzle.puzzle,
    solution: puzzle.solution,
    cells: puzzle.puzzle.split("").map(function (value, index) {
      const isEmpty = value === "0";

      return {
        index: index,
        value: isEmpty ? EMPTY_CELL : value,
        given: !isEmpty,
        notes: []
      };
    }),
    elapsedSeconds: 0,
    mistakes: 0,
    hintsUsed: 0,
    history: []
  };
}

function isEditableCell(game, index) {
  const cell = game.cells[index];
  return Boolean(cell) && !cell.given;
}

function pushHistoryEntry(nextGame, cell, mode) {
  nextGame.history.push({
    index: cell.index,
    mode: mode,
    value: cell.value,
    notes: cell.notes.slice()
  });
}

function applyInputValue(game, index, rawValue) {
  if (!isEditableCell(game, index)) {
    return game;
  }

  const value = String(rawValue);
  const nextGame = cloneGame(game);
  const targetCell = nextGame.cells[index];

  pushHistoryEntry(nextGame, targetCell, "value");
  targetCell.value = value;
  targetCell.notes = [];

  return nextGame;
}

function toggleCellNote(game, index, rawValue) {
  if (!isEditableCell(game, index)) {
    return game;
  }

  const value = String(rawValue);
  const nextGame = cloneGame(game);
  const targetCell = nextGame.cells[index];
  const nextNotes = targetCell.notes.slice();
  const existingIndex = nextNotes.indexOf(value);

  pushHistoryEntry(nextGame, targetCell, "note");

  if (existingIndex >= 0) {
    nextNotes.splice(existingIndex, 1);
  } else {
    nextNotes.push(value);
    nextNotes.sort();
  }

  targetCell.notes = nextNotes;

  return nextGame;
}

function eraseCellContent(game, index, noteMode) {
  if (!isEditableCell(game, index)) {
    return game;
  }

  const nextGame = cloneGame(game);
  const targetCell = nextGame.cells[index];
  const hasValue = targetCell.value !== EMPTY_CELL;
  const hasNotes = targetCell.notes.length > 0;

  if (noteMode && !hasNotes) {
    return game;
  }

  if (!noteMode && !hasValue) {
    return game;
  }

  pushHistoryEntry(nextGame, targetCell, noteMode ? "erase-note" : "erase-value");

  if (noteMode) {
    targetCell.notes = [];
  } else {
    targetCell.value = EMPTY_CELL;
  }

  return nextGame;
}

function undoLastStep(game) {
  if (!game.history.length) {
    return game;
  }

  const nextGame = cloneGame(game);
  const lastStep = nextGame.history.pop();
  const targetCell = nextGame.cells[lastStep.index];

  targetCell.value = lastStep.value;
  targetCell.notes = lastStep.notes.slice();

  return nextGame;
}

function buildBoardView(game, selectedIndex) {
  const selectedCell = game.cells[selectedIndex];
  const selectedValue = selectedCell ? selectedCell.value : EMPTY_CELL;

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
      hasNotes: hasNotes
    };
  });
}

module.exports = {
  createGame,
  isEditableCell,
  applyInputValue,
  toggleCellNote,
  eraseCellContent,
  undoLastStep,
  buildBoardView
};
```

- [ ] **Step 4: 运行测试并确认纯逻辑迁移保持通过**

Run:

```bash
node --test tests/game-engine.test.js
```

Expected:

```text
现有 6 个逻辑测试继续通过，入口检查也通过
```

- [ ] **Step 5: Commit**

```bash
git add js/services/game-engine.js js/utils/sudoku.js js/data/puzzles.js js/constants.js tests/game-engine.test.js
git commit -m "feat(game): 迁移数独纯逻辑模块"
```

## Task 3: 实现小游戏棋盘场景与工具栏渲染

**Files:**
- Create: `js/scene/board-scene.js`
- Create: `js/ui/toolbar.js`
- Modify: `js/main.js`

- [ ] **Step 1: 先写场景接口占位，让主程序在缺少实现时失败清晰**

在 `js/main.js` 中先引用尚未实现的场景模块：

```js
const { createBoardScene } = require("./scene/board-scene");
const { createToolbar } = require("./ui/toolbar");
```

- [ ] **Step 2: 运行最小加载测试或 Node require 检查并确认失败**

Run:

```bash
node -e "require('./js/main')"
```

Expected:

```text
FAIL，并提示找不到 ./scene/board-scene 或 ./ui/toolbar
```

- [ ] **Step 3: 实现棋盘场景模块**

`js/scene/board-scene.js`

```js
function createBoardScene(options) {
  const boardTop = options.boardTop || 120;
  const boardLeft = options.boardLeft || 24;
  const boardSize = options.boardSize || 702;
  const cellSize = boardSize / 9;

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

  function draw(context, cells) {
    context.fillStyle = "#ffffff";
    context.fillRect(boardLeft, boardTop, boardSize, boardSize);

    cells.forEach(function (cell) {
      const row = Math.floor(cell.index / 9);
      const column = cell.index % 9;
      const x = boardLeft + column * cellSize;
      const y = boardTop + row * cellSize;

      context.fillStyle = cell.selected
        ? "#9ed9c8"
        : cell.sameValue
          ? "#dceee8"
          : cell.related
            ? "#f4efe4"
            : "#ffffff";
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
    getCellIndexByPoint
  };
}

module.exports = {
  createBoardScene
};
```

- [ ] **Step 4: 实现工具栏模块**

`js/ui/toolbar.js`

```js
function createToolbar(options) {
  const top = options.top || 860;
  const left = options.left || 24;
  const width = options.width || 702;
  const numberHeight = 64;
  const toolTop = top + 92;

  function draw(context, noteMode) {
    const numberWidth = width / 9;

    for (let index = 0; index < 9; index += 1) {
      context.fillStyle = "#ffffff";
      context.fillRect(left + index * numberWidth, top, numberWidth - 6, numberHeight);
      context.fillStyle = "#1f6f78";
      context.font = "24px sans-serif";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(String(index + 1), left + index * numberWidth + numberWidth / 2, top + numberHeight / 2);
    }

    const tools = [
      { key: "note", label: "笔记" },
      { key: "undo", label: "撤销" },
      { key: "erase", label: "擦除" }
    ];
    const toolWidth = width / tools.length;

    tools.forEach(function (tool, index) {
      context.fillStyle = tool.key === "note" && noteMode ? "#1f6f78" : "#edf3f2";
      context.fillRect(left + index * toolWidth, toolTop, toolWidth - 6, 64);
      context.fillStyle = tool.key === "note" && noteMode ? "#ffffff" : "#1f2933";
      context.font = "20px sans-serif";
      context.fillText(tool.label, left + index * toolWidth + toolWidth / 2, toolTop + 32);
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

    if (y >= toolTop && y <= toolTop + 64 && x >= left && x <= left + width) {
      const toolWidth = width / 3;
      const index = Math.floor((x - left) / toolWidth);
      return {
        type: "tool",
        value: ["note", "undo", "erase"][index]
      };
    }

    return null;
  }

  return {
    draw,
    hitTest
  };
}

module.exports = {
  createToolbar
};
```

- [ ] **Step 5: 用小游戏主循环串联场景与工具栏**

将 `js/main.js` 更新为：

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
const { createBoardScene } = require("./scene/board-scene");
const { createToolbar } = require("./ui/toolbar");

function boot() {
  if (typeof wx === "undefined" || !wx.createCanvas) {
    return;
  }

  const canvas = wx.createCanvas();
  const context = canvas.getContext("2d");
  let game = createGame(puzzles[0]);
  let selectedIndex = -1;
  let noteMode = false;

  const boardScene = createBoardScene({});
  const toolbar = createToolbar({});

  function draw() {
    const cells = buildBoardView(game, selectedIndex);

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#f7f4ef";
    context.fillRect(0, 0, canvas.width, canvas.height);
    boardScene.draw(context, cells);
    toolbar.draw(context, noteMode);
  }

  wx.onTouchStart(function (event) {
    const touch = event.touches[0];
    const hitCellIndex = boardScene.getCellIndexByPoint(touch.x, touch.y);

    if (hitCellIndex >= 0) {
      selectedIndex = hitCellIndex;
      draw();
      return;
    }

    const toolbarAction = toolbar.hitTest(touch.x, touch.y);

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
        game = undoLastStep(game);
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
```

- [ ] **Step 6: 运行逻辑测试，确认 UI 接线未破坏纯逻辑**

Run:

```bash
node --test tests/game-engine.test.js
```

Expected:

```text
全部测试通过
```

- [ ] **Step 7: Commit**

```bash
git add js/main.js js/scene/board-scene.js js/ui/toolbar.js
git commit -m "feat(game): 搭建小游戏数独主场景"
```

## Task 4: 清理小程序专属入口与页面目录

**Files:**
- Delete: `miniprogram/app.js`
- Delete: `miniprogram/app.json`
- Delete: `miniprogram/app.wxss`
- Delete: `miniprogram/pages/**`
- Delete: `miniprogram/components/**`

- [ ] **Step 1: 先确认纯逻辑迁移与小游戏主场景文件都已存在**

Run:

```bash
Get-ChildItem js -Recurse -File | Select-Object FullName
```

Expected:

```text
能看到 js/main.js、js/scene/board-scene.js、js/ui/toolbar.js、js/services/game-engine.js、js/utils/sudoku.js、js/data/puzzles.js
```

- [ ] **Step 2: 删除小程序专属入口文件**

Run:

```powershell
Remove-Item -LiteralPath miniprogram\app.js
Remove-Item -LiteralPath miniprogram\app.json
Remove-Item -LiteralPath miniprogram\app.wxss
```

- [ ] **Step 3: 删除小程序页面与组件目录**

Run:

```powershell
Remove-Item -LiteralPath miniprogram\pages -Recurse
Remove-Item -LiteralPath miniprogram\components -Recurse
```

- [ ] **Step 4: 重新运行逻辑测试，确认清理旧目录未影响逻辑层**

Run:

```bash
node --test tests/game-engine.test.js
```

Expected:

```text
全部测试通过
```

- [ ] **Step 5: Commit**

```bash
git add -A miniprogram js game.js game.json project.config.json tests/game-engine.test.js
git commit -m "refactor(game): 清理小程序页面结构"
```

## Task 5: 完成迁移验证与计划回写

**Files:**
- Modify: `docs/superpowers/plans/2026-06-04-minigame-migration-implementation.md`

- [ ] **Step 1: 再次运行逻辑测试，确认迁移最终状态通过**

Run:

```bash
node --test tests/game-engine.test.js
```

Expected:

```text
所有测试通过，0 fail
```

- [ ] **Step 2: 在微信开发者工具中执行小游戏 smoke test**

Manual checks:

```text
1. 以小游戏项目打开仓库
2. 确认不再报 “未找到 game.json 文件”
3. 进入主场景，看到静态数独棋盘
4. 点击棋盘格，确认选中高亮和相关格高亮
5. 选中可编辑格后点击数字，确认填数成功
6. 打开笔记模式后输入数字，确认候选数显示
7. 点击擦除，确认当前模式对应内容被清除
8. 点击撤销，确认恢复到上一步
9. 点击 given 格后输入数字，确认不会写入
10. 选中有值格，确认相同数字高亮
```

Expected:

```text
小游戏可正常启动并完成最小可玩闭环
```

- [ ] **Step 3: 回写计划勾选状态与验证结果**

```markdown
- [x] Step 1: 再次运行逻辑测试，确认迁移最终状态通过
- [x] Step 2: 在微信开发者工具中执行小游戏 smoke test
- [x] Step 3: 回写计划勾选状态与验证结果
```

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/plans/2026-06-04-minigame-migration-implementation.md
git commit -m "docs: 更新小游戏迁移实施记录"
```
