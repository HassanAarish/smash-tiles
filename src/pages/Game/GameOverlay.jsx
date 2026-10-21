import {
  ArrowLeft,
  ArrowRight,
  Coins,
  Gamepad2,
  Hand,
  HeartCrack,
  House,
  MousePointer2,
  PartyPopper,
  Pause,
  RotateCcw,
  Star,
  TrendingUp,
} from "lucide-react";
import { LIFE_BONUS, SPEED_INCREMENT } from "@/game/constants";

const primaryButton =
  "inline-flex items-center gap-2 px-7 py-3 text-white rounded-full font-semibold transition-all hover:scale-105 active:scale-95";
const secondaryButton =
  "inline-flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-full font-semibold hover:bg-gray-700 transition-all";

function Panel({ children, onClick }) {
  return (
    <div
      onClick={onClick}
      className="absolute inset-0 bg-black/75 flex items-center justify-center rounded-2xl p-4"
    >
      <div className="flex flex-col items-center text-center text-white gap-3">{children}</div>
    </div>
  );
}

function Title({ icon: Icon, className = "", children }) {
  return (
    <h2 className={`flex items-center justify-center gap-3 font-bold ${className}`}>
      <Icon className="size-[1em] shrink-0" aria-hidden="true" />
      {children}
    </h2>
  );
}

function Hint({ icon: Icon, className = "", children }) {
  return (
    <p className={`flex items-center justify-center gap-2 ${className}`}>
      <Icon size={16} className="shrink-0" aria-hidden="true" />
      {children}
    </p>
  );
}

function Stars({ count }) {
  return (
    <div className="flex justify-center gap-2" aria-label={`${count} of 3 stars`}>
      {[1, 2, 3].map((star) => (
        <Star
          key={star}
          size={40}
          aria-hidden="true"
          className={star <= count ? "text-yellow-400 fill-yellow-400" : "text-gray-600"}
        />
      ))}
    </div>
  );
}

// Menu, pause, game-over and level-complete screens drawn over the canvas.
export default function GameOverlay({ hud, actions }) {
  switch (hud.phase) {
    case "menu":
      return (
        <Panel onClick={actions.play}>
          <Title icon={Gamepad2} className="text-3xl sm:text-4xl">
            Level {hud.level}
          </Title>
          <p className="text-xl text-gray-200">Tap or press Space to start</p>
          <div className="text-gray-400 text-sm space-y-1">
            <Hint icon={Hand}>Drag anywhere to move · Tap to launch</Hint>
            <Hint icon={MousePointer2} className="hidden lg:flex">
              Mouse or ← → to move · Click or Space to launch · P to pause
            </Hint>
            <Hint icon={TrendingUp}>Ball speeds up {SPEED_INCREMENT * 100}% per brick hit</Hint>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              actions.home();
            }}
            className={`${secondaryButton} mt-3`}
          >
            <ArrowLeft size={18} aria-hidden="true" />
            Back to Home
          </button>
        </Panel>
      );

    case "paused":
      return (
        <Panel onClick={actions.togglePause}>
          <Title icon={Pause} className="text-3xl">
            Paused
          </Title>
          <p className="text-lg text-gray-300">Tap to resume</p>
          <p className="text-yellow-400">Speed boost: +{hud.speedBoost}%</p>
        </Panel>
      );

    case "gameOver":
      return (
        <Panel>
          <Title icon={HeartCrack} className="text-4xl text-red-500">
            Game Over!
          </Title>
          <p className="text-2xl">Final score: {hud.score.toLocaleString()}</p>
          <p className="text-lg text-gray-300">Best combo: {hud.maxCombo} bricks</p>
          <div className="flex flex-wrap gap-3 justify-center pt-3">
            <button
              onClick={actions.restart}
              className={`${primaryButton} bg-linear-to-r from-purple-500 to-pink-500`}
            >
              <RotateCcw size={18} aria-hidden="true" />
              Play Again
            </button>
            <button onClick={actions.home} className={secondaryButton}>
              <House size={18} aria-hidden="true" />
              Home
            </button>
          </div>
        </Panel>
      );

    case "levelComplete":
      return (
        <Panel>
          <Title icon={PartyPopper} className="text-4xl text-green-400">
            Level Complete!
          </Title>
          <Stars count={hud.stars} />
          <p className="text-xl">Score: {hud.score.toLocaleString()}</p>
          {hud.levelBonus > 0 && (
            <p className="text-green-300">
              Life bonus: +{hud.levelBonus.toLocaleString()} ({hud.lives} x{" "}
              {LIFE_BONUS.toLocaleString()})
            </p>
          )}
          <p className="inline-flex items-center gap-1.5 text-lg text-yellow-400">
            Coins earned: {hud.coins} <Coins size={18} aria-hidden="true" />
          </p>
          <div className="flex flex-wrap gap-3 justify-center pt-3">
            <button
              onClick={actions.nextLevel}
              className={`${primaryButton} bg-linear-to-r from-green-500 to-blue-500`}
            >
              Next Level
              <ArrowRight size={18} aria-hidden="true" />
            </button>
            <button onClick={actions.home} className={secondaryButton}>
              <House size={18} aria-hidden="true" />
              Home
            </button>
          </div>
        </Panel>
      );

    default:
      return null;
  }
}
