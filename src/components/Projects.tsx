import { Link } from "react-router-dom";

const projects = [
  {
    title: 'AI-Powered Sign Management Platform',
    company: 'Intellino Technology Inc.',
    period: 'Sept 2025 – June 2026',
    description:
      'Built a cloud-connected retail platform for provisioning digital signs, managing content, and generating customer-facing messaging using AI-powered data pipelines.',
    bullets: [
      'Developed cross-platform Flutter applications for Android and iOS device provisioning',
      'Built C#/.NET APIs and GCP services for device, user, and content management',
      'Developed AI-powered pipelines that processed business reviews and generated concise sign-ready messaging',
      'Integrated external services, cloud messaging, storage, authentication, and physical devices',
    ],
    tech: ['Flutter', 'Dart', '.NET', 'C#', 'PostgreSQL', 'GCP', 'AI/ML', 'Docker'],
  },
  {
  title: '3D Board Game Crate Planner',
  company: 'Personal Project',
  period: '2026',
  url: '/games/board-game-menu',
  description:
    'Designed and built an interactive application for selecting board games and visually determining how they fit inside a real-world storage crate.',
  bullets: [
    'Built a Three.js packing interface using real board-game box dimensions, constrained rotations, and stacking behavior',
    'Created responsive desktop and mobile experiences with persistent menus and game administration',
    'Built a serverless backend using Cloudflare Workers, D1, and R2',
    'Used AI-augmented engineering to take the initial application from concept through design, implementation, debugging, and deployment in a single evening',
  ],
  tech: [
    'React',
    'TypeScript',
    'Three.js',
    'Cloudflare Workers',
    'D1',
    'R2',
    'AI-Augmented Development',
  ],
},

{
  title: 'Manufacturing Vision Image Platform',
  company: 'Magna Electric Vehicle Structures',
  period: '2024 – 2025',
  description:
    'Built a manufacturing image pipeline and lookup system that connected computer-vision imagery from production stations with corresponding production records.',
  bullets: [
    'Created a Python pipeline to move station-generated images from local plant storage into AWS S3',
    'Linked stored imagery with manufacturing records in SQL for traceability and retrieval',
    'Built tooling for quickly locating and reviewing production imagery associated with specific manufacturing data',
    'Connected factory-floor infrastructure, cloud storage, and internal software into a single workflow',
  ],
  tech: ['Python', 'AWS S3', 'SQL', 'C#', '.NET', 'Manufacturing Systems'],
},

{
  title: 'Security Gate Operations Dashboard',
  company: 'Magna Electric Vehicle Structures',
  period: '2024 – 2025',
  description:
    'Developed an internal operations interface that gave plant security a centralized view of facility entrances and controls for day-to-day gate operations.',
  bullets: [
    'Integrated live camera previews for multiple facility entrances into a single dashboard',
    'Connected the application with gate-control APIs to allow authorized users to operate gate arms from the interface',
    'Designed the UI around rapid visibility and straightforward control for security personnel',
    'Consolidated previously separate physical-security systems into a more accessible operational workflow',
  ],
  tech: ['React', 'TypeScript', 'C#', '.NET', 'REST APIs', 'Camera Systems'],
},
  {
    title: 'Production Tracking & Shipment Forecasting Dashboard',
    company: 'Magna Electric Vehicle Structures',
    period: 'June 2024 – Sept 2025',
    description:
      'Designed and delivered a dashboard that connected invoiced demand with factory inventory and production data to improve operational visibility and decision-making.',
    bullets: [
      'Correlated demand with multi-stage inventory levels across the factory',
      'Enabled proactive identification of supply gaps and near-term production risks',
      'Improved process efficiency through full-stack development and data visibility tools',
    ],
    tech: ['React', 'TypeScript', 'C#', '.NET', 'SQL', 'AWS', 'Docker', 'PowerBI'],
  },
  {
    title: 'Employee Suggestion Management Platform',
    company: 'Magna Electric Vehicle Structures',
    period: 'June 2024 – Sept 2025',
    description:
      'Built an internal employee engagement and suggestion platform with secure authentication, workflow-based reviews, and management visibility.',
    bullets: [
      'Implemented secure Active Directory SSO for user authentication',
      'Created workflow-based review processes for submitted suggestions',
      'Provided management with visibility into engagement and submission progress',
    ],
    tech: ['React', 'TypeScript', '.NET', 'C#', 'SQL', 'Active Directory'],
  },
    {
    title: 'Sign Out Conversion Gateway',
    company: 'Rocket Innovation Studio',
    period: 'Jun 2023 – Aug 2023',
    description:
      'Redesigned the sign-out experience into a cross-selling gateway that increased user conversion by 12%.',
    bullets: [
      'Led the project as Technical Lead, working closely with client, UI/UX, and development teams',
      'Transformed a simple confirmation page into an interactive product discovery experience',
      'Delivered measurable business impact with a 12% increase in product conversion',
      'Presented demos to stakeholders to showcase results and validate impact',
    ],
    tech: ['React', 'TypeScript', '.NET', 'Node.js', 'AWS', 'Docker'],
  },
  {
    title: 'Augmented Reality Training Platform',
    company: 'DataRealm Inc.',
    period: 'Oct 2017 – Nov 2021',
     description:
      'Built an augmented reality training system for manufacturing that improved training performance by 17%.',
    bullets: [
      'Led development of a full-stack AR platform using Unity, C#, and .NET',
      'Designed backend to store and serve AR scene data (objects, text, coordinates)',
      'Enabled real-world hologram-based training experiences on HoloLens and Android devices',
      'Conducted on-site training sessions with workers using the platform',
    ],
    tech: ['Unity', 'C#', '.NET', 'SQL', 'HoloLens', 'Android'],
  },
];

export function Projects() {
  return (
    <section id="projects" className="bg-gradient-to-b from-[var(--color-lighter-emerald)] to-[var(--color-darker-emerald)] py-20 px-4">
      <div className="max-w-5xl mx-auto bg-white/80 rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div className="mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Projects</h2>
          <p className="mt-3 text-md md:text-xl text-gray-900 max-w-4xl">
            A selection of projects spanning mobile apps, internal business platforms,
            analytics dashboards, and augmented reality solutions.
          </p>
        </div>

        <div className="grid gap-6">
          {projects.map((project) => (
            <article
              key={project.title}
              className="bg-white/50 rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{project.title}</h3>
                  <p className="text-md text-gray-500">
                    {project.company} • {project.period}
                  </p>
                </div>
              </div>
            {project.url && (
              <Link to={project.url} className="project-link">
                Live Demo
              </Link>
            )}
              <p className="text-gray-700 mb-4">{project.description}</p>

              <ul className="list-disc pl-5 space-y-2 text-gray-700 mb-4">
                {project.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>

              <div className="flex flex-wrap gap-2">
                {project.tech.map((item) => (
                  <span
                    key={item}
                    className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-full"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Projects;
