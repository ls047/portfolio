export interface CvMe {
  name: string;
  title: string;
  location: string;
  phone: string;
  email: string;
  summary?: string;
}

export interface CvExperience {
  company: string;
  role: string;
  period: string;
  description: string;
}

export interface CvEducation {
  school: string;
  degree: string;
  period: string;
  description?: string;
}

export interface CvProject {
  name: string;
  description: string;
  /** Extra context shown only in the preview modal (card stays short). */
  detail?: string;
  tech: string[];
  /** Optional screenshot or hero (URL or `/path` under `public/`). */
  image?: string;
  /** Optional larger or alternate image in the modal (defaults to `image`). */
  modalImage?: string;
  /** Public live app / interface URL. */
  link?: string;
  /** Public GitHub repository — hidden when `organizationProject` is true. */
  githubUrl?: string;
  /** Org/client work: source is not public; modal shows an explanation instead of GitHub. */
  organizationProject?: boolean;
}

/** Single skill with mastery 0–100 for progress display */
export interface CvSkillItem {
  name: string;
  mastery: number;
}

export interface CvSkill {
  category?: string;
  items: CvSkillItem[];
}

export interface CvLanguage {
  name: string;
  level: string;
}

export interface CvLink {
  label: string;
  url: string;
}

export interface CvData {
  me: CvMe;
  experiences: CvExperience[];
  education: CvEducation;
  projects: CvProject[];
  skills: CvSkill[];
  languages: CvLanguage[];
  links: CvLink[];
}

export const cvData: CvData = {
  me: {
    name: 'Ali Khalil',
    title: 'Front End Web Developer',
    location: 'Karada, Baghdad',
    phone: '+964 7884242014',
    email: 'alikibrahim190@gmail.com',
    summary: 'Front-end developer crafting pixel-perfect, unique user experiences with Vue.js and modern web technologies.',
  },
  experiences: [
    {
      company: 'Nastya Technology',
      role: 'Front-End Developer',
      period: 'May 2025 – Present',
      description: 'Working with the software solutions team as the newest department in the company.',
    },
    {
      company: 'SuperNova Agency IQ',
      role: 'Front-End Developer',
      period: 'May 2024 – 2025',
      description: 'Working with the frontend team to provide and maintain pixel-perfect, unique user experiences.',
    },
  ],
  education: {
    school: 'University of Information Technology and Communication',
    degree: 'Bachelor in Computer Engineering',
    period: 'Dec 2022 – 2026',
    description: 'Pursuing a degree in Computer Science, Business, and Information Management.',
  },
  /** Add `image: '/images/your-file.png'` (under `public/images/`) or a full URL; omitted → placeholder. */
  projects: [
    {
      name: 'Hashillo',
      description: 'Password management suite with features including QR code generation and a URL safety checker.',
      detail:
        'Built as a focused security-minded frontend: generate passwords, scan links before you open them, and use QR flows where sharing secrets safely matters. The UI keeps dense features approachable with clear steps and Tailwind-driven layout.',
      tech: ['Vue.js', 'Tailwind CSS'],
      image: '/images/hashilo.png',
      link: 'https://password-suit.vercel.app/',
      githubUrl: 'https://github.com/ls047/password-suit',
    },
    {
      name: 'IQ Test System',
      description: 'Platform for managing IQ tests for the Ministry of Youth and Sports. Allows users to log in, create accounts, take tests, and view past and recent results.',
      detail:
        'End-to-end flows for ministry-branded IQ testing: authentication, account lifecycle, timed or structured tests, and dashboards for recent vs historical results so administrators and participants always see consistent state.',
      tech: ['Vue.js', 'Tailwind CSS'],
      image: '/images/iq-test.png',
      organizationProject: true,
    },
    {
      name: 'NASTYA DMS',
      description: 'Document management system managing archives and documents for organizations. Features archiving, classifying, search, preview, email sending, and download with details. Theme picker changes the whole system theme. 62 pages built with Vue.js and Tailwind CSS.',
      detail:
        'Enterprise-scale document tooling: classify archives, preview files in-app, trigger email workflows, and download with full metadata. A global theme picker recolors the entire app—62+ screens stayed consistent through shared layout and Tailwind tokens.',
      tech: ['Vue.js', 'Tailwind CSS'],
      image: '/images/nastya-DMS.png',
      organizationProject: true,
    },
    {
      name: 'NASTYA FLOW',
      description: 'Workflow system managing Chartered accountants in the organization. Managers track customer orders across the organization from data entry to final Auditor before approval. Includes theme picker for system theming.',
      detail:
        'Process visibility for accounting teams: every matter moves from intake through approval gates with manager oversight. Role-aware views and a system-wide theme picker keep long sessions readable for staff who live in the tool daily.',
      tech: ['Vue.js', 'Tailwind CSS'],
      image: '/images/nastya-flow.png',
      organizationProject: true,
    },
    {
      name: 'pad.moys',
      description: 'Official platform for the Ministry of Youth and Sports to manage and publish news, programs, and events. Includes dynamic content loading, secure user authentication, and admin dashboard for content management.',
      detail:
        'Public-facing ministry portal with authenticated admin tools: publish news and events, load dynamic sections without full reloads, and maintain content through a structured dashboard backed by REST APIs.',
      tech: ['Vue.js', 'Tailwind CSS', 'REST API'],
      image: '/images/pad-moys.png',
      organizationProject: true,
    },
    {
      name: 'SKY Reed Diffuser',
      description: 'Clean, modern product-landing website for a reed diffuser brand. Showcases product story, scents, key features. Uses smooth scroll-based sections (hero, product highlights, variants, gallery, CTA). Fully responsive with Tailwind, deployed as a lightweight frontend.',
      detail:
        'Brand-led marketing site: scroll-linked storytelling, scent and variant highlights, gallery, and strong CTA blocks—all responsive and lightweight enough to deploy as a static-feeling Vue + Tailwind frontend.',
      tech: ['Vue.js', 'Tailwind CSS'],
      image: '/images/SKY.png',
      link: 'https://sky-reed-diffuser.vercel.app/',
      githubUrl: 'https://github.com/ls047/SKY-reed-diffuser',
    },
    {
      name: 'Weatherino',
      description:
        'A simple weather app built with Vue.js and Tailwind CSS, powered by the OpenWeather API for current conditions and lookups.',
      detail:
        'Small, focused UI for checking weather by location: Tailwind-driven layout, API-backed data, and a straightforward flow for everyday use.',
      tech: ['Vue.js', 'Tailwind CSS', 'OpenWeather API'],
      image: '/images/weatherino.png',
      link: 'https://weatherino-plum.vercel.app/',
      githubUrl: 'https://github.com/ls047/weatherino',
    },
    {
      name: 'five-years-plan',
      description: 'Five-year plan for the organization. Includes dynamic content loading, secure user authentication, and admin dashboard for content management.',
      detail:
        'Long-horizon planning tools with secure access: dynamic data surfaces, admin dashboards for structured updates, and REST-backed workflows so stakeholders work from a single source of truth.',
      tech: ['Vue.js', 'Tailwind CSS', 'REST API'],
      image: '/images/fyp.jpg',
      organizationProject: true,
    },
    {
      name: 'SuperHackathon Platform',
      description: 'Hackathon platform for SuperHackathon 2025. Includes contestants\' login, QR code generation, account creation, acceptance dashboard, questions, and integrated code editor (IDE).',
      detail:
        'Event operations in one place: contestant auth, QR check-in materials, acceptance and judging views, timed questions, and an embedded coding surface so teams never leave the platform mid-competition.',
      tech: ['Vue.js', 'Tailwind CSS', 'WebSocket'],
      organizationProject: true,
    },
    {
      name: 'Nova Dev Sprint',
      description: 'A newer hackathon platform similar to SuperHackathon. Includes contestant registration, real-time communication, QR generation, account management, and an interactive coding environment.',
      detail:
        'Iteration on the hackathon formula: registration and accounts, live messaging, QR utilities, and a tighter coding experience with WebSocket-backed real-time updates where it counts.',
      tech: ['Vue.js', 'Tailwind CSS', 'WebSocket'],
      organizationProject: true,
    },
    {
      name: 'tic tac toe',
      description: 'An online tic tac toe game built with Vue.js and Tailwind CSS, and websockets.',
      detail:
        'Real-time matches over WebSockets with a minimal Tailwind UI—quick rounds, clear board state, and no page reloads between moves.',
      tech: ['Vue.js', 'Tailwind CSS', 'WebSocket'],
      organizationProject: true,
    },
    {
      name: 'siantafic affairs',
      description: 'A simple system for managing the affairs of the university of information technology and communication.',
      detail:
        'Administrative workflows for university affairs: Vue + Tailwind interfaces for staff to track and update cases in one internal system.',
      tech: ['Vue.js', 'Tailwind CSS'],
      organizationProject: true,
    },
    {
      name: 'univercity management system',
      description: 'A simple system for managing the affairs of the university of information technology and communication, including lectures and students, submitting assignments, and more.',
      detail:
        'Campus operations support: lectures, students, and assignment hand-ins—REST-backed screens so faculty and students share the same structured data.',
      tech: ['Vue.js', 'Tailwind CSS', 'REST API'],
      organizationProject: true,
    },
  ],
  skills: [  
    {
      category: 'Languages & styling',
      items: [
        { name: 'JavaScript', mastery: 92 },
        { name: 'TypeScript', mastery: 86 },
        { name: 'Tailwind CSS', mastery: 95 },
      ],
    },
    {
      category: 'Tools & delivery',
      items: [
        { name: 'Git', mastery: 90 },
        { name: 'GitHub', mastery: 90 },
      ],
    },
    {
      category: 'Backend & APIs',
      items: [
        { name: 'NestJS', mastery: 74 },
        { name: 'REST APIs', mastery: 85 },
        { name: 'WebSockets', mastery: 82 },
        { name: 'SQL', mastery: 76 },
        { name: 'Python', mastery: 72 },
        { name: 'PHP', mastery: 48 },
      ],
    },
  ],
  languages: [
    { name: 'Arabic', level: 'Native' },
    { name: 'English', level: 'Professional' },
  ],
  links: [
    { label: 'LinkedIn', url: 'https://www.linkedin.com/in/ali-k-al-ibadi-33b303286/' },
    { label: 'GitHub', url: 'https://github.com/ls047' },
    { label: 'Portfolio', url: 'https://portfolio-ochre-delta-0r0pbd6epz.vercel.app/' },
  ],
};
