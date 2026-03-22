export interface IResumeProps {}

export function Resume() {
  return (
    <section id="resume" className="py-20 px-4 bg-white">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold mb-4">Resume</h2>
        <p className="mb-6 text-lg text-gray-700">
          You can view and download my resume below.
        </p>
        <a
          href="/assets/Mohammed Elsaadi Resume.pdf"
          download
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          Download Resume
        </a>
      </div>
    </section>
  );
}

export default Resume;