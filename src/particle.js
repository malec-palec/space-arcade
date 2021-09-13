import { chance } from "./utils";

export function create(x, y, color) {
  let speed = 2 + (chance(50) ? 1 : 0),
    angle = Math.random() * (Math.PI * 2),
    vx = speed * Math.cos(angle),
    vy = speed * Math.sin(angle),
    lifeTime = 0;

  function update() {
    x += vx;
    y += vy;
    return (lifeTime++ < 20);
  }

  function draw(ctx) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 1, 1);
  }

  return {
    update, draw
  }
}