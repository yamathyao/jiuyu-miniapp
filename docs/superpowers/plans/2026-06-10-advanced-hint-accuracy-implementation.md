# Advanced Hint Accuracy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 `skilled / expert` 题建立可校验的高阶提示权威来源，并让 `hint-engine` 优先消费这份元数据，在缺失或非法时安全回退到现有 heuristic。

**Architecture:** 先在题库里为代表性的 4 类高阶技巧补上最小 `hint` 元数据，再把 `game-engine` 的运行时快照扩展为可携带并保留该元数据。接着把 `validate-puzzles.js` 改成“可导出的校验模块 + 仍可直接执行的 CLI”，最后让 `hint-engine` 走“元数据优先、heuristic 回退”的双轨模式，并补齐测试护栏。

**Tech Stack:** WeChat Mini Game、CommonJS、Node `--test`

---

## File Structure

- Modify: `D:\GithubWorkspace\jiuyu-miniapp\js\data\puzzles-skilled.js`
- Modify: `D:\GithubWorkspace\jiuyu-miniapp\js\data\puzzles-expert.js`
- Modify: `D:\GithubWorkspace\jiuyu-miniapp\js\services\game-engine.js`
- Modify: `D:\GithubWorkspace\jiuyu-miniapp\js\services\hint-engine.js`
- Modify: `D:\GithubWorkspace\jiuyu-miniapp\scripts\validate-puzzles.js`
- Modify: `D:\GithubWorkspace\jiuyu-miniapp\tests\game-engine.test.js`
- Modify: `D:\GithubWorkspace\jiuyu-miniapp\docs\superpowers\specs\2026-06-10-jiuyu-advanced-hint-accuracy-design.md`
- Modify: `D:\GithubWorkspace\jiuyu-miniapp\docs\superpowers\plans\2026-06-10-advanced-hint-accuracy-implementation.md`

## Scope Guardrails

- 只加固现有 `naked-pair / box-line-reduction / x-wing / xy-wing`，不扩新技巧。
- `beginner / intermediate` 的提示层级与回答链路保持不变。
- 不把本轮扩张成完整高阶求解器；运行时只做“字段合法性 + 安全回退”，不做完整技巧证明。
- 题库元数据先覆盖代表性样本：每种现有高阶技巧至少 1 题。
- 任一任务完成后，都至少运行一次 `node --test tests/game-engine.test.js`。

## Recommended Execution Order

1. 先让运行时 `game` 快照能携带并保留 `hint` 元数据。
2. 再把题库校验与代表性题目标注补上，锁定静态数据口径。
3. 最后让 `hint-engine` 真正优先吃元数据，并补回退测试。

### Task 1: 让运行时 game 快照保留高阶 hint 元数据

**Files:**
- Modify: `D:\GithubWorkspace\jiuyu-miniapp\js\services\game-engine.js`
- Modify: `D:\GithubWorkspace\jiuyu-miniapp\tests\game-engine.test.js`

- [ ] **Step 1: 为 `createGame()` 和克隆链路写失败测试**

在 `tests/game-engine.test.js` 的 `createGame` 相关用例附近追加：

```js
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
```

- [ ] **Step 2: 运行测试确认当前 `game` 还没有 `hint` 字段**

Run:

```bash
node --test tests/game-engine.test.js
```

Expected:

```text
FAIL
game.hint is undefined
```

- [ ] **Step 3: 在 `game-engine` 里新增 `cloneHintMetadata()`，并让 `createGame()` / `cloneGame()` 都带上 `hint`**

把 `js/services/game-engine.js` 调整成：

```js
function cloneHintMetadata(hint) {
  if (!hint || typeof hint !== "object") {
    return null;
  }

  return {
    primaryTechnique: typeof hint.primaryTechnique === "string"
      ? hint.primaryTechnique
      : "",
    targetIndex: Number.isInteger(hint.targetIndex) ? hint.targetIndex : -1,
    relatedIndexes: Array.isArray(hint.relatedIndexes)
      ? hint.relatedIndexes.slice()
      : [],
    context: hint.context && typeof hint.context === "object"
      ? Object.assign({}, hint.context)
      : null
  };
}

function cloneGame(game) {
  return {
    puzzleId: game.puzzleId,
    difficulty: game.difficulty,
    puzzle: game.puzzle,
    solution: game.solution,
    techniques: Array.isArray(game.techniques) ? game.techniques.slice() : [],
    hint: cloneHintMetadata(game.hint),
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
    techniques: Array.isArray(puzzle.techniques) ? puzzle.techniques.slice() : [],
    hint: cloneHintMetadata(puzzle.hint),
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
```

- [ ] **Step 4: 运行测试确认运行时快照现在会保留高阶 hint 元数据**

Run:

```bash
node --test tests/game-engine.test.js
```

Expected:

```text
PASS
包含 createGame copies advanced hint metadata 与 editable operations keep advanced hint metadata intact
```

- [ ] **Step 5: Commit**

```bash
git add js/services/game-engine.js tests/game-engine.test.js
git commit -m "refactor(game): 让运行时保留高阶提示元数据"
```

### Task 2: 扩展题库校验器并为代表性高阶题补权威标注

**Files:**
- Modify: `D:\GithubWorkspace\jiuyu-miniapp\scripts\validate-puzzles.js`
- Modify: `D:\GithubWorkspace\jiuyu-miniapp\js\data\puzzles-skilled.js`
- Modify: `D:\GithubWorkspace\jiuyu-miniapp\js\data\puzzles-expert.js`
- Modify: `D:\GithubWorkspace\jiuyu-miniapp\tests\game-engine.test.js`

- [ ] **Step 1: 为高阶 hint 元数据校验写失败测试**

在 `tests/game-engine.test.js` 中追加：

```js
const {
  validatePuzzle
} = require("../scripts/validate-puzzles");

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
```

- [ ] **Step 2: 运行测试确认当前脚本无法按模块导入高阶 hint 校验**

Run:

```bash
node --test tests/game-engine.test.js
```

Expected:

```text
FAIL
validatePuzzle is not a function
```

- [ ] **Step 3: 把 `validate-puzzles.js` 重构成“可导出 helper + CLI 入口”，并加入高阶 hint 校验**

把 `scripts/validate-puzzles.js` 改成下面的结构：

```js
const { puzzles } = require("../js/data/puzzles");
const { getRow, getColumn, getBox } = require("../js/utils/sudoku");

const VALID_DIFFICULTIES = {
  beginner: true,
  intermediate: true,
  skilled: true,
  expert: true
};

const VALID_TECHNIQUES = {
  "naked-single": true,
  "hidden-single": true,
  "pointing-pair": true,
  "naked-pair": true,
  "box-line-reduction": true,
  "x-wing": true,
  "xy-wing": true
};

function isGridIndex(value) {
  return Number.isInteger(value) && value >= 0 && value < 81;
}

function validateHintMetadata(puzzle, errors) {
  if (!puzzle.hint) {
    return;
  }

  const hint = puzzle.hint;

  if (typeof hint.primaryTechnique !== "string" || !VALID_TECHNIQUES[hint.primaryTechnique]) {
    errors.push(puzzle.id + ": hint.primaryTechnique must be a supported technique.");
  }

  if (Array.isArray(puzzle.techniques) && puzzle.techniques.indexOf(hint.primaryTechnique) < 0) {
    errors.push(puzzle.id + ": hint.primaryTechnique must be included in techniques.");
  }

  if (!isGridIndex(hint.targetIndex)) {
    errors.push(puzzle.id + ": hint.targetIndex must be an integer from 0 to 80.");
  } else if (puzzle.puzzle[hint.targetIndex] !== "0") {
    errors.push(puzzle.id + ": hint.targetIndex must point to an editable cell.");
  }

  if (!Array.isArray(hint.relatedIndexes)) {
    errors.push(puzzle.id + ": hint.relatedIndexes must be an array.");
  } else {
    const seenRelated = {};

    hint.relatedIndexes.forEach(function (index, relatedIndex) {
      if (!isGridIndex(index)) {
        errors.push(
          puzzle.id + ": hint.relatedIndexes[" + relatedIndex + "] must be an integer from 0 to 80."
        );
        return;
      }

      if (index === hint.targetIndex) {
        errors.push(puzzle.id + ": hint.relatedIndexes cannot contain targetIndex.");
      }

      if (seenRelated[index]) {
        errors.push(puzzle.id + ": hint.relatedIndexes cannot contain duplicates.");
      }

      seenRelated[index] = true;
    });
  }

  if (hint.context != null && (typeof hint.context !== "object" || Array.isArray(hint.context))) {
    errors.push(puzzle.id + ": hint.context must be an object when provided.");
  }
}

function validatePuzzle(puzzle, seenIds, errors) {
  // 保留原有校验内容
  validateHintMetadata(puzzle, errors);
}

function main() {
  // 保留原有 CLI 行为
}

if (require.main === module) {
  main();
}

module.exports = {
  VALID_DIFFICULTIES,
  VALID_TECHNIQUES,
  validatePuzzle
};
```

- [ ] **Step 4: 为每种高阶技巧各补 1 道代表性题目的 `hint` 元数据**

在 `js/data/puzzles-skilled.js` 里把代表性样本改成：

```js
{
  id: "skilled-001",
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
},
{
  id: "skilled-002",
  difficulty: "skilled",
  puzzle: "030000000000500003097030000800005007070080010900700008000020870200007000000000050",
  solution: "435269781682571493197834562826195347374682915951743628519326874248957136763418259",
  techniques: ["naked-pair", "box-line-reduction"],
  hint: {
    primaryTechnique: "box-line-reduction",
    targetIndex: 0,
    relatedIndexes: [9, 18],
    context: {
      pattern: "box-line"
    }
  }
}
```

在 `js/data/puzzles-expert.js` 里把代表性样本改成：

```js
{
  id: "expert-001",
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
},
{
  id: "expert-002",
  difficulty: "expert",
  puzzle: "000000032000000008002800000040060000000000000000090040000002700500000000420000000",
  solution: "814976532659123478732854169948265317275341896163798245391682754587439621426517983",
  techniques: ["x-wing", "xy-wing"],
  hint: {
    primaryTechnique: "xy-wing",
    targetIndex: 55,
    relatedIndexes: [56, 54],
    context: {
      pattern: "pivot-wing"
    }
  }
}
```

- [ ] **Step 5: 运行题库脚本与测试，确认高阶元数据现在会被静态校验**

Run:

```bash
node scripts/validate-puzzles.js
node --test tests/game-engine.test.js
```

Expected:

```text
Puzzle validation passed for 40 puzzles.
PASS
包含 validatePuzzle reports invalid advanced hint metadata
```

- [ ] **Step 6: Commit**

```bash
git add scripts/validate-puzzles.js js/data/puzzles-skilled.js js/data/puzzles-expert.js tests/game-engine.test.js
git commit -m "test(puzzle): 为高阶提示元数据补校验护栏"
```

### Task 3: 让 hint-engine 优先消费权威元数据并保留安全回退

**Files:**
- Modify: `D:\GithubWorkspace\jiuyu-miniapp\js\services\hint-engine.js`
- Modify: `D:\GithubWorkspace\jiuyu-miniapp\tests\game-engine.test.js`

- [ ] **Step 1: 为“元数据优先、heuristic 回退”写失败测试**

在 `tests/game-engine.test.js` 中追加：

```js
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
    return puzzle.id === "skilled-003";
  });
  const game = createGame(skilledPuzzle);
  const hint = getNextHint(game, "skilled", {
    currentLevel: null,
    targetIndex: -1,
    relatedIndexes: []
  });

  assert.equal(hint.technique, "naked-pair");
  assert.equal(hint.targetIndex, 9);
});

test("getNextHint falls back safely when advanced metadata points at a given cell", function () {
  const expertPuzzle = puzzles.find(function (puzzle) {
    return puzzle.id === "expert-001";
  });
  const brokenGame = createGame(Object.assign({}, expertPuzzle, {
    hint: {
      primaryTechnique: "x-wing",
      targetIndex: 6,
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
```

- [ ] **Step 2: 运行测试确认当前 `hint-engine` 还没有元数据优先逻辑**

Run:

```bash
node --test tests/game-engine.test.js
```

Expected:

```text
FAIL
expected metadata targetIndex 0 but received heuristic target
```

- [ ] **Step 3: 在 `hint-engine` 中新增元数据 seed helper，并在高阶题上优先使用它**

把 `js/services/hint-engine.js` 的高阶路径整理成：

```js
function isEditableIndex(game, index) {
  return Number.isInteger(index) &&
    index >= 0 &&
    index < game.cells.length &&
    !game.cells[index].given &&
    !game.cells[index].value;
}

function getAdvancedHintSeed(game) {
  const hint = game && game.hint;

  if (!hint || typeof hint.primaryTechnique !== "string") {
    return null;
  }

  if (!isEditableIndex(game, hint.targetIndex)) {
    return null;
  }

  const relatedIndexes = Array.isArray(hint.relatedIndexes)
    ? hint.relatedIndexes.filter(function (index) {
        return Number.isInteger(index) &&
          index >= 0 &&
          index < game.cells.length &&
          index !== hint.targetIndex;
      })
    : [];

  return {
    technique: hint.primaryTechnique,
    targetIndex: hint.targetIndex,
    relatedIndexes: relatedIndexes,
    context: hint.context && typeof hint.context === "object"
      ? Object.assign({}, hint.context)
      : null
  };
}

function getNextHint(game, difficulty, hintState, t) {
  const policy = getDifficultyPolicy(difficulty);
  const advancedSeed = (difficulty === "skilled" || difficulty === "expert")
    ? getAdvancedHintSeed(game)
    : null;
  const technique = advancedSeed
    ? advancedSeed.technique
    : Array.isArray(game.techniques) && game.techniques.length > 0
      ? game.techniques[0]
      : "naked-single";
  const targetIndex = advancedSeed
    ? advancedSeed.targetIndex
    : findHintTarget(game, technique);
  const relatedIndexes = advancedSeed
    ? advancedSeed.relatedIndexes
    : getRelatedIndexesByTechnique(game, targetIndex, technique);
  const currentLevelIndex = hintState.currentLevel
    ? policy.hintLevels.indexOf(hintState.currentLevel)
    : -1;
  const safeCurrentLevelIndex = currentLevelIndex >= 0 ? currentLevelIndex : -1;
  const nextLevelIndex = (safeCurrentLevelIndex + 1) % policy.hintLevels.length;
  const level = policy.hintLevels[nextLevelIndex];
  const value = game.solution[targetIndex];
  const hintMeta = {
    row: String(getRow(targetIndex) + 1),
    column: String(getColumn(targetIndex) + 1),
    box: String(getBox(targetIndex) + 1),
    value: value,
    technique: formatTechniqueLabel(technique),
    techniqueKey: technique
  };

  return {
    level: level,
    technique: technique,
    message: buildHintMessage(level, difficulty, hintMeta, t),
    targetIndex: targetIndex,
    relatedIndexes: relatedIndexes,
    progress: {
      current: nextLevelIndex + 1,
      total: policy.hintLevels.length
    },
    value: value
  };
}
```

- [ ] **Step 4: 补一条 technique 文案对齐断言，锁定不再默认吃 `techniques[0]`**

在 `tests/game-engine.test.js` 追加：

```js
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
  assert.equal(hint.message, "技巧提示：XY-Wing。先看互相牵制的枢纽格。");
});
```

- [ ] **Step 5: 运行完整验证，确认高阶提示已切到“元数据优先 + 安全回退”**

Run:

```bash
node scripts/validate-puzzles.js
node --test tests/game-engine.test.js
node scripts/summarize-puzzles.js
```

Expected:

```text
Puzzle validation passed for 40 puzzles.
PASS
expert: count=10
```

- [ ] **Step 6: Commit**

```bash
git add js/services/hint-engine.js tests/game-engine.test.js
git commit -m "feat(hint): 优先消费高阶提示权威元数据"
```
