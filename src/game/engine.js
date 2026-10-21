import {
  BALL_COLOR,
  BALL_MIN_HORIZONTAL,
  BALL_MIN_VERTICAL,
  BALL_RADIUS,
  BALL_TRAIL_LENGTH,
  BASE_BALL_SPEED,
  BRICK_COINS,
  BRICK_SCORE,
  MAX_FRAME_TIME,
  MAX_SPEED_MULTIPLIER,
  PADDLE_HEIGHT,
  PADDLE_KEY_SPEED,
  PADDLE_MAX_ANGLE,
  PADDLE_WIDE_WIDTH,
  PADDLE_WIDTH,
  PADDLE_Y,
  PHYSICS_STEP,
  PORTAL_COOLDOWN,
  POWER_UP_FALL_SPEED,
  POWER_UP_SIZE,
  SLOW_BALL_MULTIPLIER,
  SPEED_INCREMENT,
  STARTING_LIVES,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from "./constants";
import { buildLevel } from "./levels";
import { COIN_RUSH_AMOUNT, POWER_UPS_BY_ID } from "./powerUps";
import { renderGame } from "./render";

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function createBall(overrides = {}) {
  return {
    x: WORLD_WIDTH / 2,
    y: PADDLE_Y - BALL_RADIUS,
    vx: 0,
    vy: 0,
    radius: BALL_RADIUS,
    speed: BASE_BALL_SPEED,
    bounceCount: 0,
    trail: [],
    attached: true,
    attachOffset: 0,
    lost: false,
    color: BALL_COLOR,
    ...overrides,
  };
}

function setVelocity(ball, angle) {
  ball.vx = ball.speed * Math.sin(angle);
  ball.vy = -ball.speed * Math.cos(angle);
}

function enforceMinAngle(ball) {
  const speed = Math.hypot(ball.vx, ball.vy);
  if (speed === 0) return;
  let nx = ball.vx / speed;
  let ny = ball.vy / speed;
  if (Math.abs(nx) < BALL_MIN_HORIZONTAL) {
    nx = (nx === 0 ? (Math.random() < 0.5 ? -1 : 1) : Math.sign(nx)) * BALL_MIN_HORIZONTAL;
  }
  if (Math.abs(ny) < BALL_MIN_VERTICAL) {
    ny = (ny === 0 ? -1 : Math.sign(ny)) * BALL_MIN_VERTICAL;
  }
  const length = Math.hypot(nx, ny);
  ball.vx = (nx / length) * speed;
  ball.vy = (ny / length) * speed;
}

/**
 * Owns the simulation and the requestAnimationFrame loop. It knows nothing
 * about React: the UI subscribes through `onChange`, which only fires when a
 * HUD value actually changes (not every frame).
 *
 * Phases: menu -> playing <-> paused -> levelComplete | gameOver
 */
export class GameEngine {
  constructor(canvas, onChange) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.onChange = onChange;
    this.scale = canvas.width / WORLD_WIDTH;
    this.rafId = null;
    this.lastTime = null;
    this.accumulator = 0;
    this.lastSnapshotKey = "";
    this.input = { left: false, right: false, pointerX: null };
    this.newGame(1);
  }

  // ---- Lifecycle ---------------------------------------------------------

  start() {
    const loop = (time) => {
      this.frame(time);
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  destroy() {
    cancelAnimationFrame(this.rafId);
    this.rafId = null;
  }

  // Size the backing store for crisp rendering on high-DPI screens.
  resize(cssWidth, cssHeight, devicePixelRatio = 1) {
    this.canvas.width = Math.round(cssWidth * devicePixelRatio);
    this.canvas.height = Math.round(cssHeight * devicePixelRatio);
    this.scale = this.canvas.width / WORLD_WIDTH;
    this.render();
  }

  // ---- Commands from the UI ----------------------------------------------

  newGame(level = 1) {
    this.score = 0;
    this.lives = STARTING_LIVES;
    this.maxLives = STARTING_LIVES;
    this.coins = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.loadLevel(level);
    this.phase = "menu";
    this.emit();
  }

  nextLevel() {
    this.loadLevel(this.level + 1);
    this.phase = "playing";
    this.emit();
  }

  play() {
    if (this.phase === "menu" || this.phase === "paused") {
      this.phase = "playing";
      this.emit();
    }
  }

  pause() {
    if (this.phase === "playing") {
      this.phase = "paused";
      this.emit();
    }
  }

  togglePause() {
    if (this.phase === "paused") this.play();
    else this.pause();
  }

  // Release every ball resting on the paddle.
  launch() {
    if (this.phase !== "playing") return;
    for (const ball of this.balls) {
      if (!ball.attached) continue;
      ball.attached = false;
      setVelocity(ball, (Math.random() - 0.5) * (Math.PI / 3));
    }
  }

  // Paddle follows this world-space x (mouse / touch drag) until a key is used.
  setPointerX(x) {
    this.input.pointerX = x;
  }

  setKey(direction, pressed) {
    this.input[direction] = pressed;
    if (pressed) this.input.pointerX = null;
  }

  get paddleCenter() {
    return this.paddle.cx;
  }

  // ---- Internals ---------------------------------------------------------

  loadLevel(level) {
    const { bricks, portals } = buildLevel(level);
    this.level = level;
    this.bricks = bricks;
    this.portals = portals;
    this.balls = [createBall()];
    this.particles = [];
    this.fallingPowerUps = [];
    this.powerUpTimers = new Map();
    this.paddle = { cx: WORLD_WIDTH / 2, width: PADDLE_WIDTH };
    this.input.pointerX = null;
    this.stars = 0;
    this.accumulator = 0;
  }

  frame(time) {
    const elapsed =
      this.lastTime === null ? 0 : Math.min((time - this.lastTime) / 1000, MAX_FRAME_TIME);
    this.lastTime = time;

    if (this.phase === "playing") {
      this.accumulator += elapsed;
      while (this.accumulator >= PHYSICS_STEP && this.phase === "playing") {
        this.step(PHYSICS_STEP);
        this.accumulator -= PHYSICS_STEP;
      }
    }

    this.render();
    this.emit();
  }

  render() {
    renderGame(this.ctx, this, this.scale);
  }

  step(dt) {
    this.updatePowerUpTimers(dt);
    this.updatePaddle(dt);
    for (const ball of this.balls) this.updateBall(ball, dt);
    this.balls = this.balls.filter((ball) => !ball.lost);
    this.updateParticles(dt);
    this.updateFallingPowerUps(dt);
    this.updatePortals(dt);
    for (const brick of this.bricks) {
      brick.hitAnimation = Math.max(0, brick.hitAnimation - dt * 6);
    }
    this.checkRoundEnd();
  }

  updatePowerUpTimers(dt) {
    for (const [type, remaining] of this.powerUpTimers) {
      if (remaining - dt > 0) {
        this.powerUpTimers.set(type, remaining - dt);
        continue;
      }
      this.powerUpTimers.delete(type);
      if (type === "widePaddle") this.paddle.width = PADDLE_WIDTH;
      if (type === "stickyPaddle") this.launch();
    }
  }

  updatePaddle(dt) {
    const { left, right, pointerX } = this.input;
    const direction = (right ? 1 : 0) - (left ? 1 : 0);

    if (direction !== 0) {
      this.paddle.cx += direction * PADDLE_KEY_SPEED * dt;
    } else if (pointerX !== null) {
      this.paddle.cx = pointerX;
    }

    const half = this.paddle.width / 2;
    this.paddle.cx = clamp(this.paddle.cx, half, WORLD_WIDTH - half);
  }

  updateBall(ball, dt) {
    ball.trail.push({ x: ball.x, y: ball.y });
    if (ball.trail.length > BALL_TRAIL_LENGTH) ball.trail.shift();

    if (ball.attached) {
      ball.x = this.paddle.cx + ball.attachOffset;
      ball.y = PADDLE_Y - ball.radius;
      return;
    }

    const multiplier = this.powerUpTimers.has("slowBall") ? SLOW_BALL_MULTIPLIER : 1;
    ball.x += ball.vx * multiplier * dt;
    ball.y += ball.vy * multiplier * dt;

    this.collideWalls(ball);
    if (ball.y - ball.radius > WORLD_HEIGHT) {
      ball.lost = true;
      this.spawnParticles(ball.x, WORLD_HEIGHT, "#ff0000", 20);
      return;
    }
    this.collidePaddle(ball);
    this.collideBricks(ball);
    this.collidePortals(ball);
    if (!ball.attached) enforceMinAngle(ball);
  }

  collideWalls(ball) {
    let bounced = false;
    if (ball.x - ball.radius < 0) {
      ball.x = ball.radius;
      ball.vx = Math.abs(ball.vx);
      bounced = true;
    } else if (ball.x + ball.radius > WORLD_WIDTH) {
      ball.x = WORLD_WIDTH - ball.radius;
      ball.vx = -Math.abs(ball.vx);
      bounced = true;
    }
    if (ball.y - ball.radius < 0) {
      ball.y = ball.radius;
      ball.vy = Math.abs(ball.vy);
      bounced = true;
    }
    if (bounced) this.spawnParticles(ball.x, ball.y, ball.color, 5);
  }

  collidePaddle(ball) {
    const half = this.paddle.width / 2;
    const hit =
      ball.vy > 0 &&
      ball.y + ball.radius >= PADDLE_Y &&
      ball.y - ball.radius <= PADDLE_Y + PADDLE_HEIGHT &&
      ball.x + ball.radius >= this.paddle.cx - half &&
      ball.x - ball.radius <= this.paddle.cx + half;
    if (!hit) return;

    // Where the ball lands on the paddle (-1 = left edge, 1 = right edge)
    // decides the bounce angle.
    const hitPos = clamp((ball.x - this.paddle.cx) / half, -1, 1);
    setVelocity(ball, hitPos * PADDLE_MAX_ANGLE);
    ball.y = PADDLE_Y - ball.radius;

    if (this.powerUpTimers.has("stickyPaddle")) {
      ball.attached = true;
      ball.attachOffset = ball.x - this.paddle.cx;
    }
    this.spawnParticles(ball.x, ball.y, BALL_COLOR, 8);
  }

  collideBricks(ball) {
    // Resolve at most one brick per step; removing it after the search keeps
    // the array stable while we look.
    const index = this.bricks.findIndex((brick) => {
      const closestX = clamp(ball.x, brick.x, brick.x + brick.width);
      const closestY = clamp(ball.y, brick.y, brick.y + brick.height);
      return (ball.x - closestX) ** 2 + (ball.y - closestY) ** 2 < ball.radius ** 2;
    });
    if (index === -1) return;
    const brick = this.bricks[index];

    // Bounce off the side with the smallest overlap.
    const overlaps = {
      left: ball.x + ball.radius - brick.x,
      right: brick.x + brick.width - (ball.x - ball.radius),
      top: ball.y + ball.radius - brick.y,
      bottom: brick.y + brick.height - (ball.y - ball.radius),
    };
    const side = Object.keys(overlaps).reduce((a, b) => (overlaps[a] <= overlaps[b] ? a : b));
    if (side === "left") {
      ball.vx = -Math.abs(ball.vx);
      ball.x = brick.x - ball.radius;
    } else if (side === "right") {
      ball.vx = Math.abs(ball.vx);
      ball.x = brick.x + brick.width + ball.radius;
    } else if (side === "top") {
      ball.vy = -Math.abs(ball.vy);
      ball.y = brick.y - ball.radius;
    } else {
      ball.vy = Math.abs(ball.vy);
      ball.y = brick.y + brick.height + ball.radius;
    }

    // Every brick bounce makes the ball a little faster.
    ball.bounceCount++;
    const newSpeed = Math.min(
      BASE_BALL_SPEED * (1 + SPEED_INCREMENT * ball.bounceCount),
      BASE_BALL_SPEED * MAX_SPEED_MULTIPLIER,
    );
    const magnitude = Math.hypot(ball.vx, ball.vy) || 1;
    ball.vx = (ball.vx / magnitude) * newSpeed;
    ball.vy = (ball.vy / magnitude) * newSpeed;
    ball.speed = newSpeed;

    brick.health--;
    brick.hitAnimation = 1;
    const cx = brick.x + brick.width / 2;
    const cy = brick.y + brick.height / 2;

    if (brick.health > 0) {
      this.spawnParticles(ball.x, ball.y, brick.color, 5);
      return;
    }

    this.bricks.splice(index, 1);
    this.score += BRICK_SCORE * (this.combo + 1);
    this.combo++;
    this.maxCombo = Math.max(this.maxCombo, this.combo);
    this.coins += BRICK_COINS;
    this.spawnParticles(cx, cy, brick.color, 15);

    if (brick.powerUp) {
      this.fallingPowerUps.push({
        x: cx,
        y: cy,
        type: brick.powerUp,
        color: brick.color,
      });
    }
  }

  collidePortals(ball) {
    this.portals.forEach((portal, index) => {
      if (portal.cooldown > 0) return;
      const distance = Math.hypot(ball.x - portal.x, ball.y - portal.y);
      if (distance >= portal.radius + ball.radius) return;

      const other = this.portals[1 - index];
      ball.x = other.x;
      ball.y = other.y;
      portal.cooldown = PORTAL_COOLDOWN;
      other.cooldown = PORTAL_COOLDOWN;
      this.spawnParticles(portal.x, portal.y, portal.color, 20);
      this.spawnParticles(other.x, other.y, other.color, 20);
    });
  }

  updateParticles(dt) {
    const shrink = 0.98 ** (dt * 60);
    this.particles = this.particles.filter((particle) => {
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vy += 360 * dt;
      particle.life -= 1.2 * dt;
      particle.radius *= shrink;
      return particle.life > 0;
    });
  }

  updateFallingPowerUps(dt) {
    const half = this.paddle.width / 2;
    this.fallingPowerUps = this.fallingPowerUps.filter((powerUp) => {
      powerUp.y += POWER_UP_FALL_SPEED * dt;

      const caught =
        powerUp.y + POWER_UP_SIZE.height / 2 >= PADDLE_Y &&
        powerUp.y - POWER_UP_SIZE.height / 2 <= PADDLE_Y + PADDLE_HEIGHT &&
        powerUp.x + POWER_UP_SIZE.width / 2 >= this.paddle.cx - half &&
        powerUp.x - POWER_UP_SIZE.width / 2 <= this.paddle.cx + half;
      if (caught) {
        this.activatePowerUp(powerUp.type);
        this.spawnParticles(powerUp.x, powerUp.y, powerUp.color, 15);
        return false;
      }
      return powerUp.y < WORLD_HEIGHT;
    });
  }

  updatePortals(dt) {
    for (const portal of this.portals) {
      portal.cooldown = Math.max(0, portal.cooldown - dt);
      for (const particle of portal.particles) {
        particle.angle += particle.speed * dt;
        particle.alpha = 0.5 + Math.sin(particle.angle * 3) * 0.3;
      }
    }
  }

  activatePowerUp(type) {
    const { duration } = POWER_UPS_BY_ID[type];
    if (duration) this.powerUpTimers.set(type, duration);

    switch (type) {
      case "multiball": {
        const source = this.balls.find((ball) => !ball.attached) ?? this.balls[0];
        if (!source) break;
        ["#ff6b6b", "#4ecdc4"].forEach((color, i) => {
          const ball = createBall({
            x: source.x,
            y: source.y,
            speed: source.speed,
            bounceCount: source.bounceCount,
            attached: false,
            color,
          });
          setVelocity(ball, (i === 0 ? -1 : 1) * (Math.PI / 6));
          this.balls.push(ball);
        });
        break;
      }
      case "widePaddle":
        this.paddle.width = PADDLE_WIDE_WIDTH;
        break;
      case "extraLife":
        this.lives++;
        this.maxLives = Math.max(this.maxLives, this.lives);
        break;
      case "coins":
        this.coins += COIN_RUSH_AMOUNT;
        break;
    }
  }

  checkRoundEnd() {
    if (this.balls.length === 0) {
      this.lives--;
      this.combo = 0;
      if (this.lives <= 0) {
        this.phase = "gameOver";
        return;
      }
      // Fresh ball at base speed after losing a life.
      this.balls.push(createBall({ x: this.paddle.cx }));
    }

    if (this.bricks.length === 0) {
      this.stars = clamp(this.lives, 1, 3);
      this.phase = "levelComplete";
    }
  }

  spawnParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = 120 + Math.random() * 180;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 2 + Math.random() * 3,
        color,
        life: 1,
      });
    }
  }

  // ---- UI snapshot -------------------------------------------------------

  snapshot() {
    const leadBall = this.balls.find((ball) => !ball.attached) ?? this.balls[0];
    return {
      phase: this.phase,
      level: this.level,
      score: this.score,
      lives: this.lives,
      maxLives: this.maxLives,
      coins: this.coins,
      combo: this.combo,
      maxCombo: this.maxCombo,
      stars: this.stars,
      awaitingLaunch: this.balls.some((ball) => ball.attached),
      speedBoost: Math.round(((leadBall?.speed ?? BASE_BALL_SPEED) / BASE_BALL_SPEED - 1) * 100),
      activePowerUps: [...this.powerUpTimers].map(([type, remaining]) => ({
        type,
        secondsLeft: Math.ceil(remaining),
      })),
    };
  }

  emit() {
    const snapshot = this.snapshot();
    const key = JSON.stringify(snapshot);
    if (key === this.lastSnapshotKey) return;
    this.lastSnapshotKey = key;
    this.onChange(snapshot);
  }
}
