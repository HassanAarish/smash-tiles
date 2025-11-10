import { HashRouter, Route, Routes } from "react-router";
import "./App.css";
import { GamePage, HomePage } from "./pages";

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/game" element={<GamePage />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
