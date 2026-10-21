import { useState } from "react";
import { useNavigate } from "react-router";
import {
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Coins,
  Gamepad2,
  Heart,
  Lock,
  Play,
  ShoppingCart,
  Star,
  Trophy,
  Zap,
} from "lucide-react";
import { PowerUpIcon } from "@/components";
import { POWER_UPS } from "@/game/powerUps";
import { selectTotalScore, selectUnlockedLevel, usePlayerStore } from "@/store/playerStore";

const TABS = [
  { id: "menu", label: "Game Menu", icon: Gamepad2 },
  { id: "powerups", label: "Power-Ups", icon: Zap },
  { id: "shop", label: "Shop", icon: ShoppingCart },
  { id: "leaderboard", label: "Leaderboard", icon: Trophy },
];

const Home = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("menu");

  // Saved player progress (see @/store/playerStore)
  const coins = usePlayerStore((state) => state.coins);
  const highestCompleted = usePlayerStore((state) => state.highestCompleted);
  const levelResults = usePlayerStore((state) => state.levels);
  const inventory = usePlayerStore((state) => state.inventory);
  const buyPowerUp = usePlayerStore((state) => state.buyPowerUp);
  const totalScore = usePlayerStore(selectTotalScore);
  const unlockedLevel = usePlayerStore(selectUnlockedLevel);

  // Mock leaderboard data
  const leaderboardData = [
    { rank: 1, name: "ProBreaker", score: 150000, level: 25 },
    { rank: 2, name: "TileSmasher", score: 120000, level: 22 },
    { rank: 3, name: "BallMaster", score: 95000, level: 19 },
    { rank: 4, name: "BrickDestroyer", score: 80000, level: 17 },
    { rank: 5, name: "PaddleKing", score: 65000, level: 15 },
  ];

  // Generate level grid (25 levels per group)
  const generateLevelGrid = (startLevel) => {
    const levels = [];
    for (let i = 0; i < 25; i++) {
      const levelNum = startLevel + i;
      const result = levelResults[levelNum];
      const isCompleted = Boolean(result);
      const stars = result?.stars ?? 0;
      const isLocked = levelNum > unlockedLevel;

      levels.push({
        number: levelNum,
        isCompleted,
        stars,
        isLocked,
      });
    }
    return levels;
  };

  const currentLevelGroup = Math.floor((unlockedLevel - 1) / 25) + 1;
  const levelGrid = generateLevelGrid((currentLevelGroup - 1) * 25 + 1);

  // Handle level selection
  const handleLevelSelect = (level) => {
    if (level <= unlockedLevel) {
      // Navigate to game with selected level
      navigate(`/game?level=${level}`);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="bg-black/30 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Gamepad2 size={40} aria-hidden="true" className="text-pink-500" />
              <div>
                <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-linear-to-r from-pink-500 to-purple-500">
                  Smash Tiles
                </h1>
                <p className="text-gray-300">Ultimate Brick Breaker Challenge</p>
              </div>
            </div>

            {/* Player Stats */}
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="text-right">
                <p className="text-gray-400 text-sm">Total Score</p>
                <p className="text-lg sm:text-2xl font-bold text-white">
                  {totalScore.toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-gray-400 text-sm">Coins</p>
                <p className="inline-flex items-center gap-1.5 text-lg sm:text-2xl font-bold text-yellow-400">
                  {coins} <Coins className="size-[0.9em]" aria-hidden="true" />
                </p>
              </div>
              <div className="text-right">
                <p className="text-gray-400 text-sm">Levels Cleared</p>
                <p className="text-lg sm:text-2xl font-bold text-green-400">{highestCompleted}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`shrink-0 inline-flex items-center gap-2 whitespace-nowrap px-4 sm:px-6 py-3 font-semibold transition-all ${
                  activeTab === id
                    ? "bg-white/20 text-white border-b-2 border-purple-500"
                    : "text-gray-400 hover:text-white hover:bg-white/10"
                }`}
              >
                <Icon size={18} aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Game Menu Tab */}
        {activeTab === "menu" && (
          <div className="space-y-8">
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-4 sm:p-8">
              <h2 className="text-3xl font-bold text-white mb-6">Level Selection</h2>

              {/* Current Progress */}
              <div className="bg-black/30 rounded-2xl p-6 mb-8">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-gray-300">Current Progress</p>
                    <p className="text-2xl font-bold text-white">
                      Level {unlockedLevel} - Group {currentLevelGroup}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Heart
                        key={i}
                        size={28}
                        aria-hidden="true"
                        className="text-red-500 fill-red-500"
                      />
                    ))}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-black/50 rounded-full h-4">
                  <div
                    className="bg-linear-to-r from-green-500 to-emerald-500 h-4 rounded-full transition-all"
                    style={{
                      width: `${(Math.max(0, highestCompleted - (currentLevelGroup - 1) * 25) / 25) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* Level Grid */}
              <div className="grid grid-cols-5 gap-2 sm:gap-4">
                {levelGrid.map((level) => (
                  <button
                    key={level.number}
                    onClick={() => handleLevelSelect(level.number)}
                    disabled={level.isLocked}
                    className={`relative aspect-square rounded-2xl font-bold text-lg transition-all transform hover:scale-105 ${
                      level.isLocked
                        ? "bg-gray-800/50 text-gray-600 cursor-not-allowed"
                        : level.isCompleted
                          ? "bg-linear-to-br from-green-600 to-emerald-600 text-white shadow-lg"
                          : "bg-linear-to-br from-purple-600 to-pink-600 text-white shadow-lg hover:shadow-xl"
                    }`}
                  >
                    {level.isLocked && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Lock size={24} aria-label={`Level ${level.number} locked`} />
                      </div>
                    )}
                    {!level.isLocked && (
                      <div className="flex flex-col items-center justify-center h-full">
                        <span className="text-2xl mb-1">{level.number}</span>
                        {level.isCompleted && (
                          <div className="flex gap-1">
                            {Array.from({ length: 3 }).map((_, i) => (
                              <Star
                                key={i}
                                size={14}
                                aria-hidden="true"
                                className={
                                  i < level.stars
                                    ? "text-yellow-400 fill-yellow-400"
                                    : "text-gray-600"
                                }
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Navigation Arrows */}
              <div className="flex flex-wrap justify-between items-center gap-3 mt-8">
                <button
                  disabled={currentLevelGroup === 1}
                  className="inline-flex items-center gap-1 px-6 py-3 bg-linear-to-r from-blue-500 to-purple-500 text-white rounded-full font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-600 hover:to-purple-600 transition-all"
                >
                  <ChevronLeft size={20} aria-hidden="true" />
                  Previous Group
                </button>
                <button
                  onClick={() => handleLevelSelect(unlockedLevel)}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-linear-to-r from-green-500 to-emerald-500 text-white rounded-full font-bold text-lg hover:from-green-600 hover:to-emerald-600 transition-all transform hover:scale-105 shadow-lg"
                >
                  <Play size={20} aria-hidden="true" className="fill-current" />
                  Start Game
                </button>
                <button className="inline-flex items-center gap-1 px-6 py-3 bg-linear-to-r from-purple-500 to-pink-500 text-white rounded-full font-semibold hover:from-purple-600 hover:to-pink-600 transition-all">
                  Next Group
                  <ChevronRight size={20} aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Power-ups Tab */}
        {activeTab === "powerups" && (
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-4 sm:p-8">
            <h2 className="text-3xl font-bold text-white mb-6">Power-Up Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {POWER_UPS.map((powerUp) => (
                <div
                  key={powerUp.id}
                  className="bg-black/30 rounded-2xl p-6 hover:bg-black/40 transition-all"
                >
                  <div
                    className={`inline-flex p-3 mb-3 rounded-xl text-white bg-linear-to-br ${powerUp.color}`}
                  >
                    <PowerUpIcon id={powerUp.id} size={28} aria-hidden="true" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{powerUp.name}</h3>
                  <p className="text-gray-300 text-sm">{powerUp.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Shop Tab */}
        {activeTab === "shop" && (
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-4 sm:p-8">
            <h2 className="text-3xl font-bold text-white mb-2">Power-Up Shop</h2>
            <p className="text-gray-300 mb-6">
              Buy power-ups with coins, then use them any time during a level.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {POWER_UPS.map((powerUp) => {
                const owned = inventory[powerUp.id] ?? 0;
                const canAfford = coins >= powerUp.price;
                return (
                  <div key={powerUp.id} className="bg-black/30 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`shrink-0 p-2.5 rounded-xl text-white bg-linear-to-br ${powerUp.color}`}
                        >
                          <PowerUpIcon id={powerUp.id} size={24} aria-hidden="true" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white">{powerUp.name}</h3>
                          <p className="text-gray-300 text-sm">{powerUp.description}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="inline-flex items-center gap-1.5 text-2xl font-bold text-yellow-400">
                          {powerUp.price} <Coins size={20} aria-hidden="true" />
                        </p>
                        {owned > 0 && (
                          <p className="inline-flex items-center justify-end gap-1 w-full text-sm text-green-400">
                            <CircleCheck size={14} aria-hidden="true" /> Owned: {owned}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => buyPowerUp(powerUp.id)}
                      disabled={!canAfford}
                      className={`w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all ${
                        canAfford
                          ? `bg-linear-to-r ${powerUp.color} text-white hover:shadow-lg transform hover:scale-105 active:scale-95`
                          : "bg-gray-600/30 text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      {!canAfford ? (
                        <>
                          <Lock size={18} aria-hidden="true" /> Insufficient Coins
                        </>
                      ) : (
                        <>
                          <ShoppingCart size={18} aria-hidden="true" /> Buy
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Leaderboard Tab */}
        {activeTab === "leaderboard" && (
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-4 sm:p-8">
            <h2 className="text-3xl font-bold text-white mb-6">Global Leaderboard</h2>
            <div className="space-y-4">
              {leaderboardData.map((player) => (
                <div
                  key={player.rank}
                  className="bg-black/30 rounded-2xl p-6 flex items-center justify-between hover:bg-black/40 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl ${
                        player.rank === 1
                          ? "bg-linear-to-r from-yellow-500 to-amber-500 text-white"
                          : player.rank === 2
                            ? "bg-linear-to-r from-gray-400 to-gray-500 text-white"
                            : player.rank === 3
                              ? "bg-linear-to-r from-amber-700 to-amber-800 text-white"
                              : "bg-purple-600/30 text-purple-300"
                      }`}
                    >
                      {player.rank}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{player.name}</h3>
                      <p className="text-gray-400">Level {player.level}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-transparent bg-clip-text bg-linear-to-r from-yellow-400 to-orange-400">
                      {player.score.toLocaleString()}
                    </p>
                    <p className="text-gray-400 text-sm">points</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Home;
