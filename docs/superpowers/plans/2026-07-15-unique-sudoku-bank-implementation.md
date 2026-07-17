# Unique Sudoku Bank Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Require exactly one solution for every shipped Sudoku puzzle while retaining all 60 puzzle records.

**Architecture:** Extend the offline validator with a bounded backtracking solver that stops after a second solution. Repair only puzzle clue strings, keeping IDs, canonical solutions, difficulty labels, and advanced hint targets intact. Update the puzzle-bank regression assertions to reflect the minimum 17-given requirement for uniquely solvable 9x9 Sudoku.

**Tech Stack:** Node.js built-in test runner, CommonJS, offline JavaScript scripts.

---

### Task 1: Add a Unique-Solution Validator

**Files:**
- Modify: `scripts/validate-puzzles.js`
- Test: `tests/game-engine.test.js`

- [x] **Step 1: Write failing tests for a known ambiguous grid and a known unique grid**

```javascript
assert.equal(countSolutions("000000000000000000000000000000000000000000000000000000000000000000000000000000000"), 2);
assert.equal(countSolutions(puzzles[0].puzzle), 1);
```

- [x] **Step 2: Run the focused test and confirm the missing export fails**

Run: `node --test --test-name-pattern="solution count" tests/game-engine.test.js`

- [x] **Step 3: Implement a bounded MRV backtracking `countSolutions(grid, limit)` helper**

```javascript
function countSolutions(grid, limit) {
  // Select the empty cell with the fewest candidates, recurse, and stop at limit.
}
```

- [x] **Step 4: Validate each syntactically valid puzzle has exactly one solution**

```javascript
if (countSolutions(puzzle.puzzle, 2) !== 1) {
  errors.push(puzzle.id + ": puzzle must have exactly one solution.");
}
```

- [x] **Step 5: Re-run the focused test and confirm it passes**

Run: `node --test --test-name-pattern="solution count" tests/game-engine.test.js`

### Task 2: Repair Multi-Solution Puzzle Clues

**Files:**
- Modify: `js/data/puzzles-beginner.js`
- Modify: `js/data/puzzles-intermediate.js`
- Modify: `js/data/puzzles-skilled.js`
- Modify: `js/data/puzzles-expert.js`
- Test: `tests/game-engine.test.js`

- [x] **Step 1: Compute canonical-solution clue additions for every ambiguous record**

For each record, only replace `0` with the matching digit from its registered `solution`, avoid `hint.targetIndex`, and retain the existing `id`, `difficulty`, `solution`, and hint metadata.

- [x] **Step 2: Apply the computed clue strings and assert the full bank has one solution per record**

```javascript
puzzles.forEach(function (puzzle) {
  assert.equal(countSolutions(puzzle.puzzle, 2), 1, puzzle.id);
});
```

- [x] **Step 3: Update the expert-givens assertion to enforce the unique-Sudoku floor**

```javascript
assert.ok(Math.min.apply(null, expertGivens) >= 17);
```

- [x] **Step 4: Run the full test suite and validator**

Run: `node --test tests/game-engine.test.js`
Run: `node scripts/validate-puzzles.js`

### Task 3: Verify Distribution and Existing Foreground Recovery Fix

**Files:**
- Verify: `scripts/summarize-puzzles.js`
- Verify: `js/main.js`

- [x] **Step 1: Run the puzzle summary and review counts, givens, and structure clusters**

Run: `node scripts/summarize-puzzles.js`

- [x] **Step 2: Run whitespace and change-scope checks**

Run: `git diff --check`
Run: `git diff -- js/main.js scripts/validate-puzzles.js js/data tests/game-engine.test.js`
