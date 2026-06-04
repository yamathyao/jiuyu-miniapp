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

function isSameRow(leftIndex, rightIndex) {
  return getRow(leftIndex) === getRow(rightIndex);
}

function isSameColumn(leftIndex, rightIndex) {
  return getColumn(leftIndex) === getColumn(rightIndex);
}

function isSameBox(leftIndex, rightIndex) {
  return getBox(leftIndex) === getBox(rightIndex);
}

function isRelatedCell(leftIndex, rightIndex) {
  return (
    leftIndex === rightIndex ||
    isSameRow(leftIndex, rightIndex) ||
    isSameColumn(leftIndex, rightIndex) ||
    isSameBox(leftIndex, rightIndex)
  );
}

module.exports = {
  getRow,
  getColumn,
  getBox,
  isSameRow,
  isSameColumn,
  isSameBox,
  isRelatedCell
};
