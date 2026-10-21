// ==============================
// Level data
// ------------------------------
// Every hand-made level, in order. To add a level, add an entry; no code changes.
//
// `layout`: one string per row, exactly BRICK_COLS (10) characters, at most MAX_ROWS (12)
// rows, starting at the top of the brick area.
//   .        empty
//   1 2 3    normal brick that takes 1, 2 or 3 hits
//   #        steel: unbreakable, doesn't count towards clearing the level
//   X        explosive: one hit, destroys the 8 bricks around it (chains into other X)
//
// `moving` (optional): rows that slide side to side, keyed by row index.
//   range   how far it travels each way, in world units (clamped to stay on screen)
//   speed   back-and-forth cycles per second
//   phase   0-1 offset into the cycle, so rows can move out of step
//
// `portals` (optional): adds the pair of teleport portals.
//
// Rules (checked by validateLevels() in levels.js): every breakable brick must be
// reachable, i.e. not sealed off by steel on all four sides.
// ==============================

// One layout row per line keeps the grids readable, so Prettier leaves this alone.
// prettier-ignore
export const LEVELS = [
  // ---- 1-5: the basics ----
  {
    name: "First Contact",
    layout: [
      "1111111111",
      "1111111111",
      "1111111111",
      "1111111111",
    ],
  },
  {
    name: "Diamond",
    layout: [
      "....11....",
      "...1111...",
      "..111111..",
      ".11111111.",
      "..111111..",
      "...1111...",
      "....11....",
    ],
  },
  {
    name: "Pyramid",
    layout: [
      "....11....",
      "...1111...",
      "..111111..",
      ".11111111.",
      "1111111111",
    ],
  },
  {
    name: "Checkerboard",
    layout: [
      "1.1.1.1.1.",
      ".1.1.1.1.1",
      "1.1.1.1.1.",
      ".1.1.1.1.1",
      "1.1.1.1.1.",
      ".1.1.1.1.1",
    ],
  },
  {
    name: "Crossroads",
    layout: [
      "....11....",
      "....11....",
      "1111111111",
      "1111111111",
      "....11....",
      "....11....",
    ],
  },

  // ---- 6-10: tougher bricks ----
  {
    name: "Tough Love",
    layout: [
      "2222222222",
      "1111111111",
      "1111111111",
      "1111111111",
    ],
  },
  {
    name: "Stripes",
    layout: [
      "2222222222",
      "..........",
      "1111111111",
      "..........",
      "2222222222",
      "..........",
      "1111111111",
    ],
  },
  {
    name: "Arrowhead",
    layout: [
      "....22....",
      "...2112...",
      "..211112..",
      ".21111112.",
      "....11....",
      "....11....",
      "....11....",
    ],
  },
  {
    name: "Twin Towers",
    portals: true,
    layout: [
      ".222..222.",
      ".211..112.",
      ".211..112.",
      ".211..112.",
      ".211..112.",
      ".222..222.",
    ],
  },
  {
    name: "Fortress",
    layout: [
      "3333333333",
      "3........3",
      "3.111111.3",
      "3.122221.3",
      "3.111111.3",
      "3........3",
    ],
  },

  // ---- 11-15: steel ----
  {
    name: "Steel Debut",
    layout: [
      "1111111111",
      "1111111111",
      "##..##..##",
      "1111111111",
    ],
  },
  {
    name: "Gates",
    layout: [
      "2222222222",
      "1111111111",
      "#..####..#",
      "..........",
      "1111111111",
    ],
  },
  {
    name: "Shield Wall",
    layout: [
      "..111111..",
      ".11222211.",
      ".12222221.",
      "..111111..",
      ".########.",
    ],
  },
  {
    name: "The Cage",
    layout: [
      "#1#1#1#1#1",
      "1111111111",
      "#2#2#2#2#2",
      "1111111111",
    ],
  },
  {
    name: "Zigzag",
    layout: [
      "11111111..",
      "########..",
      "..11111111",
      "..########",
      "11111111..",
    ],
  },

  // ---- 16-20: explosives ----
  {
    name: "Boom",
    layout: [
      "1111111111",
      "111X11X111",
      "1111111111",
      "1111111111",
    ],
  },
  {
    name: "Chain Reaction",
    layout: [
      "2222222222",
      "X2X2X2X2X2",
      "2X2X2X2X2X",
      "2222222222",
      "2222222222",
    ],
  },
  {
    name: "Minefield",
    portals: true,
    layout: [
      "1.1.X.1.1.",
      ".1.1.1.1.X",
      "X.1.1.1.1.",
      ".1.1.X.1.1",
      "1.1.1.1.X.",
    ],
  },
  {
    name: "Bunker",
    layout: [
      "##########",
      "#22X22X22#",
      "#22222222#",
      "#X222222X#",
      "#22222222#",
      "##..##..##",
    ],
  },
  {
    name: "Detonator",
    layout: [
      "3333333333",
      "3333333333",
      "3333X33333",
      "3333333333",
      "3333333333",
    ],
  },

  // ---- 21-25: moving rows ----
  {
    name: "Slider",
    moving: {
      1: { range: 120, speed: 0.4 },
    },
    layout: [
      "1111111111",
      "...1111...",
      "1111111111",
    ],
  },
  {
    name: "Conveyor",
    moving: {
      0: { range: 80, speed: 0.5 },
      2: { range: 80, speed: 0.5, phase: 0.5 },
    },
    layout: [
      "..111111..",
      "..........",
      "..222222..",
      "..........",
      "1111111111",
    ],
  },
  {
    name: "Sweepers",
    moving: {
      2: { range: 100, speed: 0.3 },
    },
    layout: [
      "2222222222",
      "..........",
      ".##....##.",
      "..........",
      "1111111111",
    ],
  },
  {
    name: "Pendulum",
    moving: {
      0: { range: 140, speed: 0.35 },
    },
    layout: [
      "...XXXX...",
      "..........",
      "1111111111",
      "2222222222",
    ],
  },
  {
    name: "Crossfire",
    moving: {
      0: { range: 60, speed: 0.6 },
      5: { range: 60, speed: 0.6, phase: 0.5 },
    },
    layout: [
      ".111..111.",
      "..........",
      "#........#",
      "..222222..",
      "..........",
      ".111..111.",
    ],
  },

  // ---- 26-30: mixing it up ----
  {
    name: "Hourglass",
    layout: [
      "3333333333",
      ".22222222.",
      "..111111..",
      "...XXXX...",
      "..111111..",
      ".22222222.",
      "3333333333",
    ],
  },
  {
    name: "Steel Maze",
    portals: true,
    layout: [
      "1111111111",
      "#####.####",
      "1111111111",
      "####.#####",
      "1111111111",
    ],
  },
  {
    name: "Explosive Core",
    layout: [
      "..222222..",
      ".22333322.",
      "2233XX3322",
      ".22333322.",
      "..222222..",
    ],
  },
  {
    name: "Rush Hour",
    moving: {
      0: { range: 200, speed: 0.3 },
      1: { range: 200, speed: 0.3, phase: 0.5 },
      2: { range: 200, speed: 0.4 },
      3: { range: 200, speed: 0.4, phase: 0.5 },
    },
    layout: [
      "11111.....",
      ".....22222",
      "11111.....",
      ".....22222",
    ],
  },
  {
    name: "Grand Wall",
    layout: [
      "##########",
      "3333333333",
      "2222222222",
      "1111111111",
      "##.####.##",
    ],
  },

  // ---- 31-35: advanced ----
  {
    name: "Spiral",
    layout: [
      "1111111111",
      "######..#1",
      "1111111.#1",
      "1..####..1",
      "1111111111",
    ],
  },
  {
    name: "Bomb Squad",
    layout: [
      "X1X1X1X1X1",
      "1X1X1X1X1X",
      "##########",
      "2222222222",
    ],
  },
  {
    name: "Twin Sliders",
    moving: {
      0: { range: 100, speed: 0.5 },
      2: { range: 150, speed: 0.25 },
    },
    layout: [
      ".33....33.",
      "..........",
      "...XXXX...",
      "..........",
      "2222222222",
    ],
  },
  {
    name: "Checkmate",
    layout: [
      "3.3.3.3.3.",
      "#2#2#2#2#2",
      ".2.2.2.2.2",
      "#1#1#1#1#1",
    ],
  },
  {
    name: "Gauntlet",
    portals: true,
    layout: [
      "2222222222",
      "#X#....#X#",
      "..........",
      ".########.",
      "..........",
      "1111111111",
    ],
  },

  // ---- 36-40: the finale ----
  {
    name: "Wave",
    portals: true,
    layout: [
      "1........1",
      "21......12",
      "321....123",
      "X321..123X",
      ".X321123X.",
    ],
  },
  {
    name: "Steel Rain",
    moving: {
      2: { range: 50, speed: 0.7 },
    },
    layout: [
      "3333333333",
      "..........",
      "#..#..#..#",
      "..........",
      "2222222222",
      "XXXXXXXXXX",
    ],
  },
  {
    name: "Labyrinth",
    layout: [
      "1111111111",
      "1#####..11",
      "1#222222#1",
      "1#2XXXX2#1",
      "1#222222#1",
      "1########1",
      "1111111111",
    ],
  },
  {
    name: "Moving Fortress",
    moving: {
      0: { range: 150, speed: 0.25 },
      1: { range: 150, speed: 0.25 },
      2: { range: 150, speed: 0.25 },
      3: { range: 150, speed: 0.25 },
      4: { range: 150, speed: 0.25 },
    },
    layout: [
      "..######..",
      "..#3333#..",
      "..#3XX3#..",
      "..#3333#..",
      "..##..##..",
    ],
  },
  {
    name: "Final Smash",
    portals: true,
    layout: [
      "XXXXXXXXXX",
      "3333333333",
      "3#3#33#3#3",
      "2222222222",
      "2X222222X2",
      "1111111111",
      "##..##..##",
    ],
  },
];

// After the last hand-made level the game continues forever by replaying levels from
// this one onwards, with every normal brick one hit tougher (max 3).
export const REMIX_FROM_LEVEL = 11;
