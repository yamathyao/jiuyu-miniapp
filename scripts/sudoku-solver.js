const { getRow, getColumn, getBox } = require("../js/utils/sudoku");

function getCandidates(cells, index) {
  const used = {};

  for (let compareIndex = 0; compareIndex < 81; compareIndex += 1) {
    if (
      cells[compareIndex] &&
      (getRow(index) === getRow(compareIndex) ||
        getColumn(index) === getColumn(compareIndex) ||
        getBox(index) === getBox(compareIndex))
    ) {
      used[cells[compareIndex]] = true;
    }
  }

  return ["1", "2", "3", "4", "5", "6", "7", "8", "9"].filter(function (value) {
    return !used[value];
  });
}

function findNextCell(cells) {
  let nextCell = null;

  for (let index = 0; index < 81; index += 1) {
    if (cells[index] !== "0") {
      continue;
    }

    const candidates = getCandidates(cells, index);
    if (!nextCell || candidates.length < nextCell.candidates.length) {
      nextCell = { index: index, candidates: candidates };
    }

    if (nextCell.candidates.length === 0) {
      break;
    }
  }

  return nextCell;
}

function countSolutions(grid, limit) {
  const cells = grid.split("");
  const maximumSolutions = Number.isInteger(limit) && limit > 0 ? limit : 2;
  let solutionCount = 0;

  function search() {
    if (solutionCount >= maximumSolutions) {
      return;
    }

    const nextCell = findNextCell(cells);
    if (!nextCell) {
      solutionCount += 1;
      return;
    }

    nextCell.candidates.forEach(function (value) {
      cells[nextCell.index] = value;
      search();
      cells[nextCell.index] = "0";
    });
  }

  search();
  return solutionCount;
}

module.exports = {
  countSolutions
};
