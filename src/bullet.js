export function create(x, y, vy, col) {
  let w = 2, h = 2,
    bounds = {
      x: x - (w / 2),
      y: y - (h / 2),
      w, h
    }, origin = { x, y };

  function update() {
    origin.x = x = x + (Math.random() - 0.5);
    origin.y = y = y + vy;

    bounds.x = x - (w / 2);
    bounds.y = y - (h / 2);

    return (y >= 0);
  }

  function draw(ctx) {
    ctx.fillStyle = col;
    ctx.fillRect(bounds.x, bounds.y, w, h);
  }

  return {
    bounds, origin,
    update, draw
  }
}