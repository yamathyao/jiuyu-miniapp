# Tutorial Scene Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align the zero-basics tutorial with the established Jiuyu visual system and place it ahead of beginner selection.

**Architecture:** Keep the tutorial state machine unchanged. Limit changes to the tutorial scene's metrics and rendering helpers plus home difficulty ordering; cover visual contracts with canvas-text and hit-test tests.

**Tech Stack:** WeChat Minigame Canvas, CommonJS, Node.js built-in test runner.

---

### Task 1: Lock The Tutorial Scene Visual Contracts

**Files:**
- Modify: `tests/game-engine.test.js`
- Modify: `js/scene/tutorial-scene.js`

- [ ] Write failing tests asserting `cardTop` stays below the 32-pixel safe area, title/back actions never render `[object Object]`, and course cards retain their lesson hit targets.
- [ ] Run: `node --test --test-name-pattern="tutorial scene" tests/game-engine.test.js`
- [ ] Rebuild the scene with home-aligned metrics, explicit plaque labels/styles, and shared rounded-card treatments using an olive-teal tutorial accent.
- [ ] Re-run the focused test until it passes.

### Task 2: Put Foundation Before Beginner

**Files:**
- Modify: `js/scene/home-scene.js`
- Modify: `tests/game-engine.test.js`

- [ ] Write a failing test that the initial choice's first card returns `{ type: "difficulty", value: "foundation" }` and beginner follows it as the first exam choice.
- [ ] Run: `node --test --test-name-pattern="foundation before beginner" tests/game-engine.test.js`
- [ ] Order foundation before beginner while retaining four normal exam difficulties and their existing lock policy.
- [ ] Re-run the focused test until it passes.

### Task 3: Regression Verification

**Files:**
- Modify: no additional production files.

- [ ] Run: `node --test tests/game-engine.test.js`
- [ ] Run: `git diff --check`
- [ ] Leave changes uncommitted unless explicitly requested.
