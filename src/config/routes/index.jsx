import { Suspense } from "react";
import { Navigate, Route, Routes } from "react-router";
import { RouteFallback } from "@/components";
import { ROUTES } from "./registry";

const Root = () => (
  // Every page is code-split, so the first visit to each one suspends while its chunk loads.
  <Suspense fallback={<RouteFallback />}>
    <Routes>
      {ROUTES.map(({ path, Component }) => (
        <Route key={path} path={path} element={<Component />} />
      ))}

      {/* Unknown URLs go home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </Suspense>
);

export default Root;
