function setAlpha(context, alpha) {
  const previous = typeof context.globalAlpha === "number" ? context.globalAlpha : 1;
  context.globalAlpha = alpha;
  return previous;
}

function restoreAlpha(context, alpha) {
  context.globalAlpha = alpha;
}

function noise(seed) {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

function buildStrokeProfile(left, top, width, height, seed, config) {
  const pointsTop = [];
  const pointsBottom = [];
  const segments = Math.max(24, Math.floor(width / 10));
  const centerY = top + height / 2;
  const inset = config.inset || 0;
  const usableWidth = Math.max(12, width - inset * 2);

  for (let index = 0; index <= segments; index += 1) {
    const t = index / segments;
    const x = left + inset + usableWidth * t;
    const taper = Math.pow(Math.sin(Math.PI * t), 0.42);
    const body = Math.max(height * 0.08, height * (0.18 + config.bodyScale * taper));
    const fringe = (1 - taper) * height * config.fringeScale;
    const topNoise = (noise(seed + index * 1.37) - 0.5) * config.roughness;
    const bottomNoise = (noise(seed + 100 + index * 1.11) - 0.5) * config.roughness;
    const topFleck = noise(seed + 200 + index * 0.77) * fringe;
    const bottomFleck = noise(seed + 300 + index * 0.93) * fringe;

    pointsTop.push({
      x: x,
      y: centerY - body + topNoise - topFleck
    });
    pointsBottom.push({
      x: x,
      y: centerY + body + bottomNoise + bottomFleck
    });
  }

  return {
    top: pointsTop,
    bottom: pointsBottom
  };
}

function fillProfile(context, profile, fillStyle, alpha) {
  const previousAlpha = setAlpha(context, alpha);

  context.fillStyle = fillStyle;
  context.beginPath();
  context.moveTo(profile.top[0].x, profile.top[0].y);

  profile.top.forEach(function (point) {
    context.lineTo(point.x, point.y);
  });

  for (let index = profile.bottom.length - 1; index >= 0; index -= 1) {
    context.lineTo(profile.bottom[index].x, profile.bottom[index].y);
  }

  if (typeof context.closePath === "function") {
    context.closePath();
  }
  if (typeof context.fill === "function") {
    context.fill();
  }

  restoreAlpha(context, previousAlpha);
}

function carveDryBrush(context, left, top, width, height, seed) {
  const previousComposite = context.globalCompositeOperation;
  const previousAlpha = setAlpha(context, 0.22);
  const slots = Math.max(8, Math.floor(width / 28));

  context.globalCompositeOperation = "destination-out";
  context.fillStyle = "#000000";

  for (let index = 0; index < slots; index += 1) {
    const t = index / Math.max(1, slots - 1);
    const x = left + 12 + t * (width - 24);
    const sliceWidth = 6 + noise(seed + index * 2.13) * 16;
    const sliceHeight = 2 + noise(seed + 50 + index * 1.71) * 5;
    const y = top + 8 + noise(seed + 90 + index * 1.49) * (height - 18);

    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(x + sliceWidth * 0.45, y - sliceHeight * 0.5);
    context.lineTo(x + sliceWidth, y);
    context.lineTo(x + sliceWidth * 0.5, y + sliceHeight * 0.65);
    if (typeof context.closePath === "function") {
      context.closePath();
    }
    if (typeof context.fill === "function") {
      context.fill();
    }
  }

  context.globalCompositeOperation = previousComposite;
  restoreAlpha(context, previousAlpha);
}

function drawFeatherEnds(context, left, top, width, height, palette) {
  const centerY = top + height / 2;
  const leftAlpha = setAlpha(context, 0.34);

  context.strokeStyle = palette.edgeFill;
  context.lineCap = "round";
  context.lineJoin = "round";

  for (let index = 0; index < 5; index += 1) {
    const yOffset = (index - 2) * (height * 0.12);
    const length = 8 + index * 3;

    context.beginPath();
    context.lineWidth = 1.2 + (4 - index) * 0.18;
    context.moveTo(left + 8 + index * 2, centerY + yOffset);
    context.lineTo(left - length, centerY + yOffset * 0.9);
    context.stroke();

    context.beginPath();
    context.moveTo(left + width - 8 - index * 2, centerY - yOffset);
    context.lineTo(left + width + length, centerY - yOffset * 0.9);
    context.stroke();
  }

  restoreAlpha(context, leftAlpha);
}

function drawBrushStroke(context, left, top, width, height, palette) {
  const baseProfile = buildStrokeProfile(left, top, width, height, 14.2, {
    inset: 0,
    bodyScale: 0.26,
    fringeScale: 0.28,
    roughness: height * 0.22
  });
  const edgeProfile = buildStrokeProfile(left, top, width, height, 8.4, {
    inset: 0,
    bodyScale: 0.29,
    fringeScale: 0.36,
    roughness: height * 0.28
  });
  const washProfile = buildStrokeProfile(left, top, width, height, 21.7, {
    inset: 12,
    bodyScale: 0.16,
    fringeScale: 0.12,
    roughness: height * 0.1
  });

  fillProfile(context, edgeProfile, palette.edgeFill, 0.22);
  fillProfile(context, baseProfile, palette.baseFill, 0.78);
  fillProfile(context, washProfile, palette.washFill, 0.18);
  carveDryBrush(context, left, top, width, height, 33.9);
  drawFeatherEnds(context, left, top, width, height, palette);
}

function drawBrushButton(context, left, top, width, height, label, style) {
  const palette = style || {};

  drawBrushStroke(context, left, top, width, height, {
    baseFill: palette.baseFill || "#d4b198",
    washFill: palette.washFill || "#f2e5d6",
    edgeFill: palette.edgeFill || "#b68568"
  });

  context.fillStyle = palette.textColor || "#4e342f";
  context.font = palette.font || "bold 18px sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(label, left + width / 2, top + height / 2);
}

module.exports = {
  drawBrushButton: drawBrushButton
};
