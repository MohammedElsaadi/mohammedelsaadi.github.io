import HeroImage from "../assets/Mohammed Elsaadi Photo Square.png";
import MurphyImg1 from "../assets/Murphy-1.png";
import MurphyImg2 from "../assets/Murphy-2.png";
import { Link } from "react-router-dom";
import { useState } from "react";

export interface IHeroProps {}

export function Hero() {
  const [showMurphyHover, setShowMurphyHover] = useState(false);
  return (
    <section className="relative flex flex-col lg:flex-row h-screen bg-emerald-800 overflow-hidden">
      {/* Left: Full-height image, flush against the edge */}
      <div className="lg:w-1/2 w-full h-full lg:h-screen min-w-[320px] flex justify-start relative z-0">
        <img
          src={HeroImage}
          alt="Photo of Mohammed Elsaadi"
          className="object-cover object-center"
        />
      </div>

      {/* Right: Content, overlapped on image */}
      <div className="lg:w-1/2 w-full flex items-center justify-center relative h-full z-30">
        <div
            className="
              bg-white/90
              rounded-xl shadow-xl
              px-4 py-5 md:px-8 md:py-10 mt-8 md:mt-0
              flex flex-col items-center md:items-start text-center md:text-left
              z-20
              absolute bottom-10 lg:bottom-auto lg:top-32 lg:left-[-200px]
              max-w-2xl
            "
            style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}
          >
          <h3>Hello, I'm</h3>
          <h1 className="text-3xl md:text-5xl font-extrabold mb-2">
            Mohammed Elsaadi
          </h1>
          <h3 className="text-md underline">Senior Full-Stack Software Developer</h3>
          <p className="text-md md:text-xl mb-6 text-gray-600">
            I am driven to build creative and effective solutions that leave a positive impact.
             I am driven by a passion for learning and innovation, 
             and I thrive on solving complex problems with elegant code. 
             I specialize in C#, .NET, and React, and I love taking projects from concept to reality.
              Let's create something amazing together!
          </p>
          <div className="flex gap-4 flex-wrap justify-center w-full">
            <a
              href="#about"
              className="px-5 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition"
            >
              About
            </a>
            <a
              href="#resume"
              className="px-5 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition"
            >
              Resume
            </a>
            <a
              href="#projects"
              className="px-5 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition"
            >
              Projects
            </a>
            <a
              href="#contact"
              className="px-5 py-2 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 transition"
            >
              Contact
            </a>
            <Link
              to="/games"
              className="px-5 py-2 bg-gray-800 text-white rounded-lg font-semibold hover:bg-gray-900 transition"
            >
              Games
            </Link>
          </div>
        </div>

{/* Murphy badge */}
<div className="hidden lg:flex z-10 absolute bottom-6 right-10 group flex-col items-center">
    <h1 className="text-2xl font-bold text-white mb-4">Also on the team...</h1>
    <button
  type="button"
  onClick={() => setShowMurphyHover((prev) => !prev)}
  aria-label="Toggle Murphy photo"
  className="mb-4 relative w-40 h-40 xl:w-56 xl:h-56 rounded-full overflow-hidden border-4 border-white shadow-2xl bg-white cursor-pointer group"
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

  <div className="px-4 py-2 md:px-5 md:py-3 rounded-2xl bg-white/95 backdrop-blur-sm shadow-xl border border-white/60 text-center">
    <p className="text-base md:text-xl font-extrabold text-gray-800 leading-tight">
      Murphy
    </p>
    <p className="text-xs md:text-base font-medium text-emerald-700 leading-tight">
      Quality Control Engineer
    </p>
  </div>
</div>
      </div>
    </section>
  );
}

export default Hero;