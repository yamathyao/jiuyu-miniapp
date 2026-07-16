const { beginnerPuzzles } = require("./puzzles-beginner");
const { intermediatePuzzles } = require("./puzzles-intermediate");
const { skilledPuzzles } = require("./puzzles-skilled");
const { expertPuzzles } = require("./puzzles-expert");
const { foundationLessons } = require("./puzzles-foundation");

const puzzles = beginnerPuzzles
  .concat(intermediatePuzzles)
  .concat(skilledPuzzles)
  .concat(expertPuzzles)
  .concat(foundationLessons);

module.exports = {
  puzzles
};
