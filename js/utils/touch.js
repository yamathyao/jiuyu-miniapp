function getTouchPoint(event) {
  const touch = event && event.touches && event.touches[0];

  if (!touch) {
    return null;
  }

  const x = touch.clientX != null ? touch.clientX : touch.x;
  const y = touch.clientY != null ? touch.clientY : touch.y;

  if (x == null || y == null) {
    return null;
  }

  return {
    x: x,
    y: y
  };
}

module.exports = {
  getTouchPoint
};
