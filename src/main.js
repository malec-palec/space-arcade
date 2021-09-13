import { initFont } from "./font/index";
import { font } from "./font/pixel";
import keyboard from "./keyboard";
import { create as createInvader } from "./invader";
import { create as createBullet } from "./bullet";
import { create as createGame } from "./game";
import { create as createPaddle } from "./paddle";
import { create as createTerrain } from "./terrain";
import { create as createView } from "./core/view";
import { chance, rectCollision } from "./utils";
import { WIDTH, HEIGHT, GROUND_LINE, CORE_LINE, HUD_H } from "./world";

// c goes for canvas
c.width = WIDTH;
c.height = HEIGHT;
c.style["image-rendering"] = "pixelated";
c.style.display = "none";

let ctx = c.getContext("2d");
ctx.imageSmoothingEnabled = false;

const numEnemies = 60;

let _targetScale = 0.89,
  _targetOffsetY = 0,
  _targetAngle = 0,
  viewProps = {
    scale: _targetScale,
    angle: _targetAngle,
    offX: 0.5,
    offY: _targetOffsetY,
    easing: 0.3
  },
  paddleProps = {
    acceleration: 0.24,
    friction: 0.95
  },
  playerBulletSpeed = -4,
  zoomHold = false,
  score = 0;

let invaders = [], playerBullets = [], particles = [],
  view = createView(WIDTH, HEIGHT * 2),
  terrain = createTerrain(WIDTH, HEIGHT),
  paddle = createPaddle(paddleProps.friction),
  director = createDirector(7, 20),
  hud = createMenu(),
  soundBox = createSoundBox(),
  game = createGame(setup, update, draw);

function setup() {
  hud.writeLine(`SCORE: ${score}`);

  paddle.init(ctx);
  terrain.init(ctx);

  for (let i = 0; i < numEnemies; i++) {
    if (director.canSpawn()) spawnEnemy();
  }

  view.init(viewProps, c);
}

function spawnEnemy() {
  let enemyModelHeight = 5,
    spawnPos = director.getSpawnPos();
  let invader = createInvader(
    spawnPos.x,
    Math.round(Math.random() * 64),
    3, enemyModelHeight,
    Math.floor(Math.random() * 32768),
    spawnPos.sector);
  invaders.push(invader);
}

function update() {
  terrain.update();
  paddle.update(terrain);

  invaders = invaders.filter(invader => {
    let alive = invader.update(terrain);
    if (alive) {
      let hit = rectCollision(invader.bounds, paddle.hitBox);
      if (hit) {
        score++;
        hud.writeLine(`SCORE: ${score}00`);

        alive = false;
      }
    }
    if (!alive) {
      soundBox.playHit();
      director.decreaseSectorCount(invader.getSector());
      particles.push(...invader.explode());
    } else {
      let { bounds } = invader;
      if (bounds.y + bounds.h > HEIGHT - CORE_LINE) {
        hud.writeLine(`SCORE: ${score}00 - GAME OVER - PRESS R TO RESTART`);
        game.stop();
      }
    }
    return alive;
  });

  playerBullets = playerBullets.filter(bullet => {
    let res = bullet.update();
    for (let i = invaders.length - 1; i > -1; i--) {
      let invader = invaders[i];
      if (rectCollision(invader.bounds, bullet.bounds)) {
        soundBox.playHit();
        score++;
        hud.writeLine(`SCORE: ${score}00`);

        director.decreaseSectorCount(invader.getSector());
        particles.push(...invader.explode());
        invaders.splice(i, 1);
        break;
      }
    }
    let { origin: bulletOrigin } = bullet;
    if (bulletOrigin.y > HEIGHT - GROUND_LINE) {
      let bulletOriginX = Math.round(bulletOrigin.x)
      if (terrain.getPixelAlpha(bulletOriginX, bulletOrigin.y))
        terrain.explode(bulletOriginX, bulletOrigin.y, 4);
    }
    return res;
  });

  if (invaders.length < numEnemies || chance(2)) {
    if (director.canSpawn()) spawnEnemy();
  }

  particles = particles.filter(particle => particle.update());

  // VIEW SCALE EASING
  let curScale = viewProps.scale,
    deltaScale = Math.abs(_targetScale - curScale);
  if (deltaScale > 0.001) {
    curScale += (_targetScale - curScale) * viewProps.easing / 2;
    view.setScale(viewProps.scale = curScale);
  }
  // VIEW OFFSET Y EASING
  let curOffY = viewProps.offY,
    deltaOffY = Math.abs(_targetOffsetY - curOffY);
  if (deltaOffY > 0.001) {
    curOffY += (_targetOffsetY - curOffY) * viewProps.easing / 2;
    view.setOffset(viewProps.offX, viewProps.offY = curOffY);
  }
  // VIEW ANGLE EASING
  let curAngle = viewProps.angle,
    deltaAngle = Math.abs(_targetAngle - curAngle);
  if (deltaAngle > 0.001) {
    curAngle += (_targetAngle - curAngle) * viewProps.easing / 2;
    view.setAngle(viewProps.angle = curAngle);
  } else {
    let p = paddle.getPosRatio() % 1,
      a = viewProps.angle;
    if (a < 0 && p > 0.5) p = p - 1;
    if (Math.abs(p - a) > 0.25) {
      zoomOut();
      if (!zoomHold) zoomHold = true;
    }
  }

  if (zoomHold && Math.abs(paddle.getVelX()) < 0.01) zoomIn();
}

function draw() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  terrain.draw(ctx);
  paddle.draw(ctx);

  invaders.forEach(invader => invader.draw(ctx));
  playerBullets.forEach(bullet => bullet.draw(ctx));
  particles.forEach(particle => particle.draw(ctx));

  view.draw(c);
}

// USER CONTROLS
let leftKey = keyboard(37),
  rightKey = keyboard(39),
  shift = keyboard(16),
  space = keyboard(32),
  mKey = keyboard(77),
  rKey = keyboard(82);

leftKey.press = () => paddle.setAccX(-paddleProps.acceleration);
leftKey.release = () => paddle.setAccX(0);
rightKey.press = () => paddle.setAccX(paddleProps.acceleration);
rightKey.release = () => paddle.setAccX(0);

space.press = () => {
  soundBox.playPew();
  let { x, y } = paddle.getBulletSpawnPos();
  playerBullets.push(createBullet(x, y, playerBulletSpeed, "red"));
}

mKey.press = () => {
  soundBox.switchMute();
}

rKey.press = () => {
  window.location.reload();
}

shift.press = zoomOut;
shift.release = zoomIn;

function zoomOut() {
  _targetAngle = 0;
  _targetScale = 1.41;
  _targetOffsetY = 0.5;
}

function zoomIn() {
  _targetAngle = paddle.getPosRatio() % 1;
  if (_targetAngle > 0.5) {
    _targetAngle = _targetAngle - 1;
  } else if (_targetAngle < -0.5) {
    _targetAngle = 1 + _targetAngle;
  }
  _targetScale = 0.89;
  _targetOffsetY = 0.0;

  zoomHold = false;
}

// GAME DIRECTOR
function createDirector(numSectors, sectorCapacity) {
  let sectors = new Array(numSectors).fill(0),
    secWidth = Math.round(WIDTH / numSectors),
    totalCount = 0, peakSectorIndex = 0;

  function canSpawnInSector(index) {
    return sectors[index] < sectorCapacity;
  }

  function getSectorPriorities(baseSectorIndex) {
    let priorities = [baseSectorIndex],
      len = (numSectors - 1) / 2;
    for (let i = 1; i <= len; i++) {
      let nextIndex = (baseSectorIndex + i) % numSectors,
        prevIndex = (baseSectorIndex - i);
      if (prevIndex < 0) prevIndex = numSectors + prevIndex;
      if (chance(50))
        priorities.push(nextIndex, prevIndex);
      else
        priorities.push(prevIndex, nextIndex);
    }
    return priorities;
  }

  function getSpawnPos() {
    if (chance(1))
      peakSectorIndex = Math.floor(Math.random() * numSectors);

    let priorities = getSectorPriorities(peakSectorIndex),
      sectorIndex = priorities.shift();
    while (!canSpawnInSector(sectorIndex)) {
      sectorIndex = priorities.shift();
    }

    sectors[sectorIndex]++;
    totalCount++;

    return {
      x: sectorIndex * secWidth + Math.round(Math.random() * secWidth),
      sector: sectorIndex
    }
  }

  function decreaseSectorCount(sectorIndex) {
    sectors[sectorIndex]--;
    totalCount--;
  }

  return {
    getSpawnPos,
    decreaseSectorCount,
    canSpawn: () => totalCount < sectorCapacity * numSectors
  };
}

// UI
function createMenu() {
  let menuW = WIDTH, menuH = HUD_H, textH = 20, textOffY = 5;

  menu.width = menuW;
  menu.height = menuH;
  let menuContext = menu.getContext("2d");
  let render = initFont(font, menuContext);

  writeLine("");

  function writeLine(text) {
    menuContext.fillStyle = "black";
    menuContext.fillRect(0, 0, menuW, menuH);
    render(text, 0, textOffY, textH, "white");
  }

  return { writeLine };
}

// SOUND
function createSoundBox() {
  let mute = false;

  let laserSound = jsfxr([2, 0, 0.22489224400401017, 0.09549238635077185, 0.23635858232669682, 0.7904206221041251, 0.22076118216218082, -0.334590885536479, 0, 0, 0, 0, 0, 0.14268572930257606, 0.1407204766846248, 0, 0, 0, 1, 0, 0, 0.023957396765223016, 0, 0.5]),
    laserPlayer = new Audio();
  laserPlayer.src = laserSound;

  let explosionSound = jsfxr([3, 0, 0.10620194759539255, 0.7098552264702449, 0.19705566552118225, 0.23804260137273073, 0, 0.29205304349669536, 0, 0, 0, 0, 0, 0, 0, 0, 0.5381613843694975, -0.28664236647301367, 1, 0, 0, 0, 0, 0.5]),
    explosionPlayer = new Audio();
  explosionPlayer.src = explosionSound;

  return {
    playHit: () => { if (!mute) explosionPlayer.play(); },
    playPew: () => { if (!mute) laserPlayer.play(); },
    switchMute: () => mute = !mute
  };
}
