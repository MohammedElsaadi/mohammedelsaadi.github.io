import HeroImage from "../assets/Mohammed Elsaadi Photo Square.png";
import MurphyImg1 from "../assets/murphy-1.png";
import MurphyImg2 from "../assets/murphy-2.png";

export interface IHeroProps {}

export function Hero() {
  return (
    <section className="relative flex flex-col md:flex-row h-screen bg-emerald-800 overflow-hidden">
      {/* Left: Full-height image, flush against the edge */}
      <div className="md:w-1/2 w-full h-64 md:h-screen min-w-[320px] flex justify-start">
        <img
          src={HeroImage}
          alt="Photo of Mohammed Elsaadi"
          className="object-cover object-center"
        />
      </div>

      {/* Right: Content, overlapped on image */}
      <div className="md:w-1/2 w-full flex items-center justify-center relative h-full">
        <div
          className="
            bg-white/90
            rounded-xl shadow-xl
            px-8 py-10 mt-8 md:mt-0
            flex flex-col items-center md:items-start text-center md:text-left
            z-10
            md:absolute md:top-32 md:left-[-80px]
            max-w-xl
          "
          style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}
        >
          <h3>Hello, I'm</h3>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
            Mohammed Elsaadi
          </h1>
          <p className="text-lg md:text-xl mb-6 text-gray-600">
            Senior Full-Stack Software Developer specializing in C#, .NET, and
            React. I build creative and efficient solutions to complex problems,
            with a passion for learning and innovation. Let's create something
            amazing together!
          </p>
          <div className="flex gap-4 flex-wrap">
            <a
              href="#about"
              className="px-5 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              About
            </a>
            <a
              href="#projects"
              className="px-5 py-2 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition"
            >
              Projects
            </a>
            <a
              href="#contact"
              className="px-5 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
            >
              Contact
            </a>
            <a
              href="#resume"
              className="px-5 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition"
            >
              Resume
            </a>
          </div>
        </div>

        {/* Murphy badge */}
        <div className="absolute bottom-6 right-6 md:bottom-10 md:right-10 z-20 group">
          {/* Floating label */}
          <div className="absolute bottom-full right-0 mb-4 flex flex-col items-end pointer-events-none">
            <div className="bg-white text-gray-800 text-sm md:text-base font-semibold px-4 py-2 rounded-xl shadow-lg whitespace-nowrap">
              Murphy, Quality Control Engineer
            </div>
            <div className="mr-8 -mt-1 text-white text-2xl leading-none rotate-102">
              ↘
            </div>
          </div>

          {/* Circular image with hover swap */}
          <div className="relative w-56 h-56 md:w-72 md:h-72 rounded-full overflow-hidden border-4 border-white shadow-2xl bg-white cursor-pointer">
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
        </div>
      </div>
    </section>
  );
}

export default Hero;