import {
  BRICK_COLORS,
  BRICK_COLS,
  BRICK_GAP,
  BRICK_HEIGHT,
  BRICK_SIDE_MARGIN,
  BRICK_TOP,
  BRICK_WIDTH,
  MAX_ROWS,
  PORTAL_RADIUS,
  POWER_UP_DROP_CHANCE,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from "./constants";
import { LEVELS, REMIX_FROM_LEVEL } from "./levelData";
import { POWER_UPS } from "./powerUps";

export const LEVEL_COUNT = LEVELS.length;

// How close moving rows may get to the side walls.
const WALL_CLEARANCE = 4;

export const STEEL_COLOR = "#9aa5b8";
export const EXPLOSIVE_COLOR = "#ff5a1f";

const pick = (items) => items[Math.floor(Math.random() * items.length)];

// Hand-made levels first; after that, replay from REMIX_FROM_LEVEL onwards with every
// normal brick one hit tougher.
export function getLevelDefinition(levelNum) {
  if (levelNum <= LEVEL_COUNT) return { ...LEVELS[levelNum - 1], remix: false };

  const pool = LEVELS.slice(REMIX_FROM_LEVEL - 1);
  const base = pool[(levelNum - LEVEL_COUNT - 1) % pool.length];
  return {
    ...base,
    name: `${base.name} Remix`,
    layout: base.layout.map((row) => row.replace(/[12]/g, (h) => String(Number(h) + 1))),
    remix: true,
  };
}

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

function createBrick(char, row, col) {
  const brick = {
    row,
    x: BRICK_SIDE_MARGIN + col * (BRICK_WIDTH + BRICK_GAP),
    y: BRICK_TOP + row * (BRICK_HEIGHT + BRICK_GAP),
    width: BRICK_WIDTH,
    height: BRICK_HEIGHT,
    hitAnimation: 0,
    motion: null,
    destroyed: false,
  };

  if (char === "#") {
    return {
      ...brick,
      type: "steel",
      unbreakable: true,
      health: 1,
      maxHealth: 1,
      color: STEEL_COLOR,
      powerUp: null,
    };
  }
  if (char === "X") {
    return {
      ...brick,
      type: "explosive",
      health: 1,
      maxHealth: 1,
      color: EXPLOSIVE_COLOR,
      powerUp: null,
    };
  }

  const health = Number(char);
  return {
    ...brick,
    type: "normal",
    health,
    maxHealth: health,
    color: pick(BRICK_COLORS),
    powerUp: Math.random() < POWER_UP_DROP_CHANCE ? pick(POWER_UPS).id : null,
  };
}

// A moving row slides between minOffset and maxOffset (relative to its layout position),
// limited so no brick in the row leaves the playfield.
function attachMotion(rowBricks, { range, speed, phase = 0 }) {
  if (rowBricks.length === 0) return;
  const left = Math.min(...rowBricks.map((b) => b.x));
  const right = Math.max(...rowBricks.map((b) => b.x + b.width));
  const minOffset = Math.max(-range, WALL_CLEARANCE - left);
  const maxOffset = Math.min(range, WORLD_WIDTH - WALL_CLEARANCE - right);

  for (const brick of rowBricks) {
    brick.motion = { baseX: brick.x, minOffset, maxOffset, speed, phase };
  }
}

// Where a moving brick is at `time` seconds into the level.
export function motionX(motion, time) {
  const t = (Math.sin(2 * Math.PI * (motion.speed * time + motion.phase)) + 1) / 2;
  return motion.baseX + motion.minOffset + (motion.maxOffset - motion.minOffset) * t;
}

export function buildLevel(levelNum) {
  const definition = getLevelDefinition(levelNum);
  const bricks = [];

  definition.layout.forEach((rowString, row) => {
    const rowBricks = [];
    [...rowString].forEach((char, col) => {
      if (char === ".") return;
      rowBricks.push(createBrick(char, row, col));
    });
    const motion = definition.moving?.[row];
    if (motion) attachMotion(rowBricks, motion);
    bricks.push(...rowBricks);
  });

  // Moving bricks start where their motion puts them at time 0.
  for (const brick of bricks) {
    if (brick.motion) brick.x = motionX(brick.motion, 0);
  }

  const portals = definition.portals
    ? [createPortal(70, "#ff00ff"), createPortal(WORLD_WIDTH - 70, "#00ffff")]
    : [];

  return { name: definition.name, bricks, portals };
}

// ---- Validation ----------------------------------------------------------

const VALID_CHARS = /^[.123#X]+$/;

/**
 * Checks every hand-made level and returns a list of problems (empty when all is well).
 * A breakable brick is "sealed" when steel blocks every path from it to the edge of the
 * grid; the ball could never reach it, so the level could never be cleared.
 */
export function validateLevels(levels = LEVELS) {
  const problems = [];

  levels.forEach((level, index) => {
    const label = `Level ${index + 1} (${level.name ?? "unnamed"})`;
    const { layout } = level;

    if (!level.name) problems.push(`${label}: missing name`);
    if (!Array.isArray(layout) || layout.length === 0) {
      problems.push(`${label}: empty layout`);
      return;
    }
    if (layout.length > MAX_ROWS) problems.push(`${label}: more than ${MAX_ROWS} rows`);

    layout.forEach((row, r) => {
      if (row.length !== BRICK_COLS)
        problems.push(`${label}: row ${r} has ${row.length} columns, needs ${BRICK_COLS}`);
      if (!VALID_CHARS.test(row)) problems.push(`${label}: row ${r} has an invalid character`);
    });

    if (!layout.some((row) => /[123X]/.test(row))) {
      problems.push(`${label}: no breakable bricks`);
    }

    for (const key of Object.keys(level.moving ?? {})) {
      if (!layout[key] || !/[^.]/.test(layout[key]))
        problems.push(`${label}: moving row ${key} is empty or missing`);
    }

    // Flood-fill from the grid edges through every non-steel cell.
    const rows = layout.length;
    const reachable = layout.map((row) => [...row].map(() => false));
    const queue = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < BRICK_COLS; c++) {
        const onEdge = r === 0 || r === rows - 1 || c === 0 || c === BRICK_COLS - 1;
        if (onEdge && layout[r][c] !== "#") {
          reachable[r][c] = true;
          queue.push([r, c]);
        }
      }
    }
    while (queue.length) {
      const [r, c] = queue.shift();
      for (const [dr, dc] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr < 0 || nr >= rows || nc < 0 || nc >= BRICK_COLS) continue;
        if (reachable[nr][nc] || layout[nr][nc] === "#") continue;
        reachable[nr][nc] = true;
        queue.push([nr, nc]);
      }
    }
    layout.forEach((row, r) => {
      [...row].forEach((char, c) => {
        if (/[123X]/.test(char) && !reachable[r][c])
          problems.push(`${label}: brick at row ${r}, column ${c} is sealed in by steel`);
      });
    });
  });

  return problems;
}

// Catch authoring mistakes while developing, without costing anything in production.
if (import.meta.env?.DEV) {
  const problems = validateLevels();
  if (problems.length) console.error(`Level data problems:\n${problems.join("\n")}`);
}
