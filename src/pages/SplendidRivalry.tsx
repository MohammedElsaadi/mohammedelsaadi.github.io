import { Link } from "react-router-dom";
import SplendidRivalryScene from "../components/SplendidRivalryScene.tsx";

function SplendidRivalry() {
  return (
    <div className="w-full h-screen relative bg-neutral-950">
      <div className="absolute top-4 left-4 z-10 flex gap-3">
        <Link
          to="/games"
          className="px-4 py-2 bg-white/10 text-white rounded-lg font-semibold hover:bg-white/20 transition"
        >
          Back to Games
        </Link>
      </div>

      <SplendidRivalryScene />
    </div>
  );
}

export default SplendidRivalry;