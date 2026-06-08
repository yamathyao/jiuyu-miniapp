# Jiuyu Local Save Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为九屿微信小游戏增加“自动本地存档 + 启动自动恢复 + 保留撤销历史”的继续游戏能力。

**Architecture:** 新增 `js/services/storage.js` 作为当前单局存档模块，负责存储 key、同步读写和恢复兜底。`js/main.js` 保持场景状态持有职责，在启动时通过存档模块恢复 `game`、`selectedIndex`、`noteMode`，并在关键交互后立即保存最近状态。

**Tech Stack:** WeChat Minigame, JavaScript, CommonJS, Node test runner

---

## File Structure

- Create: `js/services/storage.js`
- Modify: `js/main.js`
- Modify: `tests/game-engine.test.js`
- Modify: `docs/2026-06-04-jiuyu-current-implementation-plan.md`

## Guardrails

- Do not modify or stage `miniprogram/project.config.json`; it is unrelated local noise.
- Keep `node --test tests/game-engine.test.js` green after each task.
- Do not introduce cloud sync, multiple save slots, or new UI while implementing this plan.
- Keep storage logic centralized in `js/services/storage.js`; avoid scattering validation branches across `js/main.js`.

### Task 1: 为本地存档补失败测试

**Files:**
- Modify: `tests/game-engine.test.js`
- Test: `tests/game-engine.test.js`

- [x] **Step 1: 在测试文件中先引入尚未存在的存档模块**

在 `tests/game-engine.test.js` 顶部现有 require 后追加：

```js
const {
  STORAGE_KEYS,
  readStorage,
  writeStorage,
  loadCurrentGame,
  saveCurrentGame
} = require("../js/services/storage");
```

- [x] **Step 2: 追加本地存档测试用例**

在 `tests/game-engine.test.js` 末尾追加：

```js
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
```

- [x] **Step 3: 运行测试并确认它们先失败**

Run:

```bash
node --test tests/game-engine.test.js
```

Expected:

```text
FAIL，并提示找不到 ../js/services/storage
```

- [ ] **Step 4: Commit**

```bash
git add tests/game-engine.test.js
git commit -m "test(game): 补充本地存档失败用例"
```

### Task 2: 实现可测的本地存档模块

**Files:**
- Create: `js/services/storage.js`
- Modify: `tests/game-engine.test.js`
- Test: `tests/game-engine.test.js`

- [x] **Step 1: 创建 `js/services/storage.js`**

新增 `js/services/storage.js`：

```js
const STORAGE_KEYS = {
  currentGame: "jiuyu.currentGame"
};

function getStorageApi(storageApi) {
  if (storageApi) {
    return storageApi;
  }

  if (typeof wx !== "undefined") {
    return wx;
  }

  return null;
}

function readStorage(key, fallbackValue, storageApi) {
  const api = getStorageApi(storageApi);

  if (!api || typeof api.getStorageSync !== "function") {
    return fallbackValue;
  }

  try {
    const value = api.getStorageSync(key);
    return value === "" || typeof value === "undefined" ? fallbackValue : value;
  } catch (error) {
    return fallbackValue;
  }
}

function writeStorage(key, value, storageApi) {
  const api = getStorageApi(storageApi);

  if (!api || typeof api.setStorageSync !== "function") {
    return false;
  }

  try {
    api.setStorageSync(key, value);
    return true;
  } catch (error) {
    return false;
  }
}

function isValidHistoryEntry(entry) {
  return (
    Boolean(entry) &&
    Number.isInteger(entry.index) &&
    typeof entry.mode === "string" &&
    typeof entry.value === "string" &&
    Array.isArray(entry.notes)
  );
}

function isValidCell(cell) {
  return (
    Boolean(cell) &&
    Number.isInteger(cell.index) &&
    typeof cell.value === "string" &&
    typeof cell.given === "boolean" &&
    Array.isArray(cell.notes)
  );
}

function isValidGame(game) {
  return (
    Boolean(game) &&
    typeof game.puzzleId === "string" &&
    typeof game.difficulty === "string" &&
    typeof game.puzzle === "string" &&
    typeof game.solution === "string" &&
    Array.isArray(game.cells) &&
    game.cells.length === 81 &&
    game.cells.every(isValidCell) &&
    typeof game.elapsedSeconds === "number" &&
    typeof game.mistakes === "number" &&
    typeof game.hintsUsed === "number" &&
    Array.isArray(game.history) &&
    game.history.every(isValidHistoryEntry)
  );
}

function isValidSavedSession(session) {
  return (
    Boolean(session) &&
    isValidGame(session.game) &&
    Number.isInteger(session.selectedIndex) &&
    session.selectedIndex >= -1 &&
    session.selectedIndex < 81 &&
    typeof session.noteMode === "boolean"
  );
}

function loadCurrentGame(defaultGame, storageApi) {
  const fallbackSession = {
    game: defaultGame,
    selectedIndex: -1,
    noteMode: false
  };
  const savedSession = readStorage(STORAGE_KEYS.currentGame, null, storageApi);

  if (!isValidSavedSession(savedSession)) {
    return fallbackSession;
  }

  return savedSession;
}

function saveCurrentGame(session, storageApi) {
  return writeStorage(STORAGE_KEYS.currentGame, session, storageApi);
}

module.exports = {
  STORAGE_KEYS,
  readStorage,
  writeStorage,
  loadCurrentGame,
  saveCurrentGame
};
```

- [x] **Step 2: 再补一个“读取不到 wx 时回退默认局面”的测试**

在 `tests/game-engine.test.js` 的本地存档测试后追加：

```js
test("loadCurrentGame returns the fallback session when storage API is missing", function () {
  const defaultGame = createGame(puzzles[0]);
  const restored = loadCurrentGame(defaultGame, null);

  assert.equal(restored.game.cells[2].value, "");
  assert.equal(restored.selectedIndex, -1);
  assert.equal(restored.noteMode, false);
});
```

- [x] **Step 3: 运行测试并确认通过**

Run:

```bash
node --test tests/game-engine.test.js
```

Expected:

```text
全部测试通过，新增本地存档测试为 PASS
```

- [ ] **Step 4: Commit**

```bash
git add js/services/storage.js tests/game-engine.test.js
git commit -m "feat(game): 增加本地存档模块"
```

### Task 3: 在启动阶段接入自动恢复

**Files:**
- Modify: `js/main.js`
- Test: `tests/game-engine.test.js`

- [x] **Step 1: 在 `js/main.js` 中引入存档模块并用恢复结果初始化状态**

将 `js/main.js` 顶部 import 区域补成：

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
const { createBoardScene } = require("./scene/board-scene");
const { createToolbar } = require("./ui/toolbar");
const { getTouchPoint } = require("./utils/touch");
```

把 `boot()` 中的初始状态替换为：

```js
  const restoredSession = loadCurrentGame(createGame(puzzles[0]));
  let game = restoredSession.game;
  let selectedIndex = restoredSession.selectedIndex;
  let noteMode = restoredSession.noteMode;
```

- [x] **Step 2: 在 `boot()` 中增加统一的保存函数**

在 `toolbar` 初始化后追加：

```js
  function persistState() {
    saveCurrentGame({
      game: game,
      selectedIndex: selectedIndex,
      noteMode: noteMode
    });
  }
```

- [x] **Step 3: 运行测试并确认逻辑护栏仍通过**

Run:

```bash
node --test tests/game-engine.test.js
```

Expected:

```text
全部测试通过；因为 boot 在 Node 环境下直接 return，不会触发 wx 依赖错误
```

- [ ] **Step 4: Commit**

```bash
git add js/main.js
git commit -m "feat(game): 接入继续游戏恢复"
```

### Task 4: 在关键交互后自动保存最近状态

**Files:**
- Modify: `js/main.js`
- Test: `tests/game-engine.test.js`

- [x] **Step 1: 为选格、填数和笔记切换接入保存**

将 `wx.onTouchStart` 中相关分支调整为：

```js
    if (hitCellIndex >= 0) {
      selectedIndex = hitCellIndex;
      persistState();
      draw();
      return;
    }

    if (toolbarAction.type === "number" && selectedIndex >= 0) {
      const nextGame = noteMode
        ? toggleCellNote(game, selectedIndex, toolbarAction.value)
        : applyInputValue(game, selectedIndex, toolbarAction.value);

      if (nextGame !== game) {
        game = nextGame;
        persistState();
      }

      draw();
      return;
    }

    if (toolbarAction.type === "tool") {
      if (toolbarAction.value === "note") {
        noteMode = !noteMode;
        persistState();
      }
```

- [x] **Step 2: 为撤销和擦除接入保存**

继续把 `tool` 分支补成：

```js
      if (toolbarAction.value === "undo") {
        const undoResult = undoLastStep(game);

        if (
          undoResult.game !== game ||
          undoResult.selectedIndex !== selectedIndex
        ) {
          game = undoResult.game;
          selectedIndex = undoResult.selectedIndex;
          persistState();
        }
      }

      if (toolbarAction.value === "erase") {
        const nextGame = eraseCellContent(game, selectedIndex, noteMode);

        if (nextGame !== game) {
          game = nextGame;
          persistState();
        }
      }

      draw();
    }
```

- [x] **Step 3: 运行测试并确认通过**

Run:

```bash
node --test tests/game-engine.test.js
```

Expected:

```text
全部测试通过，0 fail
```

- [x] **Step 4: 在微信开发者工具中做继续游戏 smoke test**

Manual checks:

```text
1. 首次启动项目，确认无存档时进入默认题局
2. 选中一个空格并填入数字
3. 打开笔记模式并添加一个候选数
4. 点击撤销一次，确认恢复到上一步
5. 关闭并重新打开小游戏
6. 确认棋盘内容、当前焦点和笔记模式都与退出前一致
7. 再点一次撤销，确认恢复后的局面仍可继续回退
```

Expected:

```text
继续游戏能力正常，恢复后的撤销链仍然可用
```

当前状态：已完成。用户确认手工测试没有问题，继续游戏与恢复后撤销链表现正常。

- [ ] **Step 5: Commit**

```bash
git add js/main.js tests/game-engine.test.js
git commit -m "feat(game): 保存最近对局进度"
```

### Task 5: 回写计划入口并做最终验证

**Files:**
- Modify: `docs/2026-06-04-jiuyu-current-implementation-plan.md`
- Modify: `docs/superpowers/plans/2026-06-04-local-save-implementation.md`
- Test: `tests/game-engine.test.js`

- [x] **Step 1: 在主实施计划中补充当前详细执行工件入口**

将 `docs/2026-06-04-jiuyu-current-implementation-plan.md` 的“当前详细执行工件”补成：

```md
- [小游戏迁移设计](./superpowers/specs/2026-06-04-jiuyu-minigame-migration-design.md)
- [本地存档设计](./superpowers/specs/2026-06-04-jiuyu-local-save-design.md)
- [本地存档实施计划](./superpowers/plans/2026-06-04-local-save-implementation.md)
- [小游戏迁移实施计划](./superpowers/plans/2026-06-04-minigame-migration-implementation.md)
```

- [x] **Step 2: 运行最终自动化验证**

Run:

```bash
node --test tests/game-engine.test.js
```

Expected:

```text
全部测试通过，0 fail
```

- [x] **Step 3: 回写本计划的勾选状态与验证结果**

将已完成步骤从 `- [ ]` 改为 `- [x]`，并保持手工验证步骤的结果描述与实际执行一致。

- [ ] **Step 4: Commit**

```bash
git add docs/2026-06-04-jiuyu-current-implementation-plan.md docs/superpowers/plans/2026-06-04-local-save-implementation.md
git commit -m "docs: 更新本地存档实施计划"
```
