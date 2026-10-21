// All positions and sizes are in "world" units. The canvas is scaled to fit the
// screen, so these never change with the device. Speeds are per second.

export const WORLD_WIDTH = 600;
export const WORLD_HEIGHT = 840;

// Fixed physics step keeps the game the same speed on 60Hz and 120Hz screens.
export const PHYSICS_STEP = 1 / 120;
export const MAX_FRAME_TIME = 0.1;

export const STARTING_LIVES = 3;

export const PADDLE_Y = WORLD_HEIGHT - 60;
export const PADDLE_HEIGHT = 14;
export const PADDLE_WIDTH = 100;
export const PADDLE_WIDE_WIDTH = 150;
export const PADDLE_KEY_SPEED = 900;
export const PADDLE_MAX_ANGLE = Math.PI / 3; // 60 degrees from vertical

export const BALL_RADIUS = 8;
export const BALL_COLOR = "#00ff88";
export const BASE_BALL_SPEED = 380;
export const SPEED_INCREMENT = 0.015; // 1.5% increase per brick bounce
export const MAX_SPEED_MULTIPLIER = 3.0;
export const SLOW_BALL_MULTIPLIER = 0.5;
export const BALL_TRAIL_LENGTH = 14;
// Minimum share of speed on each axis, so the ball can't get stuck bouncing
// straight up and down or flat between the side walls.
export const BALL_MIN_HORIZONTAL = 0.15;
export const BALL_MIN_VERTICAL = 0.3;

export const BRICK_ROWS = 6;
export const BRICK_COLS = 10;
export const BRICK_HEIGHT = 22;
export const BRICK_GAP = 4;
export const BRICK_TOP = 110;
export const BRICK_SIDE_MARGIN = 20;
export const BRICK_WIDTH =
  (WORLD_WIDTH - BRICK_SIDE_MARGIN * 2 - BRICK_GAP * (BRICK_COLS - 1)) / BRICK_COLS;
export const BRICK_COLORS = ["#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4", "#feca57", "#ff9ff3"];

// Scoring. Breaking a brick scores BRICK_SCORE x its toughness (hits it takes) x the
// combo multiplier. The combo counts bricks broken since the ball last touched the
// paddle, so it resets on every paddle hit or lost ball.
export const BRICK_SCORE = 100;
export const BRICK_DAMAGE_SCORE = 10; // hitting a tough brick without breaking it
export const MAX_COMBO_MULTIPLIER = 10;
export const LIFE_BONUS = 1000; // per life left when a level is cleared
export const BRICK_COINS = 10;

export const POWER_UP_DROP_CHANCE = 0.15;
export const POWER_UP_FALL_SPEED = 150;
export const POWER_UP_SIZE = { width: 30, height: 20 };

export const PORTALS_FROM_LEVEL = 3;
export const PORTAL_RADIUS = 30;
export const PORTAL_COOLDOWN = 1; // seconds
