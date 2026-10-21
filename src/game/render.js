import { PADDLE_HEIGHT, PADDLE_Y, POWER_UP_SIZE, WORLD_HEIGHT, WORLD_WIDTH } from "./constants";
import { Bomb } from "lucide";
import { POWER_UPS_BY_ID } from "./powerUps";

// Self-hosted via @fontsource-variable/fredoka (loaded in App.css).
const GAME_FONT = "'Fredoka Variable', system-ui, sans-serif";

function drawBackground(ctx) {
  const gradient = ctx.createLinearGradient(0, 0, 0, WORLD_HEIGHT);
  gradient.addColorStop(0, "#1a1a2e");
  gradient.addColorStop(1, "#0f0f23");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
}

function drawParticles(ctx, particles) {
  for (const particle of particles) {
    ctx.globalAlpha = Math.max(0, particle.life);
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawPortals(ctx, portals) {
  for (const portal of portals) {
    ctx.fillStyle = portal.color;
    for (const particle of portal.particles) {
      ctx.globalAlpha = particle.alpha;
      ctx.beginPath();
      ctx.arc(
        portal.x + Math.cos(particle.angle) * particle.radius,
        portal.y + Math.sin(particle.angle) * particle.radius,
        3,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }

    ctx.globalAlpha = portal.cooldown > 0 ? 0.3 : 0.8;
    const gradient = ctx.createRadialGradient(
      portal.x,
      portal.y,
      0,
      portal.x,
      portal.y,
      portal.radius,
    );
    gradient.addColorStop(0, portal.color);
    gradient.addColorStop(1, "transparent");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(portal.x, portal.y, portal.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawBricks(ctx, bricks) {
  for (const brick of bricks) {
    const cx = brick.x + brick.width / 2;
    const cy = brick.y + brick.height / 2;
    const scale = 1 + brick.hitAnimation * 0.1;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    ctx.translate(-cx, -cy);

    if (brick.type === "steel") drawSteelBrick(ctx, brick);
    else if (brick.type === "explosive") drawExplosiveBrick(ctx, brick, cx, cy);
    else drawNormalBrick(ctx, brick, cy);

    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

function drawNormalBrick(ctx, brick, cy) {
  ctx.globalAlpha = 0.5 + (brick.health / brick.maxHealth) * 0.5;
  ctx.fillStyle = brick.color;
  ctx.beginPath();
  ctx.roundRect(brick.x, brick.y, brick.width, brick.height, 4);
  ctx.fill();

  // Tougher bricks get an inner outline per extra hit they can take.
  ctx.globalAlpha = 0.5;
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 1.5;
  for (let i = 1; i < brick.health; i++) {
    const inset = i * 3.5;
    ctx.beginPath();
    ctx.roundRect(
      brick.x + inset,
      brick.y + inset,
      brick.width - inset * 2,
      brick.height - inset * 2,
      3,
    );
    ctx.stroke();
  }

  // Crack for damaged bricks
  if (brick.health < brick.maxHealth) {
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = "#000";
    ctx.beginPath();
    ctx.moveTo(brick.x + brick.width * 0.3, brick.y);
    ctx.lineTo(brick.x + brick.width * 0.55, cy);
    ctx.lineTo(brick.x + brick.width * 0.7, brick.y + brick.height);
    ctx.stroke();
  }
}

function drawSteelBrick(ctx, brick) {
  const gradient = ctx.createLinearGradient(0, brick.y, 0, brick.y + brick.height);
  gradient.addColorStop(0, "#c9d1de");
  gradient.addColorStop(0.5, brick.color);
  gradient.addColorStop(1, "#5d6678");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.roundRect(brick.x, brick.y, brick.width, brick.height, 3);
  ctx.fill();

  // Rivets in the corners
  ctx.fillStyle = "#3d4454";
  for (const [rx, ry] of [
    [brick.x + 5, brick.y + 5],
    [brick.x + brick.width - 5, brick.y + 5],
    [brick.x + 5, brick.y + brick.height - 5],
    [brick.x + brick.width - 5, brick.y + brick.height - 5],
  ]) {
    ctx.beginPath();
    ctx.arc(rx, ry, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawExplosiveBrick(ctx, brick, cx, cy) {
  const pulse = 0.5 + Math.sin(performance.now() * 0.008) * 0.5;
  ctx.shadowColor = brick.color;
  ctx.shadowBlur = 6 + pulse * 10;
  ctx.fillStyle = brick.color;
  ctx.beginPath();
  ctx.roundRect(brick.x, brick.y, brick.width, brick.height, 4);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Hazard stripes
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(brick.x, brick.y, brick.width, brick.height, 4);
  ctx.clip();
  ctx.globalAlpha = 0.25;
  ctx.fillStyle = "#1a1a1a";
  for (let x = brick.x - brick.height; x < brick.x + brick.width; x += 12) {
    ctx.beginPath();
    ctx.moveTo(x, brick.y + brick.height);
    ctx.lineTo(x + 6, brick.y + brick.height);
    ctx.lineTo(x + 6 + brick.height, brick.y);
    ctx.lineTo(x + brick.height, brick.y);
    ctx.fill();
  }
  ctx.restore();

  const icon = getIconImage("bomb", Bomb);
  if (icon) ctx.drawImage(icon, cx - 8, cy - 8, 16, 16);
}

function drawShockwaves(ctx, shockwaves) {
  for (const wave of shockwaves) {
    const progress = 1 - wave.life;
    ctx.globalAlpha = wave.life * 0.8;
    ctx.strokeStyle = "#ffb020";
    ctx.lineWidth = 4 * wave.life + 1;
    ctx.beginPath();
    ctx.arc(wave.x, wave.y, 15 + progress * 70, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

// Lucide icon data -> cached <img> of a white SVG. Rasterised at 64px so it stays sharp
// when the canvas is scaled up on high-DPI screens. Draws nothing until it has loaded.
const POWER_UP_ICON_SIZE = 16;
const iconImages = new Map();

function getIconImage(key, iconNode) {
  if (typeof Image === "undefined") return null;
  if (!iconImages.has(key)) {
    const children = iconNode
      .map(([tag, attrs]) => {
        const attributes = Object.entries(attrs)
          .map(([name, value]) => `${name}="${value}"`)
          .join(" ");
        return `<${tag} ${attributes}/>`;
      })
      .join("");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round">${children}</svg>`;
    const image = new Image();
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    iconImages.set(key, image);
  }
  const image = iconImages.get(key);
  return image.complete && image.naturalWidth > 0 ? image : null;
}

function drawFallingPowerUps(ctx, powerUps) {
  const { width, height } = POWER_UP_SIZE;
  const pulse = 0.8 + Math.sin(performance.now() * 0.005) * 0.2;

  for (const powerUp of powerUps) {
    ctx.globalAlpha = pulse;
    ctx.fillStyle = powerUp.color;
    ctx.beginPath();
    ctx.roundRect(powerUp.x - width / 2, powerUp.y - height / 2, width, height, 6);
    ctx.fill();
    ctx.globalAlpha = 1;

    const icon = getIconImage(powerUp.type, POWER_UPS_BY_ID[powerUp.type].icon);
    if (icon) {
      const half = POWER_UP_ICON_SIZE / 2;
      ctx.drawImage(
        icon,
        powerUp.x - half,
        powerUp.y - half,
        POWER_UP_ICON_SIZE,
        POWER_UP_ICON_SIZE,
      );
    }
  }
}

function drawBalls(ctx, balls) {
  for (const ball of balls) {
    ctx.fillStyle = ball.color;
    ball.trail.forEach((point, index) => {
      ctx.globalAlpha = (index / ball.trail.length) * 0.3;
      ctx.beginPath();
      ctx.arc(point.x, point.y, ball.radius * (index / ball.trail.length), 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Glow
    const glow = ctx.createRadialGradient(ball.x, ball.y, 0, ball.x, ball.y, ball.radius * 2);
    glow.addColorStop(0, ball.color);
    glow.addColorStop(0.5, ball.color);
    glow.addColorStop(1, "transparent");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius * 2, 0, Math.PI * 2);
    ctx.fill();

    // Core and highlight
    ctx.fillStyle = ball.color;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    ctx.beginPath();
    ctx.arc(
      ball.x - ball.radius * 0.3,
      ball.y - ball.radius * 0.3,
      ball.radius * 0.4,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
}

function drawPaddle(ctx, paddle) {
  const left = paddle.cx - paddle.width / 2;
  const gradient = ctx.createLinearGradient(left, 0, left + paddle.width, 0);
  gradient.addColorStop(0, "#00ff88");
  gradient.addColorStop(0.5, "#00ffff");
  gradient.addColorStop(1, "#00ff88");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.roundRect(left, PADDLE_Y, paddle.width, PADDLE_HEIGHT, 7);
  ctx.fill();

  ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
  ctx.fillRect(left + 4, PADDLE_Y, paddle.width - 8, 3);
}

function drawLaunchHint(ctx, state) {
  if (state.phase !== "playing" || !state.balls.some((b) => b.attached)) return;
  ctx.globalAlpha = 0.6 + Math.sin(performance.now() * 0.006) * 0.3;
  ctx.fillStyle = "#ffffff";
  ctx.font = `600 22px ${GAME_FONT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Tap or press Space to launch", WORLD_WIDTH / 2, PADDLE_Y - 80);
  ctx.globalAlpha = 1;
}

// Draws one frame. `state` is the GameEngine; drawing is in world units and
// `scale` maps them to canvas pixels.
export function renderGame(ctx, state, scale) {
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  drawBackground(ctx);
  drawParticles(ctx, state.particles);
  drawPortals(ctx, state.portals);
  drawBricks(ctx, state.bricks);
  drawShockwaves(ctx, state.shockwaves);
  drawFallingPowerUps(ctx, state.fallingPowerUps);
  drawBalls(ctx, state.balls);
  drawPaddle(ctx, state.paddle);
  drawLaunchHint(ctx, state);
}
