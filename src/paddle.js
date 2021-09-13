import { pixelate } from "./utils";
import { WIDTH, HEIGHT, GROUND_LINE } from "./world";

const SHOOT_OFFSET = 1;

export function create(friction) {
  let w = 16, hw = w / 2, h = 8, hh = h / 2,
    px = 0, y = HEIGHT, vx = 0, accX = 0, off = SHOOT_OFFSET,
    imageBitmap,
    getPosX = () => Math.round(((px % WIDTH) + WIDTH) % WIDTH),
    hitBox = { x: px - hw / 2, y: y - hh, w: hw, h: hh };

  function init(ctx) {
    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = "#F5F5F5";
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(w / 2, 0);
    ctx.lineTo(w, h);
    ctx.fill();

    let imageData = ctx.getImageData(0, 0, w, h);
    pixelate(imageData);

    createImageBitmap(imageData).then((bitmap) => imageBitmap = bitmap);
  }

  function update(terrain) {
    vx += accX;
    vx *= friction;
    px += vx;

    let x = getPosX();
    y = terrain.getPaddleHeight(x) - off;

    hitBox.x = x - hw / 2;
    hitBox.y = y - hh;

    off = SHOOT_OFFSET;
  }

  function draw(ctx) {
    if (imageBitmap) {
      let x = getPosX(),
        dx = x - hw;
      if (dx < 0)
        ctx.drawImage(imageBitmap, WIDTH + dx, y - h);
      dx = hw - (WIDTH - x);
      if (dx >= 0)
        ctx.drawImage(imageBitmap, dx - w, y - h);

      ctx.drawImage(imageBitmap, x - hw, y - h);
    }
  }

  function getBulletSpawnPos() {
    off = 0;
    return { x: getPosX(), y: y - h };
  }

  return {
    hitBox,
    init, update, draw,
    getPosRatio: () => px / WIDTH,
    getAngleRatio: () => getPosX() / WIDTH,
    setVelX: (vel) => vx = vel,
    getVelX: () => vx,
    setAccX: (acc) => accX = acc,
    getBulletSpawnPos,
    setFriction: (val) => { friction = val }
  };
}