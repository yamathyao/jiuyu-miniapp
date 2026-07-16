const { puzzles } = require("../js/data/puzzles");
const { getRow, getColumn, getBox } = require("../js/utils/sudoku");
const { countSolutions } = require("./sudoku-solver");
const {
  STRUCTURE_MINIMUMS,
  groupPuzzlesByDifficulty,
  findStructureShortfalls
} = require("./puzzle-structure");

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

function isDigitString(value) {
  return typeof value === "string" && /^[0-9]+$/.test(value);
}

function isGridIndex(value) {
  return Number.isInteger(value) && value >= 0 && value < 81;
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

function validateHintMetadata(puzzle, errors) {
  if (!puzzle.hint) {
    if (puzzle.difficulty === "skilled" || puzzle.difficulty === "expert") {
      errors.push(puzzle.id + ": advanced puzzles must provide hint metadata.");
    }
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
  if (countSolutions(puzzle.puzzle, 2) !== 1) {
    errors.push(puzzle.id + ": puzzle must have exactly one solution.");
  }
  validateHintMetadata(puzzle, errors);
}

function validatePuzzleBank(sourcePuzzles) {
  const errors = [];
  const seenIds = {};
  const seenDifficultyPuzzles = {};

  if (!Array.isArray(sourcePuzzles) || sourcePuzzles.length === 0) {
    errors.push("Puzzle bank must export a non-empty array.");
    return errors;
  }

  sourcePuzzles.forEach(function (puzzle) {
    if (puzzle && typeof puzzle === "object") {
      const difficultyKey = String(puzzle.difficulty || "unknown");
      const puzzleKey = String(puzzle.puzzle || "");
      const duplicateKey = difficultyKey + "::" + puzzleKey;

      if (seenDifficultyPuzzles[duplicateKey]) {
        errors.push(
          (puzzle.id || "unknown") + ": duplicate puzzle layout for difficulty " + difficultyKey + "."
        );
      } else {
        seenDifficultyPuzzles[duplicateKey] = true;
      }
    }

    validatePuzzle(puzzle, seenIds, errors);
  });

  const groupedPuzzles = groupPuzzlesByDifficulty(sourcePuzzles);
  const structureErrors = findStructureShortfalls(groupedPuzzles, STRUCTURE_MINIMUMS);

  structureErrors.forEach(function (error) {
    errors.push(error);
  });

  return errors;
}

function main() {
  const errors = validatePuzzleBank(puzzles);

  if (errors.length > 0) {
    console.error("Puzzle validation failed:");
    errors.forEach(function (error) {
      console.error("- " + error);
    });
    process.exit(1);
  }

  console.log("Puzzle validation passed for " + puzzles.length + " puzzles.");
}

if (require.main === module) {
  main();
}

module.exports = {
  VALID_DIFFICULTIES,
  VALID_TECHNIQUES,
  countSolutions,
  validatePuzzle,
  validatePuzzleBank
};
