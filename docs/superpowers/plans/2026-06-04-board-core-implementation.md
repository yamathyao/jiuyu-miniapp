# Jiuyu Board Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为九屿小程序实现可稳定交互的棋盘核心，包括选格、高亮、普通填数、笔记模式、擦除、撤销与给定数字只读约束。

**Architecture:** 由 `pages/game` 持有页面交互状态和游戏状态，`services/game-engine` 承担纯逻辑更新与高亮计算，`components` 只负责渲染和事件派发。测试优先覆盖 `game-engine` 的纯函数行为，再通过微信开发者工具进行页面 smoke test。

**Tech Stack:** WeChat Mini Program, JavaScript, WXML, WXSS, CommonJS

---

## File Structure

- Modify: `miniprogram/services/game-engine.js`
- Modify: `miniprogram/utils/sudoku.js`
- Modify: `miniprogram/pages/game/game.js`
- Modify: `miniprogram/pages/game/game.wxml`
- Modify: `miniprogram/pages/game/game.wxss`
- Modify: `miniprogram/components/sudoku-board/sudoku-board.js`
- Modify: `miniprogram/components/sudoku-board/sudoku-board.wxml`
- Modify: `miniprogram/components/sudoku-board/sudoku-board.wxss`
- Modify: `miniprogram/components/number-pad/number-pad.js`
- Modify: `miniprogram/components/number-pad/number-pad.wxml`
- Modify: `miniprogram/components/number-pad/number-pad.wxss`
- Modify: `miniprogram/components/game-toolbar/game-toolbar.js`
- Modify: `miniprogram/components/game-toolbar/game-toolbar.wxml`
- Modify: `miniprogram/components/game-toolbar/game-toolbar.wxss`
- Create: `tests/game-engine.test.js`

## Task 1: 扩展数独工具函数与游戏引擎纯逻辑

**Files:**
- Modify: `miniprogram/utils/sudoku.js`
- Modify: `miniprogram/services/game-engine.js`
- Test: `tests/game-engine.test.js`

- [x] **Step 1: 写失败测试，锁定引擎行为**

```js
const assert = require("node:assert/strict");
const test = require("node:test");
const { puzzles } = require("../miniprogram/data/puzzles");
const {
  createGame,
  applyInputValue,
  toggleCellNote,
  eraseCellContent,
  undoLastStep,
  buildBoardView
} = require("../miniprogram/services/game-engine");

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

test("undoLastStep restores the previous editable state", function () {
  const game = createGame(puzzles[0]);
  const changed = applyInputValue(game, 2, "4");
  const restored = undoLastStep(changed);

  assert.equal(restored.cells[2].value, "");
  assert.equal(restored.history.length, 0);
});

test("buildBoardView marks selected, related, and same-value cells", function () {
  const game = createGame(puzzles[0]);
  const changed = applyInputValue(game, 2, "4");
  const boardView = buildBoardView(changed, 2);

  assert.equal(boardView[2].selected, true);
  assert.equal(boardView[0].related, true);
  assert.equal(boardView[36].sameValue, true);
});
```

- [x] **Step 2: 运行测试并确认失败**

Run:

```bash
node --test tests/game-engine.test.js
```

Expected:

```text
FAIL
```

并出现 `applyInputValue is not a function` 或等价的未实现错误。

- [x] **Step 3: 扩展 `miniprogram/utils/sudoku.js` 的辅助函数**

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

- [x] **Step 4: 在 `miniprogram/services/game-engine.js` 中实现可编辑逻辑与高亮构建**

```js
const EMPTY_CELL = "";
const {
  isRelatedCell
} = require("../utils/sudoku");

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
      sameValue: Boolean(
        selectedValue &&
        hasValue &&
        cell.value === selectedValue
      ),
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

- [x] **Step 5: 再次运行逻辑测试并确认通过**

Run:

```bash
node --test tests/game-engine.test.js
```

Expected:

```text
# pass 6
# fail 0
```

- [x] **Step 6: Commit**

```bash
git add miniprogram/utils/sudoku.js miniprogram/services/game-engine.js tests/game-engine.test.js
git commit -m "feat(game): 完善棋盘核心引擎"
```

## Task 2: 串联棋盘页状态与命令流

**Files:**
- Modify: `miniprogram/pages/game/game.js`
- Modify: `miniprogram/pages/game/game.wxml`
- Modify: `miniprogram/pages/game/game.wxss`

- [x] **Step 1: 写页面需要的展示绑定代码**

```js
const { puzzles } = require("../../data/puzzles");
const { DIFFICULTIES } = require("../../utils/constants");
const {
  createGame,
  applyInputValue,
  toggleCellNote,
  eraseCellContent,
  undoLastStep,
  buildBoardView
} = require("../../services/game-engine");

function buildPageState(game, selectedIndex, noteMode) {
  return {
    game: game,
    selectedIndex: selectedIndex,
    noteMode: noteMode,
    difficultyLabel: DIFFICULTIES[game.difficulty] || "入门",
    boardCells: buildBoardView(game, selectedIndex)
  };
}

Page({
  data: {
    game: null,
    boardCells: [],
    selectedIndex: -1,
    noteMode: false,
    difficultyLabel: "入门"
  },

  onLoad() {
    const game = createGame(puzzles[0]);

    this.setData(buildPageState(game, -1, false));
  },

  handleCellSelect(event) {
    const selectedIndex = event.detail.index;

    this.setData({
      selectedIndex: selectedIndex,
      boardCells: buildBoardView(this.data.game, selectedIndex)
    });
  },

  handleNumberInput(event) {
    const selectedIndex = this.data.selectedIndex;

    if (selectedIndex < 0) {
      return;
    }

    const nextGame = this.data.noteMode
      ? toggleCellNote(this.data.game, selectedIndex, event.detail.value)
      : applyInputValue(this.data.game, selectedIndex, event.detail.value);

    this.setData(buildPageState(nextGame, selectedIndex, this.data.noteMode));
  },

  handleToolbarCommand(event) {
    const command = event.detail.command;

    if (command === "note") {
      this.setData({
        noteMode: !this.data.noteMode
      });
      return;
    }

    if (command === "undo") {
      const nextGame = undoLastStep(this.data.game);
      this.setData(buildPageState(nextGame, this.data.selectedIndex, this.data.noteMode));
      return;
    }

    if (command === "erase") {
      const nextGame = eraseCellContent(
        this.data.game,
        this.data.selectedIndex,
        this.data.noteMode
      );

      this.setData(buildPageState(nextGame, this.data.selectedIndex, this.data.noteMode));
    }
  }
});
```

- [x] **Step 2: 绑定页面模板，把状态传给组件**

```xml
<view class="page game-page">
  <view class="game-status">
    <text>{{difficultyLabel}}</text>
    <text>00:00</text>
    <text>错误 0</text>
  </view>

  <sudoku-board cells="{{boardCells}}" bind:select="handleCellSelect"></sudoku-board>
  <number-pad bind:input="handleNumberInput"></number-pad>
  <game-toolbar note-mode="{{noteMode}}" bind:command="handleToolbarCommand"></game-toolbar>
</view>
```

- [x] **Step 3: 调整页面样式，给棋盘留出稳定操作空间**

```css
.game-page {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  min-height: 100vh;
  padding: 24rpx;
  box-sizing: border-box;
  background: #f7f4ef;
}

.game-status {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #607078;
  font-size: 26rpx;
}
```

- [x] **Step 4: 运行逻辑测试，确认页面接线没有破坏引擎行为**

Run:

```bash
node --test tests/game-engine.test.js
```

Expected:

```text
# pass 6
# fail 0
```

- [ ] **Step 5: Commit**

```bash
git add miniprogram/pages/game/game.js miniprogram/pages/game/game.wxml miniprogram/pages/game/game.wxss
git commit -m "feat(game): 串联棋盘页状态"
```

## Task 3: 完成棋盘组件动态渲染与高亮表现

**Files:**
- Modify: `miniprogram/components/sudoku-board/sudoku-board.js`
- Modify: `miniprogram/components/sudoku-board/sudoku-board.wxml`
- Modify: `miniprogram/components/sudoku-board/sudoku-board.wxss`

- [x] **Step 1: 为棋盘组件补属性与点击事件**

```js
Component({
  properties: {
    cells: {
      type: Array,
      value: []
    }
  },

  methods: {
    handleCellTap(event) {
      this.triggerEvent("select", {
        index: event.currentTarget.dataset.index
      });
    }
  }
});
```

- [x] **Step 2: 实现最终版棋盘格与候选数模板**

```xml
<view class="sudoku-board">
  <block wx:for="{{cells}}" wx:key="index" wx:for-item="cell">
    <view
      class="cell {{cell.given ? 'is-given' : ''}} {{cell.selected ? 'is-selected' : ''}} {{cell.related ? 'is-related' : ''}} {{cell.sameValue ? 'is-same-value' : ''}}"
      data-index="{{cell.index}}"
      bindtap="handleCellTap"
    >
      <text wx:if="{{cell.value}}" class="cell-value">{{cell.value}}</text>
      <view wx:elif="{{cell.hasNotes}}" class="cell-notes">
        <block wx:for="{{['1','2','3','4','5','6','7','8','9']}}" wx:key="*this" wx:for-item="noteValue">
          <text class="note-value">{{cell.notes.indexOf(noteValue) > -1 ? noteValue : ''}}</text>
        </block>
      </view>
    </view>
  </block>
</view>
```

- [x] **Step 3: 为高亮、given 和候选数补样式**

```css
.sudoku-board {
  display: grid;
  grid-template-columns: repeat(9, 1fr);
  overflow: hidden;
  border: 4rpx solid #1f2933;
  background: #1f2933;
  aspect-ratio: 1;
}

.cell {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 1rpx;
  background: #ffffff;
  color: #1f2933;
  min-height: 72rpx;
}

.is-related {
  background: #f4efe4;
}

.is-same-value {
  background: #dceee8;
}

.is-selected {
  background: #9ed9c8;
}

.is-given .cell-value {
  font-weight: 700;
}

.cell-value {
  font-size: 34rpx;
}

.cell-notes {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  width: 100%;
  height: 100%;
  padding: 6rpx;
  box-sizing: border-box;
}

.note-value {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16rpx;
  color: #607078;
}
```

- [x] **Step 4: 运行逻辑测试，确保展示层改动未影响纯逻辑**

Run:

```bash
node --test tests/game-engine.test.js
```

Expected:

```text
# pass 6
# fail 0
```

- [ ] **Step 5: Commit**

```bash
git add miniprogram/components/sudoku-board/sudoku-board.js miniprogram/components/sudoku-board/sudoku-board.wxml miniprogram/components/sudoku-board/sudoku-board.wxss
git commit -m "feat(game): 完成棋盘渲染与高亮"
```

## Task 4: 完成数字键盘与工具栏交互反馈

**Files:**
- Modify: `miniprogram/components/number-pad/number-pad.js`
- Modify: `miniprogram/components/number-pad/number-pad.wxml`
- Modify: `miniprogram/components/number-pad/number-pad.wxss`
- Modify: `miniprogram/components/game-toolbar/game-toolbar.js`
- Modify: `miniprogram/components/game-toolbar/game-toolbar.wxml`
- Modify: `miniprogram/components/game-toolbar/game-toolbar.wxss`

- [x] **Step 1: 保持数字键盘为纯输入组件**

```js
Component({
  data: {
    numbers: [1, 2, 3, 4, 5, 6, 7, 8, 9]
  },

  methods: {
    handleTap(event) {
      this.triggerEvent("input", {
        value: String(event.currentTarget.dataset.value)
      });
    }
  }
});
```

- [x] **Step 2: 给工具栏补上笔记模式属性**

```js
Component({
  properties: {
    noteMode: {
      type: Boolean,
      value: false
    }
  },

  methods: {
    handleCommand(event) {
      this.triggerEvent("command", {
        command: event.currentTarget.dataset.command
      });
    }
  }
});
```

- [x] **Step 3: 让工具栏模板体现激活态，并去掉本阶段不用的命令入口**

```xml
<view class="game-toolbar">
  <button class="tool-button {{noteMode ? 'is-active' : ''}}" data-command="note" bindtap="handleCommand">笔记</button>
  <button class="tool-button" data-command="undo" bindtap="handleCommand">撤销</button>
  <button class="tool-button" data-command="erase" bindtap="handleCommand">擦除</button>
</view>
```

- [x] **Step 4: 收紧工具栏样式，突出激活态**

```css
.game-toolbar {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8rpx;
}

.tool-button {
  min-height: 64rpx;
  padding: 0;
  border-radius: 10rpx;
  background: #edf3f2;
  color: #1f2933;
  font-size: 24rpx;
}

.tool-button.is-active {
  background: #1f6f78;
  color: #ffffff;
}

.tool-button::after {
  border: 0;
}
```

- [x] **Step 5: 运行逻辑测试，确认输入事件格式保持兼容**

Run:

```bash
node --test tests/game-engine.test.js
```

Expected:

```text
# pass 6
# fail 0
```

- [ ] **Step 6: Commit**

```bash
git add miniprogram/components/number-pad miniprogram/components/game-toolbar
git commit -m "feat(game): 完善棋盘输入控件"
```

## Task 5: 完成集成验证

**Files:**
- Modify: `docs/superpowers/plans/2026-06-04-board-core-implementation.md`

- [ ] **Step 1: 再次运行逻辑测试，确认最终状态通过**

Run:

```bash
node --test tests/game-engine.test.js
```

Expected:

```text
# pass 6
# fail 0
```

- [ ] **Step 2: 在微信开发者工具执行页面 smoke test**

Manual checks:

```text
1. 打开 pages/game/game
2. 点击空白格，确认选中高亮、同行列宫高亮出现
3. 点击数字键，确认普通填数生效
4. 打开笔记模式，在空白格输入 1 和 4，确认格内显示候选数
5. 再点一次 4，确认该候选数被移除
6. 点击擦除，确认当前模式对应内容被清空
7. 点击撤销，确认恢复上一步
8. 点击 given 格，确认无法编辑
9. 选中有值格，确认全盘相同数字高亮
```

Expected:

```text
所有交互均符合 spec，无崩溃、无明显视觉错位
```

- [ ] **Step 3: 记录验证结果并更新计划勾选状态**

```markdown
- [x] Step 1: 再次运行逻辑测试，确认最终状态通过
- [x] Step 2: 在微信开发者工具执行页面 smoke test
- [x] Step 3: 记录验证结果并更新计划勾选状态
```

- [ ] **Step 4: Commit**

```bash
git add tests/game-engine.test.js miniprogram/pages/game miniprogram/components miniprogram/services/game-engine.js miniprogram/utils/sudoku.js docs/superpowers/plans/2026-06-04-board-core-implementation.md
git commit -m "feat(game): 完成棋盘核心交互"
```
