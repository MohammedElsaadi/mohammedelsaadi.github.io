import { Link } from "react-router-dom";
import SplendidCover from "../assets/splendidrivalrycover.png";

function Games() {
  return (
    <main className="min-h-screen bg-emerald-800 px-6 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-lg bg-white/20 px-4 py-2 font-semibold text-white ring-1 ring-white/40 transition hover:bg-white/20"
        >
          <span aria-hidden="true">🏠</span>
          Back to Portfolio
        </Link>

        <section className="mt-16 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-200">
            Interactive Projects
          </p>

          <h1 className="mt-3 text-4xl font-extrabold md:text-6xl">
            Games & Experiments
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-lg text-emerald-50/80">
            A collection of virtual games, creative builds, and interactive web experiments.
          </p>
        </section>

        <section className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            to="board-game-menu"
            className="group overflow-hidden rounded-2xl bg-amber-50 text-left text-gray-900 shadow-2xl transition hover:-translate-y-1 hover:shadow-emerald-950/40"
          >
            <div className="flex h-56 items-center justify-center bg-[#2d1a2a] p-8">
              <div className="relative h-32 w-44 rounded-xl border-4 border-slate-500 bg-slate-700 shadow-2xl">
                <div className="absolute -top-5 left-5 h-20 w-14 rotate-[-8deg] rounded bg-orange-500 shadow-lg" />
                <div className="absolute -top-7 left-16 h-20 w-16 rotate-[5deg] rounded bg-amber-400 shadow-lg" />
                <div className="absolute -right-8 bottom-0 h-24 w-16 rounded-xl bg-emerald-700 shadow-lg" />
              </div>
            </div>
            <div className="p-6">
              <p className="text-sm font-bold uppercase tracking-wider text-emerald-700">Game-night planner</p>
              <h2 className="mt-2 text-2xl font-extrabold">Board Game Menu</h2>
              <p className="mt-3 text-gray-600">Pick the night’s games and watch the real travel crate pack itself.</p>
              <p className="mt-5 font-semibold text-emerald-700 transition group-hover:translate-x-1">Build a menu →</p>
            </div>
          </Link>
          <Link
            to="splendid-rivalry"
            className="group overflow-hidden rounded-2xl bg-white text-left text-gray-900 shadow-2xl transition hover:-translate-y-1 hover:shadow-emerald-950/40"
          >
<div className="h-56 overflow-hidden">
  <img
    src={SplendidCover}
    alt="Splendid Rivalry cover"
    className="h-full w-full object-fill transition duration-500 group-hover:scale-105"
  />
</div>
            <div className="p-6">
              <p className="text-sm font-bold uppercase tracking-wider text-emerald-700">
                Three.js Game
              </p>

              <h2 className="mt-2 text-2xl font-extrabold">
                Splendid Rivalry
              </h2>

              <p className="mt-3 text-gray-600">
                This is my Three.js rendition of Splendor: Duel. Still a work in progress.
              </p>

              <p className="mt-5 font-semibold text-emerald-700 transition group-hover:translate-x-1">
                Open game →
              </p>
            </div>
          </Link>
        </section>
      </div>
    </main>
  );
}

export default Games;
