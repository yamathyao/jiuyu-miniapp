# Puzzle Selection History Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist puzzle completion and the last timed-out exam question so normal play avoids completed puzzles and immediate exam retries never repeat the timed-out question when alternatives exist.

**Architecture:** A pure selection-history service owns normalized history, candidate pools, and recording operations. Storage persists that service's data under its own key. `main.js` selects normal and exam puzzles through the service, records successful completions, and records only timed-out exam attempts as a one-item cooldown.

**Tech Stack:** WeChat Minigame Canvas, CommonJS, Node.js built-in test runner.

---

### Task 1: Pure Selection History Service

**Files:**
- Create: `js/services/puzzle-selection-service.js`
- Modify: `tests/game-engine.test.js`

- [ ] **Step 1: Write failing pure-service tests**

```javascript
const history = createEmptyPuzzleSelectionHistory();
const completed = recordPuzzleCompletion(history, "beginner-001", puzzles);
assert.deepEqual(completed.completedPuzzleIdsByDifficulty.beginner, ["beginner-001"]);
assert.equal(selectNormalPuzzle(puzzles, "beginner", completed, {}).id, "beginner-002");

const timedOut = recordTimedOutExam(completed, "beginner-002", puzzles);
const examPuzzle = selectExamPuzzle(puzzles, "beginner", timedOut, function () { return 0; });
assert.notEqual(examPuzzle.id, "beginner-002");
```

Also cover malformed and wrong-difficulty IDs being removed by normalization, full-bank normal fallback, and a one-puzzle pool retaining its only exam candidate.

- [ ] **Step 2: Verify the focused tests fail**

Run: `node --test --test-name-pattern="puzzle selection history" tests/game-engine.test.js`

Expected: failure because the selection-history service does not yet exist.

- [ ] **Step 3: Implement immutable normalized history and candidate selection**

```javascript
function createEmptyPuzzleSelectionHistory() {
  return {
    completedPuzzleIdsByDifficulty: createDifficultyRecord(),
    recentExamPuzzleIdsByDifficulty: createDifficultyRecord()
  };
}

function selectExamPuzzle(puzzles, difficulty, history, random) {
  const candidates = getPreferredCandidates(puzzles, difficulty, history);
  const recentId = normalized.recentExamPuzzleIdsByDifficulty[difficulty][0];
  const cooledCandidates = candidates.filter(function (puzzle) {
    return puzzle.id !== recentId;
  });
  const pool = cooledCandidates.length > 0 ? cooledCandidates : candidates;
  return pool[Math.floor((random || Math.random)() * pool.length)];
}
```

Use only normal difficulties (`beginner`, `intermediate`, `skilled`, `expert`), discard invalid IDs against the supplied puzzle bank, preserve bank order for normal selection, and cap each recent-exam list at one ID.

- [ ] **Step 4: Verify the focused tests pass**

Run: `node --test --test-name-pattern="puzzle selection history" tests/game-engine.test.js`

Expected: all selection-history tests pass.

### Task 2: Persist Selection History Independently

**Files:**
- Modify: `js/services/storage.js`
- Modify: `tests/game-engine.test.js`

- [ ] **Step 1: Write failing storage tests**

```javascript
assert.deepEqual(loadPuzzleSelectionHistory(puzzles, emptyApi), createEmptyPuzzleSelectionHistory());
assert.equal(savePuzzleSelectionHistory({
  completedPuzzleIdsByDifficulty: { beginner: ["beginner-001"] },
  recentExamPuzzleIdsByDifficulty: { beginner: ["beginner-002"] }
}, puzzles, api), true);
assert.equal(writes[0][0], STORAGE_KEYS.puzzleSelectionHistory);
```

- [ ] **Step 2: Verify the tests fail**

Run: `node --test --test-name-pattern="selection history storage" tests/game-engine.test.js`

Expected: failure because the storage key and helper functions do not exist.

- [ ] **Step 3: Add storage key and normalized load/save helpers**

```javascript
const STORAGE_KEYS = {
  // existing keys
  puzzleSelectionHistory: "jiuyu.puzzleSelectionHistory"
};

function loadPuzzleSelectionHistory(puzzles, storageApi) {
  return normalizePuzzleSelectionHistory(
    readStorage(STORAGE_KEYS.puzzleSelectionHistory, null, storageApi),
    puzzles
  );
}
```

Do not modify existing `progress`, `stats`, `currentGame`, or tutorial-progress payloads.

- [ ] **Step 4: Verify the storage tests pass**

Run: `node --test --test-name-pattern="selection history storage" tests/game-engine.test.js`

Expected: all storage tests pass.

### Task 3: Wire Normal And Exam Selection Into The Main Flow

**Files:**
- Modify: `js/main.js`
- Modify: `tests/game-engine.test.js`

- [ ] **Step 1: Write failing main-entry tests**

```javascript
assert.equal(savedSelectionHistory.completedPuzzleIdsByDifficulty.beginner.includes(completedPuzzle.id), true);
assert.equal(savedSelectionHistory.recentExamPuzzleIdsByDifficulty.beginner[0], timedOutExamPuzzle.id);
assert.notEqual(restartedExamPuzzle.id, timedOutExamPuzzle.id);
```

Use the existing mocked `wx` storage harness. Test a normal completion, an exam timeout, and a second boot using the saved selection history.

- [ ] **Step 2: Verify the tests fail**

Run: `node --test --test-name-pattern="selection history main entry" tests/game-engine.test.js`

Expected: failure because main still uses the transient `puzzleCursorByDifficulty` for normal and exam selection.

- [ ] **Step 3: Load, select, and record through the new service**

```javascript
let puzzleSelectionHistory = loadPuzzleSelectionHistory(puzzles);

function persistPuzzleSelectionHistory() {
  savePuzzleSelectionHistory(puzzleSelectionHistory, puzzles);
}

function selectNormalGamePuzzle(difficulty) {
  return selectNormalPuzzle(puzzles, difficulty, puzzleSelectionHistory, puzzleCursorByDifficulty);
}
```

Use `selectNormalGamePuzzle` from normal-game starts, settings difficulty changes, and post-exam return. Use `selectExamPuzzle` from `startExamGame`. In `openCompletionState`, record `game.puzzleId` only when the run is normal or the active exam passed. At the timeout branch in `advanceElapsedTime`, record `game.puzzleId` as the recent exam question before persisting progress. Keep foundation lessons outside this flow.

- [ ] **Step 4: Verify the main-entry tests pass**

Run: `node --test --test-name-pattern="selection history main entry" tests/game-engine.test.js`

Expected: normal completions persist, timed-out exams persist one cooldown ID, and a restarted app chooses another exam puzzle when the bank has alternatives.

### Task 4: Full Regression Verification

**Files:**
- Modify: `docs/superpowers/specs/2026-07-16-puzzle-selection-history-design.md` only if implementation exposes a documented mismatch.

- [ ] **Step 1: Run the complete test suite**

Run: `node --test tests/game-engine.test.js`

Expected: all tests pass.

- [ ] **Step 2: Validate the full puzzle bank**

Run: `node scripts/validate-puzzles.js`

Expected: `Puzzle validation passed for 63 puzzles.`

- [ ] **Step 3: Check patch whitespace**

Run: `git diff --check`

Expected: exit code 0.

- [ ] **Step 4: Leave changes uncommitted unless the user explicitly requests a commit**
