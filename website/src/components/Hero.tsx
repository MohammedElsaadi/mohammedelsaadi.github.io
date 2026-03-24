import HeroImage from "../assets/Mohammed Elsaadi Photo Square.png";
import MurphyImg1 from "../assets/murphy-1.png";
import MurphyImg2 from "../assets/murphy-2.png";

export interface IHeroProps {}

export function Hero() {
  return (
    <section className="relative flex flex-col lg:flex-row h-screen bg-emerald-800 overflow-hidden">
      {/* Left: Full-height image, flush against the edge */}
      <div className="lg:w-1/2 w-full h-full lg:h-screen min-w-[320px] flex justify-start relative">
        <img
          src={HeroImage}
          alt="Photo of Mohammed Elsaadi"
          className="object-cover object-center"
        />
      </div>

      {/* Right: Content, overlapped on image */}
      <div className="lg:w-1/2 w-full flex items-center justify-center relative h-full">
        <div
          className="
            bg-white/90
            rounded-xl shadow-xl
            px-8 py-10 mt-8 md:mt-0
            flex flex-col items-center md:items-start text-center md:text-left
            z-0
            absolute bottom-10 lg:bottom-auto lg:top-32 lg:left-[-200px]
            max-w-2xl
          "
          style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}
        >
          <h3>Hello, I'm</h3>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-2">
            Mohammed Elsaadi
          </h1>
          <h3 className="text-lg underline">Senior Full-Stack Software Developer</h3>
          <p className="text-lg md:text-xl mb-6 text-gray-600">
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
          </div>
        </div>

{/* Murphy badge */}
<div className="absolute bottom-120 lg:bottom-6 right-6 md:right-10 z-20 group flex flex-col items-center">
  

  {/* Circular image with hover swap */}
  <div className="mb-4 relative w-56 h-56 rounded-full overflow-hidden border-4 border-white shadow-2xl bg-white cursor-pointer">
    <img
      src={MurphyImg1}
      alt="Murphy the cat"
      className="absolute inset-0 w-full h-full object-cover transition-none duration-300 group-hover:opacity-0"
    />
    <img
      src={MurphyImg2}
      alt="Murphy the cat on hover"
      className="absolute inset-0 w-full h-full object-cover opacity-0 transition-none duration-300 group-hover:opacity-100"
    />
  </div>
  {/* Nice label */}
  <div className="px-5 py-3 rounded-2xl bg-white/95 backdrop-blur-sm shadow-xl border border-white/60 text-center">
    <p className="text-lg md:text-xl font-extrabold text-gray-800 leading-tight">
      Murphy
    </p>
    <p className="text-sm md:text-base font-medium text-emerald-700 leading-tight">
      Quality Control Engineer
    </p>
  </div>
</div>
      </div>
    </section>
  );
}

export default Hero;