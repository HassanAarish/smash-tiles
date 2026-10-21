import { usePlayerStore } from "./playerStore";

// Saves results to the player store when a round ends. Coins are tracked as a running
// total per run in the engine, so only the part not yet saved is added each time.
export function createProgressRecorder() {
  let lastPhase = null;
  let savedCoins = 0;

  return (snapshot) => {
    if (snapshot.phase === lastPhase) return;
    lastPhase = snapshot.phase;

    // A new run (newGame) starts its coin count from zero.
    if (snapshot.phase === "menu") savedCoins = 0;

    if (snapshot.phase === "levelComplete" || snapshot.phase === "gameOver") {
      usePlayerStore.getState().recordResult({
        level: snapshot.level,
        completed: snapshot.phase === "levelComplete",
        levelScore: snapshot.levelScore,
        stars: snapshot.stars,
        coinsEarned: snapshot.coins - savedCoins,
        maxCombo: snapshot.maxCombo,
      });
      savedCoins = snapshot.coins;
    }
  };
}
