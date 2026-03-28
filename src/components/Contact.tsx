import * as React from 'react';
import { FiCopy, FiCheck, FiMail } from "react-icons/fi";
import { FaLinkedin } from "react-icons/fa";

export interface IContactProps {}

export function Contact() {
  const email = "mohammedelsaadi@gmail.com";
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <section id="contact" className="py-20 px-4 bg-white">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold mb-4">Contact</h2>
        <p className="mb-6 text-lg text-gray-700">
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
              {copied ? <FiCheck className="w-4 h-4 text-green-600" /> : <FiCopy className="w-4 h-4" />}
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
    </section>
  );
}

export default Contact;