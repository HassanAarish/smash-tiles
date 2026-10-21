import {
  BRICK_COLORS,
  BRICK_COLS,
  BRICK_GAP,
  BRICK_HEIGHT,
  BRICK_ROWS,
  BRICK_SIDE_MARGIN,
  BRICK_TOP,
  BRICK_WIDTH,
  PORTAL_RADIUS,
  PORTALS_FROM_LEVEL,
  POWER_UP_DROP_CHANCE,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from "./constants";
import { POWER_UPS } from "./powerUps";

// Each pattern decides whether a brick exists at (row, col).
const PATTERNS = {
  full: () => true,
  diamond: (row, col) => Math.abs(row - BRICK_ROWS / 2) + Math.abs(col - BRICK_COLS / 2) <= 3,
  pyramid: (row, col) =>
    row >= BRICK_ROWS - 3 &&
    col >= row - (BRICK_ROWS - 3) &&
    col <= BRICK_COLS - row + (BRICK_ROWS - 4),
  cross: (row, col) => (row >= 2 && row <= 3) || (col >= 4 && col <= 5),
  checker: (row, col) => (row + col) % 2 === 0,
};

// Levels cycle through the patterns while brick health keeps scaling.
const PATTERN_ORDER = ["full", "diamond", "pyramid", "cross", "checker"];

const pick = (items) => items[Math.floor(Math.random() * items.length)];

function createPortal(x, color) {
  return {
    x,
    y: WORLD_HEIGHT * 0.58,
    radius: PORTAL_RADIUS,
    color,
    cooldown: 0,
    particles: Array.from({ length: 12 }, (_, i) => ({
      angle: (i * Math.PI * 2) / 12,
      radius: 20 + Math.random() * 10,
      speed: 1.2 + Math.random() * 1.8, // radians per second
      alpha: Math.random(),
    })),
  };
}

export function buildLevel(levelNum) {
  const pattern = PATTERNS[PATTERN_ORDER[(levelNum - 1) % PATTERN_ORDER.length]];
  const health = Math.min(1 + Math.floor(levelNum / 2), 3);
  const bricks = [];

  for (let row = 0; row < BRICK_ROWS; row++) {
    for (let col = 0; col < BRICK_COLS; col++) {
      if (!pattern(row, col)) continue;

      bricks.push({
        x: BRICK_SIDE_MARGIN + col * (BRICK_WIDTH + BRICK_GAP),
        y: BRICK_TOP + row * (BRICK_HEIGHT + BRICK_GAP),
        width: BRICK_WIDTH,
        height: BRICK_HEIGHT,
        health,
        maxHealth: health,
        color: pick(BRICK_COLORS),
        powerUp: Math.random() < POWER_UP_DROP_CHANCE ? pick(POWER_UPS).id : null,
        hitAnimation: 0,
      });
    }
  }

  const portals =
    levelNum >= PORTALS_FROM_LEVEL
      ? [createPortal(70, "#ff00ff"), createPortal(WORLD_WIDTH - 70, "#00ffff")]
      : [];

  return { bricks, portals };
}
