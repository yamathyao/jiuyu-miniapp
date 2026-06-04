function boot() {
  if (typeof wx === "undefined" || !wx.createCanvas) {
    return;
  }

  const canvas = wx.createCanvas();
  const context = canvas.getContext("2d");

  context.fillStyle = "#f7f4ef";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#1f2933";
  context.font = "24px sans-serif";
  context.fillText("Jiuyu Minigame Booting", 24, 48);
}

boot();
