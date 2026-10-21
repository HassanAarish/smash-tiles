import { Coins, HeartPlus, Magnet, MoveHorizontal, Orbit, Snail } from "lucide";

// Single source of truth for power-ups, shared by the game engine and the Home
// page shop. `duration` is in seconds; power-ups without one apply instantly.
// `icon` is Lucide icon data (framework-free, so the engine can draw it on the canvas);
// React renders the same data with <PowerUpIcon>.
export const POWER_UPS = [
  {
    id: "multiball",
    name: "Multi-Ball",
    icon: Orbit,
    description: "Splits your ball into 3 balls",
    price: 100,
    color: "from-red-500 to-orange-500",
  },
  {
    id: "widePaddle",
    name: "Wide Paddle",
    icon: MoveHorizontal,
    description: "Increases paddle width by 50%",
    price: 50,
    color: "from-blue-500 to-cyan-500",
    duration: 10,
  },
  {
    id: "slowBall",
    name: "Slow Motion",
    icon: Snail,
    description: "Slows down ball speed temporarily",
    price: 75,
    color: "from-green-500 to-emerald-500",
    duration: 8,
  },
  {
    id: "stickyPaddle",
    name: "Sticky Paddle",
    icon: Magnet,
    description: "Ball sticks to paddle on impact",
    price: 60,
    color: "from-purple-500 to-pink-500",
    duration: 12,
  },
  {
    id: "extraLife",
    name: "Extra Life",
    icon: HeartPlus,
    description: "Gain an additional life",
    price: 150,
    color: "from-red-500 to-pink-500",
  },
  {
    id: "coins",
    name: "Coin Rush",
    icon: Coins,
    description: "Instant bonus of 50 coins",
    price: 25,
    color: "from-yellow-500 to-amber-500",
  },
];

export const POWER_UPS_BY_ID = Object.fromEntries(
  POWER_UPS.map((powerUp) => [powerUp.id, powerUp]),
);

export const COIN_RUSH_AMOUNT = 50;
