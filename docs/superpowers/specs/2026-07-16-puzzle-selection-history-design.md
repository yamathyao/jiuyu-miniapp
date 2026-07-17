# Puzzle Selection History Design

## Goal

Keep normal games and exams varied across miniapp restarts without changing the
existing difficulty, reward, or exam-unlock rules.

## Chosen Behavior

- Normal games choose from puzzles not yet completed at that difficulty first.
  Completed puzzles remain eligible only after the uncompleted pool is empty.
- Exams choose uniformly at random from the same preferred pool.
- A passed exam or a normal completed game records that puzzle as completed.
- A timed-out exam does not record the puzzle as completed. It records the
  puzzle as the most recent exam attempt for that difficulty.
- The next exam at that difficulty excludes the most recent attempted puzzle
  when at least one other candidate exists. This makes the immediate repeat
  probability zero while keeping the question eligible later.
- When every puzzle at a difficulty has been completed, selection falls back to
  the full difficulty pool. The recent-exam exclusion still applies when
  possible.

## Data Model

Persist a new `jiuyu.puzzleSelectionHistory` record separate from normal
progress and current-game storage:

```js
{
  completedPuzzleIdsByDifficulty: {
    beginner: [],
    intermediate: [],
    skilled: [],
    expert: []
  },
  recentExamPuzzleIdsByDifficulty: {
    beginner: [],
    intermediate: [],
    skilled: [],
    expert: []
  }
}
```

Each recent-exam array retains at most one puzzle ID. On load, unknown IDs,
wrong-difficulty IDs, duplicates, and malformed data are discarded. Existing
installs without the record receive an empty history.

## Selection Service

Create a pure selection service with these responsibilities:

- Normalize persisted history against the current puzzle bank.
- Select the next normal-game puzzle from unfinished puzzles, using the
  existing in-memory order only as a deterministic tie-breaker.
- Select an exam puzzle uniformly at random from unfinished puzzles after
  excluding the one-item recent-exam cooldown where possible.
- Record normal completion and exam pass as completion history.
- Record timed-out exams as recent exam attempts only.

The main entry remains responsible for deciding whether a run completed,
passed, or timed out, then persists the returned history.

## Compatibility And Edge Cases

- New puzzle IDs are automatically treated as unfinished.
- Removed or invalid IDs are ignored during normalization.
- A difficulty with one puzzle can repeat it because exclusion would otherwise
  leave no candidate.
- Foundation lessons remain outside this system because they already have
  separate ordered progress.
- Existing ordinary progress, score, statistics, and exam records remain
  unchanged.

## Verification

- Unit tests cover normalization, completion priority, random-exam candidate
  sets, one-item cooldown, and full-bank fallback.
- Main-entry tests cover normal completion persistence, timed-out exam
  persistence, and restart behavior using saved selection history.
- Run the full game test suite and puzzle validation after implementation.
