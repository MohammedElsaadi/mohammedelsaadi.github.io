import { useState } from "react";
import MurphyImg1 from "../assets/Murphy-1.png";
import MurphyImg2 from "../assets/Murphy-2.png";

export function Murphy() {
  const [showMurphyHover, setShowMurphyHover] = useState(false);

  return (
    <section
      id="murphy"
      className="lg:hidden py-10 px-4"
    >
      <div className="max-w-md mx-auto flex flex-col items-center text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Also on the team...</h1>
        <button
          type="button"
          onClick={() => setShowMurphyHover((prev) => !prev)}
          aria-label="Toggle Murphy photo"
          className="group relative w-56 h-56 rounded-full overflow-hidden border-4 border-white shadow-2xl bg-white cursor-pointer"
        >
          <img
            src={MurphyImg1}
            alt="Murphy the cat"
            className={`
              absolute inset-0 w-full h-full object-cover transition-opacity duration-300
              ${showMurphyHover ? "opacity-0" : "opacity-100"}
              lg:group-hover:opacity-0
            `}
          />
          <img
            src={MurphyImg2}
            alt="Murphy the cat on hover"
            className={`
              absolute inset-0 w-full h-full object-cover transition-opacity duration-300
              ${showMurphyHover ? "opacity-100" : "opacity-0"}
              lg:group-hover:opacity-100
            `}
          />
        </button>

        <div className="mt-5 px-5 py-3 rounded-2xl bg-white shadow-xl text-center">
          <p className="text-xl font-extrabold text-gray-800">
            Murphy
          </p>
          <p className="text-sm font-medium text-emerald-700">
            Quality Control Engineer
          </p>
        </div>
      </div>
    </section>
  );
}

export default Murphy;