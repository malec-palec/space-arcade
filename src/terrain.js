import { pixelate } from "./utils";
import { GROUND_LINE, CORE_LINE, HILLS_MAX_H } from "./world";

const R = 0.65, WATER_OFFSET = 8;

function gen(pts, l, r, d) {
  if ((l + 1) == r) return;
  let m = Math.floor((l + r) / 2);
  pts[m] = Math.round((pts[l] + pts[r]) / 2 + (Math.random() * 2 - 1) * d);
  d *= R;
  gen(pts, l, m, d);
  gen(pts, m, r, d);
}

function terraform(ctx, w, h, initH, displacement) {
  let colors = ["#055dd7", "#568d2e", "#c43653", "#b6213d"], curColor = 0;
  ctx.clearRect(0, 0, w, h);

  ctx.fillStyle = colors[curColor++];
  ctx.fillRect(0, initH - WATER_OFFSET, w, h - (initH - WATER_OFFSET));

  let segNum = 2 ** 7,
    segLen = Math.floor(w / segNum),
    segOff = Math.floor((w - segLen * segNum) / 2),
    heights = new Array(segNum + 1).fill(initH);
  gen(heights, 0, segNum, displacement);

  ctx.fillStyle = colors[curColor++];
  ctx.beginPath();
  ctx.moveTo(0, initH);
  for (let i = 0; i < heights.length; i++) {
    ctx.lineTo(segOff + segLen * i, heights[i]);
  }
  ctx.lineTo(w, initH);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.lineTo(0, initH);
  ctx.fill();

  ctx.fillStyle = colors[curColor++];
  ctx.beginPath();
  ctx.moveTo(0, initH);
  for (let i = 0; i < heights.length; i++) {
    ctx.lineTo(segOff + segLen * i, h - (h - heights[i]) * 0.75);
  }
  ctx.lineTo(w, initH);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.lineTo(0, initH);
  ctx.fill();

  ctx.strokeStyle = "#d42449";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, h - CORE_LINE);
  ctx.lineTo(w, h - CORE_LINE);
  ctx.stroke();

  ctx.fillStyle = colors[curColor++];
  ctx.fillRect(0, h - CORE_LINE, w, CORE_LINE);

  let imageData = ctx.getImageData(0, 0, w, h),
    pixels = pixelate(imageData);

  return { imageData, pixels };
}

export function create(W, H) {
  let seg,
    x = 0, vx = 0; speed = 2;

  function init(ctx) {
    seg = terraform(ctx, W, H, H - GROUND_LINE, HILLS_MAX_H);
  }

  function getPixelAlpha(x, y) {
    let n = (y * W + x) * 4;
    return seg.pixels[n + 3];
  }

  function removePixel(x, y) {
    let n = (y * W + x) * 4;
    seg.pixels[n] = 0;
    seg.pixels[n + 1] = 0;
    seg.pixels[n + 2] = 0;
    seg.pixels[n + 3] = 0;
  }

  function explode(x, y, radius) {
    for (xPos = x - radius; xPos <= x + radius; xPos++) {
      for (yPos = y - radius; yPos <= y + radius; yPos++) {
        if (Math.pow(xPos - x, 2) + Math.pow(yPos - y, 2) < radius * radius) {
          if (getPixelAlpha(xPos, yPos) !== 0) {
            removePixel(xPos, yPos);
          }
        }
      }
    }
  }

  return {
    init,
    update: () => {
      x += vx;
      if (x >= W) x = 0;
      if (x <= -W) x = 0;
    },
    draw: (ctx) => {
      ctx.putImageData(seg.imageData, x, 0);
      if (x > 0) ctx.putImageData(seg.imageData, x - W, 0);
      else if (x < 0) ctx.putImageData(seg.imageData, x + W, 0);
    },
    getPaddleHeight: (x) => {
      let y = H;
      while (getPixelAlpha(x, y) !== 0) {
        y--;
      }
      return y;
    },
    getPixelAlpha,
    explode
  }
}

/*
function line(pixels, x0, y0, x1, y1, r, g, b, a) {
  let dx = Math.abs(x1 - x0),
    sx = x0 < x1 ? 1 : -1;
  let dy = Math.abs(y1 - y0),
    sy = y0 < y1 ? 1 : -1;
  let err = (dx > dy ? dx : -dy) / 2;
  while (true) {
    point(pixels, x0, y0, r, g, b, a);
    if (x0 === x1 && y0 === y1) break;
    let e2 = err;
    if (e2 > -dx) {
      err -= dy;
      x0 += sx;
    }
    if (e2 < dy) {
      err += dx;
      y0 += sy;
    }
  }
} */