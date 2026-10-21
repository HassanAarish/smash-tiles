import { ArrowLeft, Coins, Gamepad2, Heart, House, Pause, Play } from "lucide-react";
import { PowerUpIcon } from "@/components";
import { POWER_UPS, POWER_UPS_BY_ID } from "@/game/powerUps";
import { usePlayerStore } from "@/store/playerStore";

const speedColor = (boost) =>
  boost > 50 ? "text-red-400" : boost > 20 ? "text-yellow-400" : "text-green-400";

function Hearts({ lives, maxLives, size }) {
  return (
    <div className="flex gap-0.5" aria-label={`${lives} of ${maxLives} lives`}>
      {Array.from({ length: maxLives }, (_, i) => (
        <Heart
          key={i}
          size={size}
          aria-hidden="true"
          className={i < lives ? "text-red-500 fill-red-500" : "text-gray-600"}
        />
      ))}
    </div>
  );
}

function ActivePowerUps({ powerUps }) {
  if (powerUps.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {powerUps.map(({ type, secondsLeft }) => (
        <span
          key={type}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-500/30 border border-purple-400/50 rounded-full text-xs text-purple-200"
        >
          <PowerUpIcon id={type} size={14} aria-hidden="true" />
          {POWER_UPS_BY_ID[type].name}
          <span className="tabular-nums">{secondsLeft}s</span>
        </span>
      ))}
    </div>
  );
}

// Power-ups bought in the shop. Tapping one uses it right away (only while playing).
function PowerUpInventory({ hud, onUse, emptyHint = false }) {
  const inventory = usePlayerStore((state) => state.inventory);
  const owned = POWER_UPS.filter(({ id }) => inventory[id] > 0);
  const canUse = hud.phase === "playing";

  if (owned.length === 0) {
    return emptyHint ? (
      <p className="text-sm text-gray-400">Buy power-ups in the shop to use them here.</p>
    ) : null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {owned.map(({ id, name, color }) => (
        <button
          key={id}
          onClick={() => onUse(id)}
          disabled={!canUse}
          aria-label={`Use ${name} (${inventory[id]} left)`}
          title={name}
          className={`relative flex h-10 w-10 items-center justify-center rounded-xl text-white bg-linear-to-br ${color} shadow-md transition-transform active:scale-90 disabled:opacity-40 disabled:active:scale-100`}
        >
          <PowerUpIcon id={id} size={20} aria-hidden="true" />
          <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-black/80 text-[11px] font-bold leading-5 tabular-nums">
            {inventory[id]}
          </span>
        </button>
      ))}
    </div>
  );
}

function PauseIcon({ paused, size }) {
  const Icon = paused ? Play : Pause;
  return <Icon size={size} aria-hidden="true" className={paused ? "fill-current" : ""} />;
}

// Compact top bar for phones and narrow windows.
export function MobileHud({ hud, actions }) {
  const paused = hud.phase === "paused";
  return (
    <header className="lg:hidden shrink-0 px-3 pt-[max(0.5rem,env(safe-area-inset-top))] pb-1 space-y-1.5 text-white">
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={actions.home}
          aria-label="Back to home"
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 active:bg-white/20"
        >
          <ArrowLeft size={20} aria-hidden="true" />
        </button>
        <div className="flex items-center gap-4 text-sm">
          <div className="text-center leading-tight">
            <div className="text-gray-400 text-[11px]">LEVEL</div>
            <div className="font-bold">{hud.level}</div>
          </div>
          <div className="text-center leading-tight">
            <div className="text-gray-400 text-[11px]">SCORE</div>
            <div className="font-bold tabular-nums">{hud.score.toLocaleString()}</div>
          </div>
          <div className="text-center leading-tight">
            <div className="text-gray-400 text-[11px]">COINS</div>
            <div className="font-bold text-yellow-400 tabular-nums">{hud.coins}</div>
          </div>
          <Hearts lives={hud.lives} maxLives={hud.maxLives} size={16} />
        </div>
        <button
          onClick={actions.togglePause}
          disabled={hud.phase !== "playing" && !paused}
          aria-label={paused ? "Resume" : "Pause"}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 active:bg-white/20 disabled:opacity-30"
        >
          <PauseIcon paused={paused} size={18} />
        </button>
      </div>
      <PowerUpInventory hud={hud} onUse={actions.spendPowerUp} />
      <ActivePowerUps powerUps={hud.activePowerUps} />
    </header>
  );
}

function Stat({ label, children }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-300">{label}</span>
      {children}
    </div>
  );
}

// Side panel for desktop-width screens.
export function StatsPanel({ hud, actions }) {
  const paused = hud.phase === "paused";
  return (
    <aside className="hidden lg:flex w-80 shrink-0 flex-col gap-4 p-6 pl-0 justify-center">
      <h1 className="flex items-center gap-2 text-3xl font-bold">
        <Gamepad2 size={32} aria-hidden="true" className="text-pink-500" />
        <span className="text-transparent bg-clip-text bg-linear-to-r from-pink-500 via-purple-500 to-indigo-500">
          Smash Tiles
        </span>
      </h1>

      <div className="bg-white/10 backdrop-blur rounded-2xl p-6 space-y-4 text-white">
        <Stat label="Score">
          <span className="text-2xl font-bold tabular-nums">{hud.score.toLocaleString()}</span>
        </Stat>
        <Stat label="Level">
          <span className="text-2xl font-bold">{hud.level}</span>
        </Stat>
        <Stat label="Lives">
          <Hearts lives={hud.lives} maxLives={hud.maxLives} size={24} />
        </Stat>
        <Stat label="Combo">
          <span
            className={`text-2xl font-bold ${hud.comboMultiplier >= 5 ? "text-orange-400" : ""}`}
          >
            x{Math.max(1, hud.comboMultiplier)}
          </span>
        </Stat>
        <Stat label="Coins">
          <span className="inline-flex items-center gap-1.5 text-2xl font-bold text-yellow-400">
            {hud.coins} <Coins size={22} aria-hidden="true" />
          </span>
        </Stat>
        <Stat label="Speed Boost">
          <span className={`text-xl font-bold ${speedColor(hud.speedBoost)}`}>
            +{hud.speedBoost}%
          </span>
        </Stat>

        <div className="border-t border-white/20 pt-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">Your Power-ups</h3>
          <PowerUpInventory hud={hud} onUse={actions.spendPowerUp} emptyHint />
        </div>

        {hud.activePowerUps.length > 0 && (
          <div className="border-t border-white/20 pt-4">
            <h3 className="text-sm font-semibold text-gray-300 mb-2">Active Power-ups</h3>
            <ActivePowerUps powerUps={hud.activePowerUps} />
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <button
          onClick={actions.togglePause}
          disabled={hud.phase !== "playing" && !paused}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-white/10 text-white rounded-full font-semibold hover:bg-white/20 disabled:opacity-30 transition-all"
        >
          <PauseIcon paused={paused} size={16} />
          {paused ? "Resume" : "Pause"}
        </button>
        <button
          onClick={actions.home}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-full font-semibold hover:bg-gray-700 transition-all"
        >
          <House size={16} aria-hidden="true" />
          Home
        </button>
      </div>

      <p className="text-gray-400 text-sm">
        Mouse or ← → to move · Click or Space to launch · P to pause
      </p>
    </aside>
  );
}
