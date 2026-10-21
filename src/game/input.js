import { WORLD_WIDTH } from "./constants";

const TAP_MAX_MOVE = 12; // CSS px
const TAP_MAX_MS = 300;

const LEFT_KEYS = ["ArrowLeft", "a", "A"];
const RIGHT_KEYS = ["ArrowRight", "d", "D"];

/**
 * Wires mouse, touch and keyboard to the engine.
 *
 * - Mouse: the paddle follows the cursor; a click launches.
 * - Touch: dragging anywhere moves the paddle relative to where the finger
 *   started (so the finger doesn't hide the paddle); a quick tap launches.
 * - Keyboard: arrows / A-D move, Space launches (or starts), P / Esc pauses.
 * - The game pauses automatically when the tab or app goes to the background.
 *
 * Returns a function that removes every listener.
 */
export function attachInput(engine, canvas) {
  let drag = null;

  const toWorldX = (clientX) => {
    const rect = canvas.getBoundingClientRect();
    return ((clientX - rect.left) / rect.width) * WORLD_WIDTH;
  };

  const onPointerDown = (e) => {
    canvas.setPointerCapture(e.pointerId);
    drag = {
      id: e.pointerId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startTime: performance.now(),
      startWorldX: toWorldX(e.clientX),
      startPaddleX: engine.paddleCenter,
    };
  };

  const onPointerMove = (e) => {
    if (e.pointerType === "mouse") {
      engine.setPointerX(toWorldX(e.clientX));
    } else if (drag?.id === e.pointerId) {
      engine.setPointerX(drag.startPaddleX + toWorldX(e.clientX) - drag.startWorldX);
    }
  };

  const onPointerUp = (e) => {
    if (drag?.id !== e.pointerId) return;
    const moved = Math.hypot(e.clientX - drag.startClientX, e.clientY - drag.startClientY);
    const isTap = moved < TAP_MAX_MOVE && performance.now() - drag.startTime < TAP_MAX_MS;
    drag = null;
    if (isTap) engine.launch();
  };

  const onPointerCancel = () => {
    drag = null;
  };

  const onKeyDown = (e) => {
    if (LEFT_KEYS.includes(e.key)) engine.setKey("left", true);
    else if (RIGHT_KEYS.includes(e.key)) engine.setKey("right", true);
    else if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      if (engine.phase === "menu") engine.play();
      else engine.launch();
    } else if (["p", "P", "Escape"].includes(e.key)) {
      engine.togglePause();
    }
  };

  const onKeyUp = (e) => {
    if (LEFT_KEYS.includes(e.key)) engine.setKey("left", false);
    else if (RIGHT_KEYS.includes(e.key)) engine.setKey("right", false);
  };

  const onHide = () => {
    engine.setKey("left", false);
    engine.setKey("right", false);
    engine.pause();
  };

  const onVisibilityChange = () => {
    if (document.hidden) onHide();
  };

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerCancel);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", onHide);
  document.addEventListener("visibilitychange", onVisibilityChange);

  return () => {
    canvas.removeEventListener("pointerdown", onPointerDown);
    canvas.removeEventListener("pointerup", onPointerUp);
    canvas.removeEventListener("pointercancel", onPointerCancel);
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
    window.removeEventListener("blur", onHide);
    document.removeEventListener("visibilitychange", onVisibilityChange);
  };
}
