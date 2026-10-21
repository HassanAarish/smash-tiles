import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { WORLD_HEIGHT, WORLD_WIDTH } from "@/game/constants";
import { GameEngine } from "@/game/engine";
import { attachInput } from "@/game/input";
import GameOverlay from "./GameOverlay";
import { MobileHud, StatsPanel } from "./Hud";

const parseLevel = (value) => {
  const level = Number.parseInt(value, 10);
  return Number.isFinite(level) && level > 0 ? level : 1;
};

const Game = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const startLevel = parseLevel(searchParams.get("level"));

  const canvasRef = useRef(null);
  const stageRef = useRef(null);
  const engineRef = useRef(null);

  // Mirror of the engine's HUD values; only updates when something changes.
  const [hud, setHud] = useState(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  // Create the engine and its input handlers.
  useEffect(() => {
    const canvas = canvasRef.current;
    const engine = new GameEngine(canvas, setHud);
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
    restart: () => engineRef.current?.newGame(startLevel),
    nextLevel: () => engineRef.current?.nextLevel(),
    home: () => navigate("/"),
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
