import resumePdf from "../assets/Mohammed-Elsaadi-Resume.pdf";

export interface IResumeProps {}

export function Resume() {
  return (
    <section id="resume" className="py-10 px-4 bg-gradient-to-b from-[var(--color-lighter-emerald)] to-[var(--color-darker-emerald)]">
      <div className="max-w-xl mx-auto bg-white/90 rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow text-center">
        <h2 className="text-3xl font-bold mb-4">Resume</h2>
        <p className="mb-6 text-md md:text-xl text-black">
          You can view and download my resume below.
        </p>
        <a
          href={resumePdf}
          download="Mohammed Elsaadi Resume.pdf"
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          Download Resume
        </a>
      </div>
    </section>
  );
}

export default Resume;