// ==============================
// Route Registry
// ------------------------------
// The single list of pages. The router is derived from it, so adding a page is
// one entry here.
//
// Entry shape: { path, Component }
//
// Pages are imported ONLY through `lazyRoute` here. Importing a page statically anywhere
// else (or re-exporting it from a barrel) pulls it back into the main bundle and silently
// undoes the code-splitting.
// ==============================

import { lazyRoute } from "@/utils/lazyWithRetry";

const HomePage = lazyRoute(() => import("@/pages/Home"));
const GamePage = lazyRoute(() => import("@/pages/Game"));

export const ROUTES = [
  { path: "/", Component: HomePage },
  { path: "/game", Component: GamePage },
];
