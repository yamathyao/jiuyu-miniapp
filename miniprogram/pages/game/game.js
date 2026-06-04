const { puzzles } = require("../../data/puzzles");
const { DIFFICULTIES } = require("../../utils/constants");
const {
  createGame,
  applyInputValue,
  toggleCellNote,
  eraseCellContent,
  undoLastStep,
  buildBoardView
} = require("../../services/game-engine");

function buildPageState(game, selectedIndex, noteMode) {
  return {
    game: game,
    selectedIndex: selectedIndex,
    noteMode: noteMode,
    difficultyLabel: DIFFICULTIES[game.difficulty] || "入门",
    boardCells: buildBoardView(game, selectedIndex)
  };
}

Page({
  data: {
    game: null,
    boardCells: [],
    selectedIndex: -1,
    noteMode: false,
    difficultyLabel: "入门"
  },

  onLoad() {
    const game = createGame(puzzles[0]);

    this.setData(buildPageState(game, -1, false));
  },

  handleCellSelect(event) {
    const selectedIndex = event.detail.index;

    this.setData({
      selectedIndex: selectedIndex,
      boardCells: buildBoardView(this.data.game, selectedIndex)
    });
  },

  handleNumberInput(event) {
    const selectedIndex = this.data.selectedIndex;

    if (selectedIndex < 0) {
      return;
    }

    const nextGame = this.data.noteMode
      ? toggleCellNote(this.data.game, selectedIndex, event.detail.value)
      : applyInputValue(this.data.game, selectedIndex, event.detail.value);

    this.setData(buildPageState(nextGame, selectedIndex, this.data.noteMode));
  },

  handleToolbarCommand(event) {
    const command = event.detail.command;

    if (command === "note") {
      this.setData({
        noteMode: !this.data.noteMode
      });
      return;
    }

    if (command === "undo") {
      const nextGame = undoLastStep(this.data.game);

      this.setData(buildPageState(nextGame, this.data.selectedIndex, this.data.noteMode));
      return;
    }

    if (command === "erase") {
      const nextGame = eraseCellContent(
        this.data.game,
        this.data.selectedIndex,
        this.data.noteMode
      );

      this.setData(buildPageState(nextGame, this.data.selectedIndex, this.data.noteMode));
    }
  }
});
