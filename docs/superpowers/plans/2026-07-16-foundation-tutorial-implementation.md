# Foundation Tutorial Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a three-lesson, zero-reward Sudoku teaching mode that guides every permitted move and unlocks lessons in sequence.

**Architecture:** Keep tutorial data and step validation in dedicated modules. Store tutorial progress separately from normal unlock progress, and carry the active lesson plus step index in the existing saved-session payload. The main entry coordinates tutorial actions while board and home rendering receive declarative tutorial state.

**Tech Stack:** WeChat Minigame Canvas, CommonJS, Node.js built-in test runner.

---

### Task 1: Tutorial Data And Step Rules

**Files:**
- Create: `js/data/puzzles-foundation.js`
- Modify: `js/data/puzzles.js`
- Create: `js/services/tutorial-service.js`
- Test: `tests/game-engine.test.js`

- [ ] **Step 1: Write failing tests for lesson order and step validation**

```javascript
const progress = createEmptyTutorialProgress();
assert.equal(isLessonUnlocked(progress, "foundation-001"), true);
assert.equal(isLessonUnlocked(progress, "foundation-002"), false);
assert.equal(validateTutorialInput(lesson, game, 0, 40, "5").status, "correct");
assert.equal(validateTutorialInput(lesson, game, 0, 40, "4").status, "incorrect");
```

- [ ] **Step 2: Run the focused test and verify missing tutorial exports fail**

Run: `node --test --test-name-pattern="tutorial lesson" tests/game-engine.test.js`

- [ ] **Step 3: Add three unique foundation puzzles and ordered step metadata**

Each record uses `id` values `foundation-001` through `foundation-003`, `difficulty: "foundation"`, an 81-digit unique-solution grid, its matching 81-digit solution, and ordered `tutorialSteps` metadata. The authored grids are accepted only when `node scripts/validate-puzzles.js` reports one solution and every step target is an editable cell; every step value is read from `solution[targetIndex]`.

- [ ] **Step 4: Implement pure tutorial helpers**

```javascript
function validateTutorialInput(lesson, game, stepIndex, index, value) {
  // Return a status based on the current step target and solution value without mutating the game.
}

function completeTutorialLesson(progress, lessonId) {
  // Return the next immutable course progress with the completed ID added once.
}
```

- [ ] **Step 5: Run tutorial-service tests and puzzle validation**

Run: `node --test --test-name-pattern="tutorial lesson" tests/game-engine.test.js`
Run: `node scripts/validate-puzzles.js`

### Task 2: Separate Tutorial Persistence

**Files:**
- Modify: `js/services/storage.js`
- Test: `tests/game-engine.test.js`

- [ ] **Step 1: Write failing storage compatibility tests**

```javascript
assert.deepEqual(loadTutorialProgress(emptyApi), createEmptyTutorialProgress());
assert.equal(saveTutorialProgress({ completedLessonIds: ["foundation-001"] }, api), true);
```

- [ ] **Step 2: Add `jiuyu.tutorialProgress` storage and payload normalization**

```javascript
const STORAGE_KEYS = {
  // existing keys
  tutorialProgress: "jiuyu.tutorialProgress"
};
```

Current-game sessions gain an optional `tutorialState: { lessonId, stepIndex }` field; existing saves without it remain valid.

- [ ] **Step 3: Run storage tests**

Run: `node --test --test-name-pattern="tutorial progress|saved session" tests/game-engine.test.js`

### Task 3: Home And Settings Course Entry

**Files:**
- Modify: `js/scene/home-scene.js`
- Modify: `js/scene/settings-scene.js`
- Modify: `js/i18n/locales.js`
- Test: `tests/game-engine.test.js`

- [ ] **Step 1: Write failing scene tests for the always-available foundation entry and sequential course cards**

```javascript
const action = homeScene.hitTest(metrics.foundationLeft + 10, metrics.foundationTop + 10, state);
assert.deepEqual(action, { type: "action", value: "open-tutorial" });
assert.equal(homeScene.getLessonState(state, "foundation-002").locked, true);
```

- [ ] **Step 2: Add localized labels and fixed course-card hit areas**

The home difficulty picker keeps `beginner` selected by default; a separate foundation entry opens the course list and never uses normal difficulty lock state.

- [ ] **Step 3: Run scene and locale tests**

Run: `node --test --test-name-pattern="foundation entry|course cards|locale" tests/game-engine.test.js`

### Task 4: Tutorial State Machine And Board Rendering

**Files:**
- Modify: `js/main.js`
- Modify: `js/scene/board-scene.js`
- Modify: `js/ui/toolbar.js`
- Test: `tests/game-engine.test.js`

- [ ] **Step 1: Write failing entry tests for correct, incorrect, and blocked tutorial input**

```javascript
assert.equal(savedSession.tutorialState.stepIndex, 1);
assert.equal(savedSession.noteMode, false);
assert.equal(savedSession.game.cells[targetIndex].value, expectedValue);
```

- [ ] **Step 2: Load lesson progress and start or resume `foundation` sessions in `main.js`**

Set `selectedIndex` to the current step target, force note mode off, and pass tutorial target plus related indexes to `buildBoardView`.

- [ ] **Step 3: Restrict tutorial input and remove normal tool actions**

Only the current target accepts number input. Incorrect values keep the board unchanged and show the localized explanation; note, hint, check, erase, and undo are hidden or ignored in tutorial sessions.

- [ ] **Step 4: Render the teaching explanation and sequential completion**

`board-scene.js` renders the current explanation in the feedback area. On a correct step, persist the next step; on the final step, persist course progress and show the graduation completion card.

- [ ] **Step 5: Run focused interaction tests**

Run: `node --test --test-name-pattern="tutorial input|tutorial completion|tutorial resume" tests/game-engine.test.js`

### Task 5: Graduation And Reward Isolation

**Files:**
- Modify: `js/main.js`
- Modify: `js/scene/board-scene.js`
- Modify: `js/i18n/locales.js`
- Test: `tests/game-engine.test.js`

- [ ] **Step 1: Write failing completion tests**

```javascript
assert.equal(savedProgress.totalPoints, previousPoints);
assert.equal(savedStats.totalCompleted, previousStats.totalCompleted);
assert.ok(texts.includes("进入新手局"));
```

- [ ] **Step 2: Add foundation completion actions**

The final lesson presents `start-beginner` and `replay-tutorial`; normal stats, streaks, points, unlocks, and exams are skipped.

- [ ] **Step 3: Run full verification**

Run: `node --test tests/game-engine.test.js`
Run: `node scripts/validate-puzzles.js`
Run: `node scripts/summarize-puzzles.js`
Run: `git diff --check`
