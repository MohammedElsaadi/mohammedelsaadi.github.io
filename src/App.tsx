import './App.css'
import { lazy, Suspense } from 'react';
import { Routes, Route } from "react-router-dom";
import Home from './pages/Home.tsx';
import Games from './pages/Games.tsx';
import SplendidRivalry from './pages/SplendidRivalry.tsx';

const BoardGameMenu = lazy(() => import('./pages/BoardGameMenu.tsx'));
const BoardGameMenuSaved = lazy(() => import('./pages/BoardGameMenuSaved.tsx'));
const BoardGameMenuAdmin = lazy(() => import('./pages/BoardGameMenuAdmin.tsx'));

function App() {
return (
    <Suspense fallback={<main className="min-h-screen bg-stone-50 p-10 text-center text-stone-700">Loading…</main>}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/games" element={<Games />} />
        <Route path="/games/splendid-rivalry" element={<SplendidRivalry />} />
        <Route path="/games/board-game-menu" element={<BoardGameMenu />} />
        <Route path="/games/board-game-menu/menu/:menuId" element={<BoardGameMenuSaved />} />
        <Route path="/games/board-game-menu/admin" element={<BoardGameMenuAdmin />} />
      </Routes>
    </Suspense>
  );
}

export default App;
