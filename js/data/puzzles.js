const { beginnerPuzzles } = require("./puzzles-beginner");
const { intermediatePuzzles } = require("./puzzles-intermediate");
const { skilledPuzzles } = require("./puzzles-skilled");
const { expertPuzzles } = require("./puzzles-expert");

const puzzles = beginnerPuzzles
  .concat(intermediatePuzzles)
  .concat(skilledPuzzles)
  .concat(expertPuzzles);

module.exports = {
  puzzles
};
