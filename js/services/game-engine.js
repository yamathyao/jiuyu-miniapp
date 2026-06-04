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

function cloneGame(game) {
  return {
    puzzleId: game.puzzleId,
    difficulty: game.difficulty,
    puzzle: game.puzzle,
    solution: game.solution,
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
    return game;
  }

  const nextGame = cloneGame(game);
  const lastStep = nextGame.history.pop();
  const targetCell = nextGame.cells[lastStep.index];

  targetCell.value = lastStep.value;
  targetCell.notes = lastStep.notes.slice();

  return nextGame;
}

function buildBoardView(game, selectedIndex) {
  const selectedCell = game.cells[selectedIndex];
  const selectedValue = selectedCell ? selectedCell.value : EMPTY_CELL;

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
      hasNotes: hasNotes
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
