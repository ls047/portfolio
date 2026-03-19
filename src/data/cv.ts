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
  tech: string[];
  link?: string;
}

export interface CvSkill {
  category?: string;
  items: string[];
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
  projects: [
    {
      name: 'SuperHackathon Platform',
      description: 'Hackathon platform for SuperHackathon 2025. Includes contestants\' login, QR code generation, account creation, acceptance dashboard, questions, and integrated code editor (IDE).',
      tech: ['Vue.js', 'Tailwind CSS', 'WebSocket'],
    },
    {
      name: 'Nova Dev Sprint',
      description: 'A newer hackathon platform similar to SuperHackathon. Includes contestant registration, real-time communication, QR generation, account management, and an interactive coding environment.',
      tech: ['Vue.js', 'Tailwind CSS', 'WebSocket'],
    },
    {
      name: 'Hashillo',
      description: 'Password management suite with features including QR code generation and a URL safety checker.',
      tech: ['Vue.js', 'Tailwind CSS'],
    },
    {
      name: 'IQ Test System',
      description: 'Platform for managing IQ tests for the Ministry of Youth and Sports. Allows users to log in, create accounts, take tests, and view past and recent results.',
      tech: ['Vue.js', 'Tailwind CSS'],
    },
    {
      name: 'NASTYA DMS',
      description: 'Document management system managing archives and documents for organizations. Features archiving, classifying, search, preview, email sending, and download with details. Theme picker changes the whole system theme. 62 pages built with Vue.js and Tailwind CSS.',
      tech: ['Vue.js', 'Tailwind CSS'],
    },
    {
      name: 'NASTYA FLOW',
      description: 'Workflow system managing Chartered accountants in the organization. Managers track customer orders across the organization from data entry to final Auditor before approval. Includes theme picker for system theming.',
      tech: ['Vue.js', 'Tailwind CSS'],
    },
    {
      name: 'pad.moys',
      description: 'Official platform for the Ministry of Youth and Sports to manage and publish news, programs, and events. Includes dynamic content loading, secure user authentication, and admin dashboard for content management.',
      tech: ['Vue.js', 'Tailwind CSS', 'REST API'],
    },
    {
      name: 'SKY Reed Diffuser',
      description: 'Clean, modern product-landing website for a reed diffuser brand. Showcases product story, scents, key features. Uses smooth scroll-based sections (hero, product highlights, variants, gallery, CTA). Fully responsive with Tailwind, deployed as a lightweight frontend.',
      tech: ['Vue.js', 'Tailwind CSS'],
    },
  ],
  skills: [
    { items: ['Nuxt.js', 'Vue.js'] },
    { items: ['Tailwind CSS', 'TypeScript', 'JavaScript'] },
    { items: ['Git', 'GitHub'] },
    { items: ['Python', 'PHP (Beginner)'] },
    { items: ['WebSockets', 'APIs'] },
  ],
  languages: [
    { name: 'Arabic', level: 'Native' },
    { name: 'English', level: 'Professional' },
  ],
  links: [
    { label: 'LinkedIn', url: 'https://linkedin.com/in/profile/' },
    { label: 'GitHub', url: 'https://github.com/ls047' },
    { label: 'Portfolio', url: 'https://ali-khalil.dev' },
  ],
};
