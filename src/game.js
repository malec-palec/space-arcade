const FRAME = 1000 / 60,
  maxAccum = FRAME * 2;

export function create(setup, update, draw) {
  let accum = FRAME, last = 0, isRunning = true;

  setup();
  function loop() {
    if (!isRunning) return;
    requestAnimationFrame(loop);

    let time = performance.now();
    let elapsed = time - last;
    last = time;

    accum += elapsed;
    if (accum > maxAccum) accum = maxAccum;

    while (accum >= FRAME) {
      update();
      accum -= FRAME;
    }
    draw();
  }
  loop();

  return {
    stop: () => isRunning = false
  };
}