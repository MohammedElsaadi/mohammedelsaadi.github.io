export interface IAboutProps {}

export function About() {
  return (
    <section id="about" className="py-20 px-4 bg-white">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold mb-4">About Me</h2>

        <p className="text-lg text-gray-700 mb-4">
          I’m a Senior Full-Stack Developer currently working at Intellino Technology Inc., 
          where I focus on building creative, useful, and actually impactful software. 
          I enjoy working on projects that solve real problems, especially when I can take 
          something from an idea all the way to something people rely on day to day.
        </p>

        <p className="text-lg text-gray-700 mb-4">
          I like being in a position where I can lead and mentor while still staying hands-on. 
          That usually means helping guide technical decisions, working closely with teams or 
          clients, and making sure what we’re building actually makes sense long term.
        </p>

        <p className="text-lg text-gray-700 mb-4">
          My background is pretty broad. I’ve worked across web, mobile, and augmented reality. 
          From building full-stack apps with React and .NET, to developing cross-platform mobile 
          apps, to leading an AR training platform using Unity and HoloLens. I’m comfortable 
          jumping between different parts of the stack and just figuring things out.
        </p>

        <p className="text-lg text-gray-700 mb-4">
          Lately I’ve been focused on building scalable apps and systems, especially ones 
          that deal with real-world data and devices. I also spend a lot of time thinking 
          about how to keep things simple, maintainable, and actually useful long term.
        </p>

        <p className="text-lg text-gray-700">
          Outside of work, I like keeping things creative. I’m into puzzles, board games, and 
          anything that involves problem solving or strategy. I also enjoy bird watching, and 
          I’ve managed to get my Rubik’s cube solve time down to sub-30 seconds.
        </p>
      </div>
    </section>
  );
}

export default About;