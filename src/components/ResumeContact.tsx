import * as React from "react";
import resumePdf from "../assets/Mohammed-Elsaadi-Resume.pdf";
import { FiCopy, FiCheck, FiMail } from "react-icons/fi";
import { FaLinkedin } from "react-icons/fa";

export interface IResumeContactProps {}

export function ResumeContact() {
  const email = "mohammedelsaadi@gmail.com";
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <section
      id="resume-contact"
      className="py-20 px-4 bg-gradient-to-b from-[var(--color-lighter-red)] to-[var(--color-darker-red)]"
    >
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20">
        {/* Resume Card */}
        <div
            id="resume"
            className="bg-white/90 rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow flex flex-col"
            >
            <h2 className="text-3xl font-bold mb-4">Resume</h2>

            <p className="mb-6 text-md md:text-xl text-black">
                You can view and download my resume by clicking the button below.
            </p>

            <a
                href={resumePdf}
                download="Mohammed Elsaadi Resume.pdf"
                className="mt-auto inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition w-fit"
            >
                Download Resume
            </a>
        </div>

        {/* Contact Card */}
        <div
          id="contact"
          className="bg-white/90 rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
        >
          <h2 className="text-3xl font-bold mb-4">Contact</h2>

          <p className="mb-6 text-md md:text-xl text-black">
            Feel free to reach out via email or connect with me on LinkedIn!
          </p>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <FiMail className="w-5 h-5 text-blue-700" />

              <a
                href={`mailto:${email}`}
                className="text-blue-600 hover:underline"
              >
                {email}
              </a>

              <button
                onClick={handleCopy}
                className="ml-2 p-2 text-gray-600 hover:bg-gray-200 rounded transition"
                aria-label="Copy email to clipboard"
              >
                {copied ? (
                  <FiCheck className="w-4 h-4 text-green-600" />
                ) : (
                  <FiCopy className="w-4 h-4" />
                )}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <FaLinkedin className="w-5 h-5 text-blue-700" />

              <a
                href="https://www.linkedin.com/in/moelsaadi/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                linkedin.com/in/moelsaadi
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ResumeContact;