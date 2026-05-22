const EMPTY_CELL = "";

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

module.exports = {
  createGame
};

