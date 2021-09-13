const threshold = 0.5 * 255;

export function pixelate(imageData) {
  let pixels = imageData.data,
    len = pixels.length;
  for (i = 0; i < len; i += 4) {
    pixels[i + 3] = pixels[i + 3] < threshold ? 0 : 255;
  }
  return pixels;
}

export const chance = (percent) => Math.random() < (percent / 100);

export function rectCollision(rect1, rect2) {
  return (rect1.x < rect2.x + rect2.w &&
    rect1.x + rect1.w > rect2.x &&
    rect1.y < rect2.y + rect2.h &&
    rect1.y + rect1.h > rect2.y);
}