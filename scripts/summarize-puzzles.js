const { puzzles } = require("../js/data/puzzles");

function countGivens(puzzle) {
  return puzzle.puzzle.split("").filter(function (value) {
    return value !== "0";
  }).length;
}

function summarizeDifficulty(difficultyPuzzles) {
  const givens = difficultyPuzzles.map(countGivens);
  const total = givens.reduce(function (sum, value) {
    return sum + value;
  }, 0);
  const min = Math.min.apply(null, givens);
  const max = Math.max.apply(null, givens);
  const average = total / givens.length;

  return {
    count: difficultyPuzzles.length,
    min: min,
    max: max,
    average: average
  };
}

function main() {
  const groups = puzzles.reduce(function (result, puzzle) {
    if (!result[puzzle.difficulty]) {
      result[puzzle.difficulty] = [];
    }

    result[puzzle.difficulty].push(puzzle);
    return result;
  }, {});
  const orderedDifficulties = ["beginner", "intermediate", "skilled", "expert"];

  console.log("Puzzle summary");

  orderedDifficulties.forEach(function (difficulty) {
    const difficultyPuzzles = groups[difficulty] || [];

    if (difficultyPuzzles.length === 0) {
      console.log(difficulty + ": count=0 givens=n/a");
      return;
    }

    const summary = summarizeDifficulty(difficultyPuzzles);
    console.log(
      difficulty +
      ": count=" + summary.count +
      " givens=min " + summary.min +
      ", max " + summary.max +
      ", avg " + summary.average.toFixed(2)
    );
  });

  console.log("Total puzzles: " + puzzles.length);
}

main();
