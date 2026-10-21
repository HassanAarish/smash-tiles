import { PADDLE_HEIGHT, PADDLE_Y, POWER_UP_SIZE, WORLD_HEIGHT, WORLD_WIDTH } from "./constants";
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

    ctx.globalAlpha = 0.5 + (brick.health / brick.maxHealth) * 0.5;
    ctx.fillStyle = brick.color;
    ctx.beginPath();
    ctx.roundRect(brick.x, brick.y, brick.width, brick.height, 4);
    ctx.fill();

    // Crack for damaged bricks
    if (brick.health < brick.maxHealth) {
      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(brick.x + brick.width * 0.3, brick.y);
      ctx.lineTo(brick.x + brick.width * 0.55, cy);
      ctx.lineTo(brick.x + brick.width * 0.7, brick.y + brick.height);
      ctx.stroke();
    }
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

// Lucide icon data -> cached <img> of a white SVG. Rasterised at 64px so it stays sharp
// when the canvas is scaled up on high-DPI screens. Draws nothing until it has loaded.
const POWER_UP_ICON_SIZE = 16;
const iconImages = new Map();

function getIconImage(type) {
  if (typeof Image === "undefined") return null;
  if (!iconImages.has(type)) {
    const children = POWER_UPS_BY_ID[type].icon
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
    iconImages.set(type, image);
  }
  const image = iconImages.get(type);
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

    const icon = getIconImage(powerUp.type);
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
  drawFallingPowerUps(ctx, state.fallingPowerUps);
  drawBalls(ctx, state.balls);
  drawPaddle(ctx, state.paddle);
  drawLaunchHint(ctx, state);
}
