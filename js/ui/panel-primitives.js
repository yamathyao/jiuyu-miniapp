function drawRoundedRectPath(context, left, top, width, height, radius) {
  if (typeof context.arcTo !== "function") {
    context.beginPath();
    context.moveTo(left, top);
    context.lineTo(left + width, top);
    context.lineTo(left + width, top + height);
    context.lineTo(left, top + height);
    context.lineTo(left, top);
    if (typeof context.closePath === "function") {
      context.closePath();
    }
    return;
  }

  const right = left + width;
  const bottom = top + height;
  const safeRadius = Math.min(radius, width / 2, height / 2);

  context.beginPath();
  context.moveTo(left + safeRadius, top);
  context.lineTo(right - safeRadius, top);
  context.arcTo(right, top, right, top + safeRadius, safeRadius);
  context.lineTo(right, bottom - safeRadius);
  context.arcTo(right, bottom, right - safeRadius, bottom, safeRadius);
  context.lineTo(left + safeRadius, bottom);
  context.arcTo(left, bottom, left, bottom - safeRadius, safeRadius);
  context.lineTo(left, top + safeRadius);
  context.arcTo(left, top, left + safeRadius, top, safeRadius);
  if (typeof context.closePath === "function") {
    context.closePath();
  }
}

function fillRoundedRect(context, left, top, width, height, radius, fillStyle) {
  context.fillStyle = fillStyle;
  drawRoundedRectPath(context, left, top, width, height, radius);
  if (typeof context.fill === "function") {
    context.fill();
  }
}

function strokeRoundedRect(context, left, top, width, height, radius, strokeStyle, lineWidth) {
  context.lineWidth = lineWidth;
  context.strokeStyle = strokeStyle;
  drawRoundedRectPath(context, left, top, width, height, radius);
  if (typeof context.stroke === "function") {
    context.stroke();
  }
}

function drawPlaque(context, left, top, width, height, label, style) {
  const plaqueStyle = style || {};
  const radius = plaqueStyle.radius || 18;
  const borderWidth = plaqueStyle.borderWidth || 1.1;
  const showOrnament = plaqueStyle.showOrnament !== false;

  fillRoundedRect(
    context,
    left,
    top,
    width,
    height,
    radius,
    plaqueStyle.fill || "#ffffff"
  );
  strokeRoundedRect(
    context,
    left,
    top,
    width,
    height,
    radius,
    plaqueStyle.border || "#d0d7de",
    borderWidth
  );

  if (showOrnament) {
    context.lineWidth = plaqueStyle.ornamentWidth || 1;
    context.strokeStyle = plaqueStyle.ornament || "#c98b6f";
    context.beginPath();
    context.moveTo(left + 16, top + height / 2);
    context.lineTo(left + 30, top + height / 2);
    context.moveTo(left + width - 30, top + height / 2);
    context.lineTo(left + width - 16, top + height / 2);
    if (typeof context.stroke === "function") {
      context.stroke();
    }
  }

  context.fillStyle = plaqueStyle.textColor || "#1f2933";
  context.font = plaqueStyle.font || "bold 16px sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(label, left + width / 2, top + height / 2);
}

module.exports = {
  drawRoundedRectPath: drawRoundedRectPath,
  fillRoundedRect: fillRoundedRect,
  strokeRoundedRect: strokeRoundedRect,
  drawPlaque: drawPlaque
};
