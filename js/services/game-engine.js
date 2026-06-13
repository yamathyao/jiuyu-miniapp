const EMPTY_CELL = "";
const { isRelatedCell } = require("../utils/sudoku");

function cloneCell(cell) {
  return {
    index: cell.index,
    value: cell.value,
    given: cell.given,
    notes: cell.notes.slice()
  };
}

function cloneHintMetadata(hint) {
  if (!hint || typeof hint !== "object") {
    return null;
  }

  return {
    primaryTechnique: typeof hint.primaryTechnique === "string"
      ? hint.primaryTechnique
      : "",
    targetIndex: Number.isInteger(hint.targetIndex) ? hint.targetIndex : -1,
    relatedIndexes: Array.isArray(hint.relatedIndexes)
      ? hint.relatedIndexes.slice()
      : [],
    context: hint.context && typeof hint.context === "object"
      ? Object.assign({}, hint.context)
      : null
  };
}

function cloneGame(game) {
  return {
    puzzleId: game.puzzleId,
    difficulty: game.difficulty,
    puzzle: game.puzzle,
    solution: game.solution,
    techniques: Array.isArray(game.techniques) ? game.techniques.slice() : [],
    hint: cloneHintMetadata(game.hint),
    cells: game.cells.map(cloneCell),
    elapsedSeconds: game.elapsedSeconds,
    mistakes: game.mistakes,
    hintsUsed: game.hintsUsed,
    history: game.history.slice()
  };
}

function createGame(puzzle) {
  return {
    puzzleId: puzzle.id,
    difficulty: puzzle.difficulty,
    puzzle: puzzle.puzzle,
    solution: puzzle.solution,
    techniques: Array.isArray(puzzle.techniques) ? puzzle.techniques.slice() : [],
    hint: cloneHintMetadata(puzzle.hint),
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

function isEditableCell(game, index) {
  const cell = game.cells[index];
  return Boolean(cell) && !cell.given;
}

function pushHistoryEntry(nextGame, cell, mode) {
  nextGame.history.push({
    index: cell.index,
    mode: mode,
    value: cell.value,
    notes: cell.notes.slice()
  });
}

function applyInputValue(game, index, rawValue) {
  if (!isEditableCell(game, index)) {
    return game;
  }

  const value = String(rawValue);
  const nextGame = cloneGame(game);
  const targetCell = nextGame.cells[index];

  pushHistoryEntry(nextGame, targetCell, "value");
  targetCell.value = value;
  targetCell.notes = [];

  return nextGame;
}

function toggleCellNote(game, index, rawValue) {
  if (!isEditableCell(game, index)) {
    return game;
  }

  const value = String(rawValue);
  const nextGame = cloneGame(game);
  const targetCell = nextGame.cells[index];
  const nextNotes = targetCell.notes.slice();
  const existingIndex = nextNotes.indexOf(value);

  pushHistoryEntry(nextGame, targetCell, "note");

  if (existingIndex >= 0) {
    nextNotes.splice(existingIndex, 1);
  } else {
    nextNotes.push(value);
    nextNotes.sort();
  }

  targetCell.notes = nextNotes;

  return nextGame;
}

function eraseCellContent(game, index, noteMode) {
  if (!isEditableCell(game, index)) {
    return game;
  }

  const nextGame = cloneGame(game);
  const targetCell = nextGame.cells[index];
  const hasValue = targetCell.value !== EMPTY_CELL;
  const hasNotes = targetCell.notes.length > 0;

  if (noteMode && !hasNotes) {
    return game;
  }

  if (!noteMode && !hasValue) {
    return game;
  }

  pushHistoryEntry(nextGame, targetCell, noteMode ? "erase-note" : "erase-value");

  if (noteMode) {
    targetCell.notes = [];
  } else {
    targetCell.value = EMPTY_CELL;
  }

  return nextGame;
}

function undoLastStep(game) {
  if (!game.history.length) {
    return {
      game: game,
      selectedIndex: -1
    };
  }

  const nextGame = cloneGame(game);
  const lastStep = nextGame.history.pop();
  const targetCell = nextGame.cells[lastStep.index];

  targetCell.value = lastStep.value;
  targetCell.notes = lastStep.notes.slice();

  return {
    game: nextGame,
    selectedIndex: lastStep.index
  };
}

function getHintRole(hintOptions, cellIndex) {
  if (!hintOptions || hintOptions.hintTargetIndex < 0) {
    return "";
  }

  if (cellIndex === hintOptions.hintTargetIndex) {
    return "target";
  }

  if (hintOptions.hintRelatedIndexes.indexOf(cellIndex) < 0) {
    return "";
  }

  if (hintOptions.hintDifficulty === "expert") {
    return "related-strong";
  }

  if (
    hintOptions.hintTechnique === "box-line-reduction" ||
    hintOptions.hintContextPattern === "box-line"
  ) {
    return "related-strong";
  }

  return "related-soft";
}

function buildBoardView(game, selectedIndex, extraState) {
  const selectedCell = game.cells[selectedIndex];
  const selectedValue = selectedCell ? selectedCell.value : EMPTY_CELL;
  const issueIndexes = extraState && Array.isArray(extraState.issueIndexes)
    ? extraState.issueIndexes
    : [];
  const hintTargetIndex = extraState ? extraState.hintTargetIndex : -1;
  const hintRelatedIndexes = extraState && Array.isArray(extraState.hintRelatedIndexes)
    ? extraState.hintRelatedIndexes
    : [];
  const hintTechnique = extraState ? String(extraState.hintTechnique || "") : "";
  const hintDifficulty = extraState ? String(extraState.hintDifficulty || game.difficulty || "") : "";
  const hintContextPattern = extraState ? String(extraState.hintContextPattern || "") : "";
  const hintOptions = {
    hintTargetIndex: hintTargetIndex,
    hintRelatedIndexes: hintRelatedIndexes,
    hintTechnique: hintTechnique,
    hintDifficulty: hintDifficulty,
    hintContextPattern: hintContextPattern
  };

  return game.cells.map(function (cell) {
    const hasValue = cell.value !== EMPTY_CELL;
    const hasNotes = cell.notes.length > 0;

    return {
      index: cell.index,
      value: cell.value,
      given: cell.given,
      notes: cell.notes.slice(),
      selected: cell.index === selectedIndex,
      related: selectedIndex >= 0 && isRelatedCell(selectedIndex, cell.index),
      sameValue: Boolean(selectedValue && hasValue && cell.value === selectedValue),
      empty: !hasValue,
      hasNotes: hasNotes,
      issue: issueIndexes.indexOf(cell.index) >= 0,
      hintTarget: cell.index === hintTargetIndex,
      hintRelated: hintRelatedIndexes.indexOf(cell.index) >= 0,
      hintRole: getHintRole(hintOptions, cell.index)
    };
  });
}

module.exports = {
  createGame,
  isEditableCell,
  applyInputValue,
  toggleCellNote,
  eraseCellContent,
  undoLastStep,
  buildBoardView
};
