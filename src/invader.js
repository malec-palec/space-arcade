import { WIDTH, HEIGHT, GROUND_LINE, HILLS_MAX_H } from "./world";
import { chance } from "./utils";
import { create as createParticle } from "./particle";

export function create(x, y, w, h, i, sector) {
  let model = createModel(w, h, i), vx = 0, vy = 0, scale = 2;
  w = (w * 2 - 1);
  let bounds = { x, y, w: w * scale, h: h * scale },
    col = colorize(),
    dir = chance(50) ? -w : w,
    origin = { x: x + bounds.w / 2, y: y + bounds.h / 2 };

  function update(terrain) {
    vy = chance(25) ? 1 : 0;

    vx = chance(0.5) ? dir : 0;
    if (chance(0.1)) dir *= -1;

    x += vx;
    if (x < 0) x = 0;
    if (x + bounds.w > WIDTH) x = x - bounds.w;

    bounds.x = x;
    bounds.y = y += vy;

    origin.x = x + bounds.w / 2;
    origin.y = y + bounds.h / 2;

    if (y > HEIGHT - GROUND_LINE - HILLS_MAX_H) {
      let hit = terrain.getPixelAlpha(origin.x, origin.y);
      if (hit) {
        terrain.explode(origin.x, origin.y - (bounds.h * 1.5), bounds.h * 2);
        return false;
      }
    }
    return true;
  }

  function explode() {
    let prob = y / (HEIGHT - GROUND_LINE),
      particles = [];
    for (let ix = 0; ix < w; ix++) {
      for (let iy = 0; iy < h; iy++) {
        if (model.getPixelAt(ix, iy) && chance(50 + 50 * prob)) {
          particles.push(createParticle(x + ix * scale, y + iy * scale, col));
        }
      }
    }
    return particles;
  }

  function draw(ctx) {
    ctx.fillStyle = col;
    for (let ix = 0; ix < w; ix++) {
      for (let iy = 0; iy < h; iy++) {
        if (model.getPixelAt(ix, iy))
          ctx.fillRect(x + ix * scale, y + iy * scale, scale, scale);
      }
    }
  }

  return {
    bounds, origin, update, draw, explode,
    getSector: () => sector
  };
}

function createModel(width, height, index) {
  let pixels = [];
  for (let i = 0; i < width * height; i++) {
    pixels.push(index & (1 << i));
  }
  return {
    getPixelAt: (x, y) => {
      if (x >= width) {
        x = width * 2 - 2 - x;
      }
      return pixels[y * width + x];
    }
  };
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function colorize() {
  let h = randomInt(0, 360),
    s = randomInt(42, 98),
    l = randomInt(40, 90);
  return `hsl(${h},${s}%,${l}%)`;
}