import HeroImage from "../assets/Mohammed Elsaadi Photo Square.png";

export interface IHeroProps {}

export function Hero() {
  return (
    <section className="relative flex flex-col md:flex-row h-screen bg-emerald-800">
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
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Mohammed Elsaadi</h1>
          <p className="text-lg md:text-xl mb-6 text-gray-600 ">
            Senior Full-Stack Software Developer specializing in C#, .NET, and React. I build creative and efficient solutions to complex problems, with a passion for learning and innovation. Let's create something amazing together!
          </p>
          <div className="flex gap-4">
            <a href="#about" className="px-5 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition">About</a>
            <a href="#projects" className="px-5 py-2 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition">Projects</a>
            <a href="#contact" className="px-5 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition">Contact</a>
            <a href="#resume" className="px-5 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition">Resume</a>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;