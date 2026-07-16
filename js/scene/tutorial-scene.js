const {
  drawRoundedRectPath,
  drawPlaque
} = require("../ui/panel-primitives");
const { createSharedScenePalette } = require("../ui/scene-visual-spec");

function isInsideRect(x, y, left, top, width, height) {
  return x >= left && x <= left + width && y >= top && y <= top + height;
}

function fillRoundedRect(context, left, top, width, height, radius, fillStyle) {
  context.fillStyle = fillStyle;
  drawRoundedRectPath(context, left, top, width, height, radius);
  if (typeof context.fill === "function") {
    context.fill();
  }
}

function strokeRoundedRect(context, left, top, width, height, radius, strokeStyle) {
  context.strokeStyle = strokeStyle;
  context.lineWidth = 1.2;
  drawRoundedRectPath(context, left, top, width, height, radius);
  if (typeof context.stroke === "function") {
    context.stroke();
  }
}

function drawWrappedText(context, text, x, y, maxWidth, lineHeight, maxLines) {
  const characters = String(text || "").split("");
  const lines = [];
  let line = "";

  characters.forEach(function (character) {
    const nextLine = line + character;
    const nextWidth = typeof context.measureText === "function"
      ? context.measureText(nextLine).width
      : nextLine.length * 7;

    if (line && nextWidth > maxWidth) {
      lines.push(line);
      line = character;
      return;
    }

    line = nextLine;
  });

  if (line) {
    lines.push(line);
  }

  lines.slice(0, maxLines).forEach(function (visibleLine, index) {
    context.fillText(visibleLine, x, y + index * lineHeight);
  });
}

function createTutorialScene(options) {
  const canvasWidth = options.canvasWidth || 375;
  const canvasHeight = options.canvasHeight || 812;
  const verticalOffset = options.verticalOffset != null ? options.verticalOffset : 32;
  const contentWidth = Math.min(canvasWidth - 40, 320);
  const contentLeft = Math.floor((canvasWidth - contentWidth) / 2);
  const headerTop = 60 + verticalOffset;
  const headerHeight = 132;
  const cardHeight = 94;
  const cardGap = 14;
  const firstCardTop = headerTop + headerHeight + 26;

  function getMetrics() {
    return {
      headerTop: headerTop,
      headerHeight: headerHeight,
      titleTop: headerTop + 60,
      subtitleTop: headerTop + 87,
      backLeft: contentLeft + 12,
      backTop: headerTop + 12,
      backWidth: 42,
      backHeight: 32,
      cardLeft: contentLeft,
      cardTop: firstCardTop,
      cardWidth: contentWidth,
      cardHeight: cardHeight,
      cardGap: cardGap
    };
  }

  function drawCard(context, lesson, index, state, metrics, t) {
    const top = metrics.cardTop + index * (metrics.cardHeight + metrics.cardGap);
    const locked = state && state.locked;
    const completed = state && state.completed;
    const fill = locked ? "#eee9df" : completed ? "#e1eee7" : "#edf5ef";
    const inner = locked ? "#f6f2ea" : completed ? "#edf6f0" : "#f6fbf7";
    const edge = locked ? "#bcb5aa" : completed ? "#7b9b8e" : "#5e8f80";
    const shadow = locked ? "#d5cec3" : completed ? "#c5d8ce" : "#b8d5c6";

    fillRoundedRect(context, metrics.cardLeft + 2, top + 5, metrics.cardWidth, metrics.cardHeight, 18, shadow);
    fillRoundedRect(context, metrics.cardLeft, top, metrics.cardWidth, metrics.cardHeight - 4, 18, fill);
    fillRoundedRect(context, metrics.cardLeft + 10, top + 8, metrics.cardWidth - 20, metrics.cardHeight - 20, 14, inner);
    fillRoundedRect(context, metrics.cardLeft + 14, top + 7, metrics.cardWidth - 28, 10, 6, "#ffffff");
    strokeRoundedRect(context, metrics.cardLeft, top, metrics.cardWidth, metrics.cardHeight - 4, 18, edge);

    context.fillStyle = locked ? "#5f625e" : "#314b42";
    context.font = "bold 16px sans-serif";
    context.textAlign = "left";
    context.textBaseline = "middle";
    context.fillText(t("tutorial.lessons." + lesson.id + ".title"), metrics.cardLeft + 18, top + 32);
    context.fillStyle = locked ? "#76746f" : "#61736b";
    context.font = "12px sans-serif";
    context.fillText(t("tutorial.lessons." + lesson.id + ".summary"), metrics.cardLeft + 18, top + 58);
    context.fillStyle = locked ? "#7a7771" : "#4e796b";
    context.textAlign = "right";
    context.font = "bold 12px sans-serif";
    context.fillText(
      locked ? t("tutorial.lessonLocked") : completed ? t("tutorial.lessonReplay") : t("tutorial.lessonStart"),
      metrics.cardLeft + metrics.cardWidth - 18,
      top + 78
    );
  }

  function draw(context, renderState) {
    const t = renderState && typeof renderState.t === "function"
      ? renderState.t
      : function (key) { return key; };
    const lessons = renderState && Array.isArray(renderState.lessons) ? renderState.lessons : [];
    const lessonStates = renderState && renderState.lessonStates ? renderState.lessonStates : {};
    const metrics = getMetrics();
    const palette = createSharedScenePalette("beginner");

    context.fillStyle = palette.background;
    context.fillRect(0, 0, canvasWidth, canvasHeight);
    fillRoundedRect(context, 18, 26, canvasWidth - 36, canvasHeight - 52, 34, palette.haloFill);
    fillRoundedRect(context, contentLeft - 14, metrics.headerTop - 8, contentWidth + 28, metrics.headerHeight + 16, 26, palette.panelFill);
    drawPlaque(context, contentLeft, metrics.headerTop, contentWidth, metrics.headerHeight, "", {
      fill: "#f7fbf7",
      border: "#7b9b8e",
      ornament: "#76a393",
      radius: 22,
      showOrnament: false
    });
    drawPlaque(context, metrics.backLeft, metrics.backTop, metrics.backWidth, metrics.backHeight, "<", {
      fill: "#e2efe7",
      border: "#6e9989",
      ornament: "#6e9989",
      textColor: "#315447",
      font: "bold 20px sans-serif",
      radius: 15,
      showOrnament: false
    });

    context.fillStyle = "#314b42";
    context.font = "bold 25px sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(t("tutorial.title"), canvasWidth / 2, metrics.titleTop);
    context.fillStyle = "#61736b";
    context.font = "13px sans-serif";
    drawWrappedText(
      context,
      t("tutorial.subtitle"),
      canvasWidth / 2,
      metrics.subtitleTop,
      contentWidth - 32,
      14,
      2
    );
    context.fillStyle = "#79a191";
    context.fillRect(contentLeft + 122, metrics.headerTop + 114, contentWidth - 244, 2);

    lessons.forEach(function (lesson, index) {
      drawCard(context, lesson, index, lessonStates[lesson.id], metrics, t);
    });
  }

  function hitTest(x, y, renderState) {
    const metrics = getMetrics();
    const lessons = renderState && Array.isArray(renderState.lessons) ? renderState.lessons : [];
    const lessonStates = renderState && renderState.lessonStates ? renderState.lessonStates : {};

    if (isInsideRect(x, y, metrics.backLeft, metrics.backTop, metrics.backWidth, metrics.backHeight)) {
      return { type: "action", value: "home" };
    }

    for (let index = 0; index < lessons.length; index += 1) {
      const top = metrics.cardTop + index * (metrics.cardHeight + metrics.cardGap);
      if (isInsideRect(x, y, metrics.cardLeft, top, metrics.cardWidth, metrics.cardHeight)) {
        return lessonStates[lessons[index].id] && lessonStates[lessons[index].id].locked
          ? { type: "locked-lesson", value: lessons[index].id }
          : { type: "lesson", value: lessons[index].id };
      }
    }

    return null;
  }

  return {
    draw: draw,
    hitTest: hitTest,
    getMetrics: getMetrics
  };
}

module.exports = {
  createTutorialScene
};
