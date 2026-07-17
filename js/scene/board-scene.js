const {
  drawRoundedRectPath,
  drawPlaque
} = require("../ui/panel-primitives");

function isAdvancedDifficulty(difficulty) {
  return difficulty === "skilled" || difficulty === "expert";
}

function getFontSize(font) {
  const match = /(\d+)px/.exec(font || "");
  return match ? Number(match[1]) : 15;
}

function measureTextWidth(context, text) {
  if (context && typeof context.measureText === "function") {
    return context.measureText(text).width;
  }

  return String(text || "").length * getFontSize(context && context.font) * 0.56;
}

function getWrappedLines(context, text, maxWidth, maxLines) {
  const words = String(text || "").trim().split(/\s+/).filter(Boolean);
  const lines = [];
  let currentLine = "";

  words.forEach(function (word) {
    const nextLine = currentLine ? currentLine + " " + word : word;

    if (measureTextWidth(context, nextLine) <= maxWidth) {
      currentLine = nextLine;
      return;
    }

    if (currentLine) {
      lines.push(currentLine);
      currentLine = "";
    }

    if (measureTextWidth(context, word) <= maxWidth) {
      currentLine = word;
      return;
    }

    word.split("").forEach(function (character) {
      const nextWordPart = currentLine + character;

      if (measureTextWidth(context, nextWordPart) <= maxWidth || !currentLine) {
        currentLine = nextWordPart;
        return;
      }

      lines.push(currentLine);
      currentLine = character;
    });
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return maxLines ? lines.slice(0, maxLines) : lines;
}

function drawWrappedText(context, text, left, top, maxWidth, lineHeight, maxLines) {
  getWrappedLines(context, text, maxWidth, maxLines).forEach(function (line, lineIndex) {
    context.fillText(line, left, top + lineHeight * lineIndex);
  });
}

function drawOverlayButton(context, left, top, width, height, label, theme) {
  context.fillStyle = theme.boardBase || "#ffffff";
  drawRoundedRectPath(context, left, top, width, height, 16);
  if (typeof context.fill === "function") {
    context.fill();
  }

  context.lineWidth = 1;
  context.strokeStyle = theme.buttonShadow || "#c98b6f";
  drawRoundedRectPath(context, left, top, width, height, 16);
  if (typeof context.stroke === "function") {
    context.stroke();
  }

  context.fillStyle = theme.toolText || "#1f2933";
  context.font = "14px sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(label, left + width / 2, top + height / 2 + 1);
}

function createBoardScene(options) {
  const canvasWidth = options.canvasWidth || 375;
  const canvasHeight = options.canvasHeight || 812;
  const verticalOffset = options.verticalOffset != null ? options.verticalOffset : 32;
  const headerPanelTop = 50 + verticalOffset;
  const headerPanelHeight = 100;
  const maxFeedbackHeight = 65;
  const feedbackGap = 20;
  const horizontalPadding = options.horizontalPadding || Math.max(16, Math.floor(canvasWidth * 0.04));
  const topPadding = options.topPadding || Math.max(
    Math.max(186, Math.floor(canvasHeight * 0.225)) + verticalOffset,
    headerPanelTop + headerPanelHeight + maxFeedbackHeight + feedbackGap + 4
  );
  const maxBoardSize = Math.min(
    canvasWidth - horizontalPadding * 2,
    canvasHeight * 0.62
  );
  const boardSize = options.boardSize || Math.floor(maxBoardSize);
  const boardLeft = options.boardLeft != null
    ? options.boardLeft
    : Math.floor((canvasWidth - boardSize) / 2);
  const boardTop = options.boardTop != null ? options.boardTop : topPadding;
  const cellSize = boardSize / 9;
  const titleTop = 94 + verticalOffset;
  const difficultyTop = 120 + verticalOffset;
  const settingsTop = 74 + verticalOffset;

  function getMetrics() {
    return {
      canvasWidth: canvasWidth,
      canvasHeight: canvasHeight,
      boardTop: boardTop,
      boardLeft: boardLeft,
      boardSize: boardSize,
      cellSize: cellSize,
      headerPanelTop: headerPanelTop,
      headerPanelHeight: headerPanelHeight,
      settingsLeft: boardLeft + boardSize - 84,
      settingsTop: settingsTop,
      settingsWidth: 84,
      settingsHeight: 34,
      completionCardLeft: boardLeft + 14,
      completionCardTop: boardTop + 48,
      completionCardWidth: boardSize - 28,
      completionCardHeight: 368,
      statsCardLeft: boardLeft + 20,
      statsCardTop: boardTop + 64,
      statsCardWidth: boardSize - 40,
      statsCardHeight: 318
    };
  }

  function getCompletionActions(summary) {
    if (summary && summary.tutorialLesson) {
      return ["continue-tutorial"];
    }

    if (summary && summary.tutorial) {
      return ["start-beginner", "replay-tutorial", "home"];
    }

    if (summary && summary.examFailed) {
      return ["retry-exam", "home"];
    }

    if (summary && summary.examPassed) {
      return isAdvancedDifficulty(summary.difficulty)
        ? ["home", "stats"]
        : ["home"];
    }

    return isAdvancedDifficulty(summary.difficulty)
      ? ["new-game", "home", "stats"]
      : ["new-game", "home"];
  }

  function getCompletionActionLabel(action, t) {
    if (action === "new-game" || action === "retry-exam") {
      return t("completion.nextAction");
    }

    if (action === "continue-tutorial") {
      return t("tutorial.lessonComplete.ok");
    }

    if (action === "start-beginner") {
      return t("tutorial.graduation.startBeginner");
    }

    if (action === "replay-tutorial") {
      return t("tutorial.graduation.replay");
    }

    if (action === "home") {
      return t("completion.homeAction");
    }

    return t("completion.statsAction");
  }

  function getCellIndexByPoint(x, y) {
    if (
      x < boardLeft ||
      y < boardTop ||
      x > boardLeft + boardSize ||
      y > boardTop + boardSize
    ) {
      return -1;
    }

    const column = Math.floor((x - boardLeft) / cellSize);
    const row = Math.floor((y - boardTop) / cellSize);
    return row * 9 + column;
  }

  function drawHeader(context, renderState, theme, metrics) {
    const title = renderState ? renderState.title || "" : "";
    const difficultyLabel = renderState ? renderState.difficultyLabel || "" : "";
    const timerLabel = renderState ? renderState.timerLabel || "" : "";
    const settingsLabel = renderState ? renderState.settingsLabel || "" : "";
    const examState = renderState ? renderState.examState || null : null;

    context.fillStyle = theme.surfaceTint || "#fff7eb";
    context.fillRect(boardLeft - 6, metrics.headerPanelTop, boardSize + 12, metrics.headerPanelHeight);

    context.fillStyle = theme.boardBase || "#ffffff";
    context.fillRect(boardLeft + 10, metrics.headerPanelTop + 18, boardSize - 20, metrics.headerPanelHeight - 34);

    context.fillStyle = theme.ornament || "#d9a65a";
    context.fillRect(boardLeft + 16, metrics.headerPanelTop + 28, 36, 2);
    context.fillRect(boardLeft + boardSize - 52, metrics.headerPanelTop + 28, 36, 2);

    if (title) {
      context.fillStyle = theme.toolText || "#1f2933";
      context.font = "bold 24px sans-serif";
      context.textAlign = "left";
      context.textBaseline = "middle";
      context.fillText(title, boardLeft, titleTop);
    }

    if (difficultyLabel) {
      context.fillStyle = theme.buttonShadow || "#8f7569";
      context.font = "14px sans-serif";
      context.textAlign = "left";
      context.textBaseline = "middle";
      context.fillText(difficultyLabel, boardLeft, difficultyTop);
    }

    if (timerLabel) {
      context.fillStyle = theme.buttonShadow || "#8f7569";
      context.font = "14px sans-serif";
      context.textAlign = "left";
      context.textBaseline = "middle";
      context.fillText(timerLabel, boardLeft + 96, difficultyTop);
    }

    if (examState && examState.active) {
      context.fillStyle = theme.buttonShadow || "#8f7569";
      context.font = "13px sans-serif";
      context.textAlign = "right";
      context.textBaseline = "middle";
      context.fillText(
        examState.failed
          ? renderState.t("board.examFailed")
          : renderState.t("board.examActive"),
        boardLeft + boardSize,
        titleTop
      );

      if (examState.remainingLabel) {
        context.textAlign = "left";
        context.fillText(examState.remainingLabel, boardLeft + 188, difficultyTop);
      }
    }

    if (settingsLabel) {
      drawPlaque(
        context,
        metrics.settingsLeft,
        metrics.settingsTop,
        metrics.settingsWidth,
        metrics.settingsHeight,
        settingsLabel,
        {
          fill: theme.surfaceTint || "#fff7eb",
          border: theme.buttonShadow || "#c98b6f",
          ornament: theme.ornament || "#d9a65a",
          textColor: theme.toolText || "#1f2933",
          font: "15px sans-serif",
          borderWidth: 1
        }
      );
    }
  }

  function drawFeedback(context, feedbackMessage, feedbackType, hintProgress, theme) {
    if (!feedbackMessage) {
      return;
    }

    const fill = feedbackType === "warning"
      ? theme.issueFill || "#f0d5d5"
      : theme.feedbackFill || "#e9eef3";
    const text = feedbackType === "warning"
      ? "#7a3030"
      : theme.feedbackText || "#304252";
    const feedbackFont = "15px sans-serif";
    const lineHeight = 17;
    context.font = feedbackFont;
    const progressLabel = hintProgress && hintProgress.current && hintProgress.total
      ? String(hintProgress.current) + "/" + String(hintProgress.total)
      : "";
    const progressWidth = progressLabel
      ? measureTextWidth(context, progressLabel) + 56
      : 0;
    const maxWidth = boardSize - 24 - progressWidth;
    const lines = getWrappedLines(context, feedbackMessage, maxWidth, 3);
    const feedbackHeight = Math.max(34, 14 + lines.length * lineHeight);
    const feedbackTop = boardTop - 20 - feedbackHeight;

    context.fillStyle = fill;
    drawRoundedRectPath(context, boardLeft, feedbackTop, boardSize, feedbackHeight, 12);
    if (typeof context.fill === "function") {
      context.fill();
    }

    context.fillStyle = text;
    context.font = feedbackFont;
    context.textAlign = "left";
    context.textBaseline = "top";
    drawWrappedText(context, feedbackMessage, boardLeft + 12, feedbackTop + 8, maxWidth, lineHeight, 3);

    if (progressLabel) {
      const previousAlpha = typeof context.globalAlpha === "number" ? context.globalAlpha : 1;
      context.fillStyle = theme.buttonShadow || "#8f7569";
      context.font = "11px sans-serif";
      context.textAlign = "right";
      context.textBaseline = "top";
      context.globalAlpha = 0.78;
      context.fillText(
        progressLabel,
        boardLeft + boardSize - 12,
        feedbackTop + 8
      );
      context.globalAlpha = previousAlpha;
    }
  }

  function drawCompletionCard(context, renderState, theme, metrics) {
    if (!renderState || !renderState.completionVisible || !renderState.completionSummary) {
      return;
    }

    const summary = renderState.completionSummary;
    const t = renderState.t;
    const isTutorialLesson = Boolean(summary.tutorialLesson);
    const isAdvanced = isAdvancedDifficulty(summary.difficulty);
    const actions = getCompletionActions(summary);
    const title = summary.title || (isAdvanced ? t("completion.titleByDifficulty.expert") : t("completion.titleByDifficulty.beginner"));
    const encouragement = summary.encouragement || "";
    const cardLeft = metrics.completionCardLeft;
    const cardTop = metrics.completionCardTop;
    const cardWidth = metrics.completionCardWidth;
    const cardHeight = metrics.completionCardHeight;
    const horizontalInset = 18;
    const actionGap = 12;
    const buttonHeight = 42;
    const buttonWidth = Math.floor((cardWidth - horizontalInset * 2 - (actions.length - 1) * actionGap) / actions.length);
    const buttonTop = cardTop + cardHeight - 74;
    const infoLeft = cardLeft + 24;
    const dividerLeft = cardLeft + 20;
    const dividerWidth = cardWidth - 40;
    const tags = (summary.resultTags || []).slice(0, 3);
    const tagWidth = Math.min(88, Math.floor((cardWidth - 48 - Math.max(0, tags.length - 1) * 10) / Math.max(tags.length, 1)));
    const tagGap = 10;
    const tagRowWidth = tags.length > 0
      ? tags.length * tagWidth + (tags.length - 1) * tagGap
      : 0;
    const tagStartLeft = cardLeft + Math.floor((cardWidth - tagRowWidth) / 2);

    context.fillStyle = "rgba(34, 32, 28, 0.24)";
    context.fillRect(0, 0, canvasWidth, canvasHeight);

    context.fillStyle = theme.surfaceTint || "#fff7eb";
    drawRoundedRectPath(context, cardLeft, cardTop, cardWidth, cardHeight, 22);
    if (typeof context.fill === "function") {
      context.fill();
    }

    context.lineWidth = 1.2;
    context.strokeStyle = theme.buttonShadow || "#c98b6f";
    drawRoundedRectPath(context, cardLeft, cardTop, cardWidth, cardHeight, 22);
    if (typeof context.stroke === "function") {
      context.stroke();
    }

    context.fillStyle = theme.toolText || "#1f2933";
    context.font = "bold 24px sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(title, cardLeft + cardWidth / 2, cardTop + 46);

    if (isTutorialLesson) {
      context.fillStyle = theme.toolText || "#1f2933";
      context.font = "16px sans-serif";
      drawWrappedText(
        context,
        summary.achievement || "",
        cardLeft + cardWidth / 2,
        cardTop + 126,
        cardWidth - 48,
        24,
        3
      );
      context.fillStyle = theme.buttonShadow || "#8f7569";
      context.font = "15px sans-serif";
      drawWrappedText(
        context,
        encouragement,
        cardLeft + cardWidth / 2,
        cardTop + 208,
        cardWidth - 48,
        22,
        2
      );
      drawOverlayButton(
        context,
        cardLeft + horizontalInset,
        buttonTop,
        buttonWidth,
        buttonHeight,
        t("tutorial.lessonComplete.ok"),
        theme
      );
      return;
    }

    context.fillStyle = theme.buttonShadow || "#8f7569";
    context.font = "14px sans-serif";
    context.fillText(
      t("difficulty." + summary.difficulty) + " · " +
        t("completion.timeLabel") + " " +
        String(summary.elapsedSeconds) + t("common.secondsShort"),
      cardLeft + cardWidth / 2,
      cardTop + 86
    );

    if (summary.pointsAwarded != null) {
      context.fillText(
        summary.pointsAwarded > 0
          ? t("completion.pointsAwarded", {
            points: String(summary.pointsAwarded)
          })
          : t("completion.pointsBlocked"),
        cardLeft + cardWidth / 2,
        cardTop + 106
      );
    }

    context.strokeStyle = theme.ornament || "#d9a65a";
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(dividerLeft, cardTop + 112);
    context.lineTo(dividerLeft + dividerWidth, cardTop + 112);
    context.stroke();

    context.fillStyle = theme.toolText || "#1f2933";
    context.font = "15px sans-serif";
    context.textAlign = "left";
    context.fillText(
      t("completion.hintLabel") + " " + summary.hintCount,
      infoLeft,
      cardTop + 146
    );

    if (isAdvanced) {
      context.fillText(
        t("completion.checkLabel") + " " + summary.checkCount,
        infoLeft,
        cardTop + 184
      );
      context.fillText(
        t("completion.mistakeLabel") + " " + summary.mistakeCount,
        infoLeft,
        cardTop + 222
      );

      context.textAlign = "center";
      context.font = "13px sans-serif";
      tags.forEach(function (tag, index) {
        const tagLeft = tagStartLeft + index * (tagWidth + tagGap);
        context.fillStyle = theme.feedbackFill || "#e9eef3";
        drawRoundedRectPath(context, tagLeft, cardTop + 264, tagWidth, 32, 16);
        if (typeof context.fill === "function") {
          context.fill();
        }
        context.fillStyle = theme.feedbackText || "#304252";
        context.fillText(tag, tagLeft + tagWidth / 2, cardTop + 280);
      });
    } else {
      context.textAlign = "center";
      context.font = "15px sans-serif";
      context.fillText(encouragement, cardLeft + cardWidth / 2, cardTop + 202);
    }

    actions.forEach(function (action, index) {
      const left = cardLeft + horizontalInset + index * (buttonWidth + actionGap);
      drawOverlayButton(
        context,
        left,
        buttonTop,
        buttonWidth,
        buttonHeight,
        getCompletionActionLabel(action, t),
        theme
      );
    });
  }

  function drawStatsOverlay(context, renderState, theme, metrics) {
    if (!renderState || !renderState.statsOverlayVisible || !renderState.statsSnapshot || !renderState.completionSummary) {
      return;
    }

    const stats = renderState.statsSnapshot;
    const summary = renderState.completionSummary;
    const t = renderState.t;
    const cardLeft = metrics.statsCardLeft;
    const cardTop = metrics.statsCardTop;
    const cardWidth = metrics.statsCardWidth;
    const cardHeight = metrics.statsCardHeight;
    const bestTime = stats.bestTimeByDifficulty[summary.difficulty];
    const averageTime = stats.averageTimeByDifficulty[summary.difficulty];
    const completionCount = stats.completionCountByDifficulty[summary.difficulty];
    const hintCount = stats.hintCountByDifficulty[summary.difficulty];
    const currentStreakDays = stats.currentStreakDays || 0;
    const bestStreakDays = stats.bestStreakDays || 0;
    const averageHints = completionCount > 0
      ? (hintCount / completionCount).toFixed(1).replace(/\.0$/, "")
      : "0";
    const buttonWidth = 166;
    const buttonHeight = 40;
    const buttonLeft = cardLeft + Math.floor((cardWidth - buttonWidth) / 2);
    const buttonTop = cardTop + cardHeight - 68;

    context.fillStyle = "rgba(24, 24, 24, 0.28)";
    context.fillRect(0, 0, canvasWidth, canvasHeight);

    context.fillStyle = theme.surfaceTint || "#fff7eb";
    drawRoundedRectPath(context, cardLeft, cardTop, cardWidth, cardHeight, 22);
    if (typeof context.fill === "function") {
      context.fill();
    }

    context.lineWidth = 1.2;
    context.strokeStyle = theme.buttonShadow || "#c98b6f";
    drawRoundedRectPath(context, cardLeft, cardTop, cardWidth, cardHeight, 22);
    if (typeof context.stroke === "function") {
      context.stroke();
    }

    context.fillStyle = theme.toolText || "#1f2933";
    context.font = "bold 22px sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(t("completion.statsTitle"), cardLeft + cardWidth / 2, cardTop + 46);

    context.fillStyle = theme.buttonShadow || "#8f7569";
    context.font = "14px sans-serif";
    context.fillText(t("difficulty." + summary.difficulty), cardLeft + cardWidth / 2, cardTop + 82);

    context.strokeStyle = theme.ornament || "#d9a65a";
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(cardLeft + 20, cardTop + 108);
    context.lineTo(cardLeft + cardWidth - 20, cardTop + 108);
    context.stroke();

    context.fillStyle = theme.toolText || "#1f2933";
    context.font = "15px sans-serif";
    context.textAlign = "left";
    context.fillText(t("completion.statsTotalLabel") + " " + stats.totalCompleted, cardLeft + 22, cardTop + 146);
    context.fillText(t("completion.statsCompletedLabel") + " " + completionCount, cardLeft + 22, cardTop + 178);
    context.fillText(
      t("completion.statsCurrentStreakValue", {
        streak: String(currentStreakDays)
      }),
      cardLeft + 22,
      cardTop + 210
    );
    context.fillText(
      t("completion.statsBestStreakValue", {
        streak: String(bestStreakDays)
      }),
      cardLeft + 22,
      cardTop + 242
    );
    context.fillText(
      t("completion.statsBestLabel") + " " + bestTime + t("common.secondsShort"),
      cardLeft + 22,
      cardTop + 274
    );
    context.fillText(
      t("completion.statsAverageLabel") + " " + averageTime + t("common.secondsShort"),
      cardLeft + 22,
      cardTop + 306
    );
    context.fillText(t("completion.statsHintsLabel") + " " + hintCount, cardLeft + 22, cardTop + 338);
    context.fillText(t("completion.statsHintsAverageLabel") + " " + averageHints, cardLeft + 22, cardTop + 370);

    drawOverlayButton(context, buttonLeft, buttonTop, buttonWidth, buttonHeight, t("completion.backToCompletion"), theme);
  }

  function draw(context, cells, renderState) {
    const theme = renderState ? renderState.theme || {} : {};
    const metrics = getMetrics();

    drawHeader(context, renderState, theme, metrics);

    context.fillStyle = theme.boardBase || "#ffffff";
    context.fillRect(boardLeft, boardTop, boardSize, boardSize);
    drawFeedback(
      context,
      renderState ? renderState.feedbackMessage : "",
      renderState ? renderState.feedbackType : "info",
      renderState ? renderState.hintProgress : null,
      theme
    );

    cells.forEach(function (cell) {
      const row = Math.floor(cell.index / 9);
      const column = cell.index % 9;
      const x = boardLeft + column * cellSize;
      const y = boardTop + row * cellSize;

      context.fillStyle = cell.issue
        ? theme.issueFill || "#f0d5d5"
        : cell.hintRole === "target"
          ? theme.hintTarget || theme.selected || "#9ed9c8"
          : cell.hintRole === "related-strong"
            ? theme.hintRelatedStrong || theme.hintRelated || "#e6efe8"
            : cell.hintRole === "related-soft"
              ? theme.hintRelatedSoft || theme.hintRelated || "#e6efe8"
              : cell.hintTarget
                ? theme.hintTarget || theme.selected || "#9ed9c8"
                : cell.hintRelated
                  ? theme.hintRelated || "#e6efe8"
          : cell.selected
            ? theme.selected || "#9ed9c8"
            : cell.sameValue
              ? theme.sameValue || "#dceee8"
              : cell.related
                ? theme.related || "#f4efe4"
                : theme.boardBase || "#ffffff";
      context.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);

      if (cell.value) {
        context.fillStyle = cell.given
          ? theme.givenDigit || "#1f2933"
          : theme.editableDigit || "#8A5F45";
        context.font = cell.given ? "bold 28px sans-serif" : "28px sans-serif";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(cell.value, x + cellSize / 2, y + cellSize / 2);
        return;
      }

      if (cell.hasNotes) {
        context.fillStyle = theme.noteDigit || "#607078";
        context.font = "12px sans-serif";
        context.textAlign = "center";
        context.textBaseline = "middle";

        cell.notes.forEach(function (noteValue) {
          const note = Number(noteValue) - 1;
          const noteColumn = note % 3;
          const noteRow = Math.floor(note / 3);
          context.fillText(
            noteValue,
            x + (noteColumn + 0.5) * (cellSize / 3),
            y + (noteRow + 0.5) * (cellSize / 3)
          );
        });
      }
    });

    context.strokeStyle = "#1f2933";
    for (let line = 0; line <= 9; line += 1) {
      context.lineWidth = line % 3 === 0 ? 3 : 1;
      context.beginPath();
      context.moveTo(boardLeft, boardTop + line * cellSize);
      context.lineTo(boardLeft + boardSize, boardTop + line * cellSize);
      context.stroke();

      context.beginPath();
      context.moveTo(boardLeft + line * cellSize, boardTop);
      context.lineTo(boardLeft + line * cellSize, boardTop + boardSize);
      context.stroke();
    }

    drawCompletionCard(context, renderState, theme, metrics);
    drawStatsOverlay(context, renderState, theme, metrics);
  }

  function hitTestHeaderAction(x, y) {
    const metrics = getMetrics();

    if (
      x >= metrics.settingsLeft &&
      x <= metrics.settingsLeft + metrics.settingsWidth &&
      y >= metrics.settingsTop &&
      y <= metrics.settingsTop + metrics.settingsHeight
    ) {
      return { type: "action", value: "settings" };
    }

    return null;
  }

  function hitTestCompletionAction(x, y, renderState) {
    if (!renderState || !renderState.completionVisible || !renderState.completionSummary) {
      return null;
    }

    const metrics = getMetrics();
    const actions = getCompletionActions(renderState.completionSummary);
    const horizontalInset = 18;
    const actionGap = 12;
    const buttonHeight = 42;
    const buttonWidth = Math.floor(
      (metrics.completionCardWidth - horizontalInset * 2 - (actions.length - 1) * actionGap) / actions.length
    );
    const buttonTop = metrics.completionCardTop + metrics.completionCardHeight - 74;

    for (let index = 0; index < actions.length; index += 1) {
      const left = metrics.completionCardLeft + horizontalInset + index * (buttonWidth + actionGap);
      if (
        x >= left &&
        x <= left + buttonWidth &&
        y >= buttonTop &&
        y <= buttonTop + buttonHeight
      ) {
        return { type: "completion-action", value: actions[index] };
      }
    }

    return null;
  }

  function hitTestStatsOverlayAction(x, y, renderState) {
    if (!renderState || !renderState.statsOverlayVisible) {
      return null;
    }

    const metrics = getMetrics();
    const width = 166;
    const height = 40;
    const left = metrics.statsCardLeft + Math.floor((metrics.statsCardWidth - width) / 2);
    const top = metrics.statsCardTop + metrics.statsCardHeight - 68;

    if (
      x >= left &&
      x <= left + width &&
      y >= top &&
      y <= top + height
    ) {
      return { type: "stats-action", value: "back-to-completion" };
    }

    return null;
  }

  return {
    draw: draw,
    getCompletionActions: getCompletionActions,
    getCellIndexByPoint: getCellIndexByPoint,
    getMetrics: getMetrics,
    hitTestHeaderAction: hitTestHeaderAction,
    hitTestCompletionAction: hitTestCompletionAction,
    hitTestStatsOverlayAction: hitTestStatsOverlayAction
  };
}

module.exports = {
  createBoardScene: createBoardScene
};
