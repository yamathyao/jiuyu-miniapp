function getRow(index) {
  return Math.floor(index / 9);
}

function getColumn(index) {
  return index % 9;
}

function getBox(index) {
  const row = getRow(index);
  const column = getColumn(index);
  return Math.floor(row / 3) * 3 + Math.floor(column / 3);
}

module.exports = {
  getRow,
  getColumn,
  getBox
};

