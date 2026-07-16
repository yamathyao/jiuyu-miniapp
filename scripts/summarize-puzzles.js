const { puzzles } = require("../js/data/puzzles");
const {
  groupPuzzlesByDifficulty,
  summarizeStructureClusters
} = require("./puzzle-structure");

function countGivens(puzzle) {
  return puzzle.puzzle.split("").filter(function (value) {
    return value !== "0";
  }).length;
}

function countHintCoverage(difficultyPuzzles) {
  return difficultyPuzzles.filter(function (puzzle) {
    return !!puzzle.hint;
  }).length;
}

function countDuplicatePuzzles(difficultyPuzzles) {
  const seen = {};

  difficultyPuzzles.forEach(function (puzzle) {
    const key = String(puzzle.puzzle || "");
    seen[key] = (seen[key] || 0) + 1;
  });

  return Object.keys(seen).reduce(function (count, key) {
    return seen[key] > 1 ? count + (seen[key] - 1) : count;
  }, 0);
}

function summarizeDifficulty(difficultyPuzzles) {
  const givens = difficultyPuzzles.map(countGivens);
  const total = givens.reduce(function (sum, value) {
    return sum + value;
  }, 0);
  const min = Math.min.apply(null, givens);
  const max = Math.max.apply(null, givens);
  const average = total / givens.length;
  const hintCoverage = countHintCoverage(difficultyPuzzles);
  const duplicatePuzzles = countDuplicatePuzzles(difficultyPuzzles);
  const structureSummary = summarizeStructureClusters(difficultyPuzzles);

  return {
    count: difficultyPuzzles.length,
    min: min,
    max: max,
    average: average,
    hintCoverage: hintCoverage,
    duplicatePuzzles: duplicatePuzzles,
    normalizedUnique: structureSummary.normalizedUnique,
    structureClusters: structureSummary.clusters.map(function (cluster) {
      return cluster.size + "[" + cluster.ids.join(",") + "]";
    }).join(" | ")
  };
}

function main() {
  const groups = groupPuzzlesByDifficulty(puzzles);
  const orderedDifficulties = ["foundation", "beginner", "intermediate", "skilled", "expert"];

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
      ", avg " + summary.average.toFixed(2) +
      " hintCoverage=" + summary.hintCoverage + "/" + summary.count +
      " duplicatePuzzles=" + summary.duplicatePuzzles +
      " normalizedUnique=" + summary.normalizedUnique +
      " structureClusters=" + summary.structureClusters
    );
  });

  console.log("Total puzzles: " + puzzles.length);
}

main();
