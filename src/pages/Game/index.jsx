import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { WORLD_HEIGHT, WORLD_WIDTH } from "@/game/constants";
import { GameEngine } from "@/game/engine";
import { attachInput } from "@/game/input";
import { selectUnlockedLevel, usePlayerStore } from "@/store/playerStore";
import { createProgressRecorder } from "@/store/progressRecorder";
import GameOverlay from "./GameOverlay";
import { MobileHud, StatsPanel } from "./Hud";

const parseLevel = (value) => {
  const level = Number.parseInt(value, 10);
  return Number.isFinite(level) && level > 0 ? level : 1;
};

const Game = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Locked levels can't be opened from the URL: clamp to the highest unlocked one.
  // Read once on mount so unlocking the next level mid-game doesn't restart the engine.
  const [startLevel] = useState(() =>
    Math.min(parseLevel(searchParams.get("level")), selectUnlockedLevel(usePlayerStore.getState())),
  );
  const consumePowerUp = usePlayerStore((state) => state.consumePowerUp);

  const canvasRef = useRef(null);
  const stageRef = useRef(null);
  const engineRef = useRef(null);

  // Mirror of the engine's HUD values; only updates when something changes.
  const [hud, setHud] = useState(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  // Create the engine and its input handlers.
  useEffect(() => {
    const canvas = canvasRef.current;
    const recordProgress = createProgressRecorder();
    const engine = new GameEngine(canvas, (snapshot) => {
      setHud(snapshot);
      recordProgress(snapshot);
    });
    engine.newGame(startLevel);
    engineRef.current = engine;

    const detachInput = attachInput(engine, canvas);
    engine.start();

    return () => {
      detachInput();
      engine.destroy();
      engineRef.current = null;
    };
  }, [startLevel]);

  // Scale the canvas to the largest size that fits, keeping the aspect ratio.
  useEffect(() => {
    const stage = stageRef.current;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      const scale = Math.min(width / WORLD_WIDTH, height / WORLD_HEIGHT);
      const size = {
        width: Math.floor(WORLD_WIDTH * scale),
        height: Math.floor(WORLD_HEIGHT * scale),
      };
      setCanvasSize(size);
      engineRef.current?.resize(size.width, size.height, window.devicePixelRatio || 1);
    });
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  const actions = {
    play: () => engineRef.current?.play(),
    togglePause: () => engineRef.current?.togglePause(),
    // Retry the level the run ended on, not the one it started from.
    restart: () => engineRef.current?.newGame(engineRef.current.level),
    nextLevel: () => engineRef.current?.nextLevel(),
    home: () => navigate("/"),
    // Only spend the item if the engine actually applied it (a round is in progress).
    spendPowerUp: (id) => {
      if (engineRef.current?.applyPowerUp(id)) consumePowerUp(id);
    },
  };

  return (
    <div className="h-dvh flex flex-col lg:flex-row overflow-hidden select-none bg-linear-to-br from-purple-900 via-blue-900 to-indigo-900">
      {hud && <MobileHud hud={hud} actions={actions} />}

      <main
        ref={stageRef}
        className="flex-1 min-h-0 min-w-0 flex items-center justify-center p-2 lg:p-6"
      >
        <div
          className="relative shrink-0"
          style={{ width: canvasSize.width, height: canvasSize.height }}
        >
          <canvas
            ref={canvasRef}
            className="block w-full h-full rounded-2xl border-2 border-purple-500/50 shadow-2xl touch-none"
          />
          {hud && <GameOverlay hud={hud} actions={actions} />}
        </div>
      </main>

      {hud && <StatsPanel hud={hud} actions={actions} />}
    </div>
  );
};

export default Game;
