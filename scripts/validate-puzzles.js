const { puzzles } = require("../js/data/puzzles");
const { getRow, getColumn, getBox } = require("../js/utils/sudoku");

const VALID_DIFFICULTIES = {
  beginner: true,
  intermediate: true,
  skilled: true,
  expert: true
};

function isDigitString(value) {
  return typeof value === "string" && /^[0-9]+$/.test(value);
}

function validateGridCharacters(label, value, errors) {
  if (!isDigitString(value)) {
    errors.push(label + " must contain digits only.");
    return false;
  }

  if (value.length !== 81) {
    errors.push(label + " must be exactly 81 characters.");
    return false;
  }

  return true;
}

function validateSolutionUnits(puzzle, errors) {
  for (let index = 0; index < 81; index += 1) {
    const value = puzzle.solution[index];

    if (value === "0") {
      errors.push(puzzle.id + ": solution cannot contain 0.");
      return;
    }

    for (let compareIndex = index + 1; compareIndex < 81; compareIndex += 1) {
      if (puzzle.solution[compareIndex] !== value) {
        continue;
      }

      if (
        getRow(index) === getRow(compareIndex) ||
        getColumn(index) === getColumn(compareIndex) ||
        getBox(index) === getBox(compareIndex)
      ) {
        errors.push(
          puzzle.id + ": solution repeats value " + value +
          " across related cells " + index + " and " + compareIndex + "."
        );
        return;
      }
    }
  }
}

function validatePuzzle(puzzle, seenIds, errors) {
  if (!puzzle || typeof puzzle !== "object") {
    errors.push("Puzzle entry must be an object.");
    return;
  }

  if (!puzzle.id || typeof puzzle.id !== "string") {
    errors.push("Puzzle entry is missing a string id.");
  } else if (seenIds[puzzle.id]) {
    errors.push(puzzle.id + ": duplicate id.");
  } else {
    seenIds[puzzle.id] = true;
  }

  if (!VALID_DIFFICULTIES[puzzle.difficulty]) {
    errors.push((puzzle.id || "unknown") + ": invalid difficulty " + String(puzzle.difficulty) + ".");
  }

  const puzzleIsValid = validateGridCharacters((puzzle.id || "unknown") + ": puzzle", puzzle.puzzle, errors);
  const solutionIsValid = validateGridCharacters((puzzle.id || "unknown") + ": solution", puzzle.solution, errors);

  if (!Array.isArray(puzzle.techniques) || puzzle.techniques.length === 0) {
    errors.push((puzzle.id || "unknown") + ": techniques must be a non-empty array.");
  }

  if (!puzzleIsValid || !solutionIsValid) {
    return;
  }

  for (let index = 0; index < 81; index += 1) {
    const given = puzzle.puzzle[index];
    const solved = puzzle.solution[index];

    if (given !== "0" && given !== solved) {
      errors.push(
        puzzle.id + ": puzzle and solution mismatch at index " + index +
        " (given " + given + ", solution " + solved + ")."
      );
      break;
    }
  }

  validateSolutionUnits(puzzle, errors);
}

function main() {
  const errors = [];
  const seenIds = {};

  if (!Array.isArray(puzzles) || puzzles.length === 0) {
    errors.push("Puzzle bank must export a non-empty array.");
  } else {
    puzzles.forEach(function (puzzle) {
      validatePuzzle(puzzle, seenIds, errors);
    });
  }

  if (errors.length > 0) {
    console.error("Puzzle validation failed:");
    errors.forEach(function (error) {
      console.error("- " + error);
    });
    process.exit(1);
  }

  console.log("Puzzle validation passed for " + puzzles.length + " puzzles.");
}

main();
