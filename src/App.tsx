import './App.css'
import { Routes, Route } from "react-router-dom";
import Home from './pages/Home.tsx';
import Games from './pages/Games.tsx';
import SplendidRivalry from './pages/SplendidRivalry.tsx';

function App() {
return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/games" element={<Games />} />
      <Route path="/games/splendid-rivalry" element={<SplendidRivalry />} />
    </Routes>
  );
}

export default App;
