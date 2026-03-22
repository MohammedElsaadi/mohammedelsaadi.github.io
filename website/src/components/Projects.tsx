export interface IProjectsProps {}

const projects = [
  {
    title: 'Sign Management Mobile Platform',
    company: 'Intellino Technology Inc.',
    period: 'Sept 2025 – Present',
    description:
      'Architected and developed a cross-platform mobile application for Android and iOS to support scalable device provisioning, content management, and SaaS deployment.',
    bullets: [
      'Built with Flutter, Dart, .NET, C#, PostgreSQL, and Google Cloud Platform',
      'Designed cloud architecture including authentication, storage, APIs, and data pipelines',
      'Focused on scalability, maintainability, and production-ready SaaS delivery',
    ],
    tech: ['Flutter', 'Dart', '.NET', 'C#', 'PostgreSQL', 'GCP'],
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
    <section id="projects" className="bg-emerald-700 py-20 px-4">
      <div className="max-w-5xl mx-auto bg-gray-50 rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div className="mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Projects</h2>
          <p className="mt-3 text-gray-600 max-w-2xl">
            A selection of projects spanning mobile apps, internal business platforms,
            analytics dashboards, and augmented reality solutions.
          </p>
        </div>

        <div className="grid gap-6">
          {projects.map((project) => (
            <article
              key={project.title}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{project.title}</h3>
                  <p className="text-sm text-gray-500">
                    {project.company} • {project.period}
                  </p>
                </div>
              </div>

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