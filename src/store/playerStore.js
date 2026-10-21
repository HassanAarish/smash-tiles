import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { POWER_UPS_BY_ID } from "@/game/powerUps";
import { deviceStorage } from "./storage";

// ==============================
// Player store
// ------------------------------
// The player's saved progress, shared by every screen and persisted on the device:
// coins, which levels are cleared (best score + stars each) and owned power-ups.
//
// Later (Phase 2) this is what syncs to the cloud save. Coins and scores will then be
// validated server-side, so keep every change going through the actions below.
// ==============================

export const STARTING_COINS = 500;

const initialProgress = {
  coins: STARTING_COINS,
  highestCompleted: 0, // highest level cleared; the next one is unlocked
  levels: {}, // { [level]: { stars, bestScore } }
  inventory: {}, // { [powerUpId]: count }, bought in the shop, used in game
  bestCombo: 0,
};

export const usePlayerStore = create(
  persist(
    (set, get) => ({
      ...initialProgress,

      // Called once when a round ends (level cleared or game over). `coinsEarned` is what
      // was collected since the last time results were recorded in this run.
      recordResult: ({ level, completed, levelScore, stars, coinsEarned, maxCombo }) =>
        set((state) => {
          const update = {
            coins: state.coins + Math.max(0, coinsEarned),
            bestCombo: Math.max(state.bestCombo, maxCombo),
          };
          if (completed) {
            const previous = state.levels[level];
            update.highestCompleted = Math.max(state.highestCompleted, level);
            update.levels = {
              ...state.levels,
              [level]: {
                stars: Math.max(previous?.stars ?? 0, stars),
                bestScore: Math.max(previous?.bestScore ?? 0, levelScore),
              },
            };
          }
          return update;
        }),

      // Returns false (and changes nothing) when the player can't afford it.
      buyPowerUp: (id) => {
        const { price } = POWER_UPS_BY_ID[id];
        if (get().coins < price) return false;
        set((state) => ({
          coins: state.coins - price,
          inventory: { ...state.inventory, [id]: (state.inventory[id] ?? 0) + 1 },
        }));
        return true;
      },

      // Returns false when none are owned.
      consumePowerUp: (id) => {
        if (!get().inventory[id]) return false;
        set((state) => ({
          inventory: { ...state.inventory, [id]: state.inventory[id] - 1 },
        }));
        return true;
      },

      resetProgress: () => set(initialProgress),
    }),
    {
      name: "smash-tiles-player",
      version: 1,
      storage: createJSONStorage(() => deviceStorage),
      // Only data is saved, never the action functions.
      partialize: ({ coins, highestCompleted, levels, inventory, bestCombo }) => ({
        coins,
        highestCompleted,
        levels,
        inventory,
        bestCombo,
      }),
    },
  ),
);

// ---- Selectors (return primitives, so components only re-render on real changes) ----

export const selectUnlockedLevel = (state) => state.highestCompleted + 1;

// Sum of each level's best score, so replaying a level can't inflate it.
export const selectTotalScore = (state) =>
  Object.values(state.levels).reduce((sum, level) => sum + level.bestScore, 0);
