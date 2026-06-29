import type { About, Blog, Home, Newsletter, Person, Social, Work } from "@/types";

const person: Person = {
  firstName: "Fabio",
  lastName: "Ritzel Borges",
  name: "Fabio Ritzel Borges",
  role: "Senior Full-Stack Engineer · AI Engineering",
  avatar: "/images/avatar.webp",
  email: "fritzelborges@gmail.com",
  resume: "/resume.pdf",
  location: "America/Sao_Paulo",
  languages: ["English", "Portuguese"],
};

const newsletter: Newsletter = {
  display: false,
  title: <>Stay in the loop</>,
  description: (
    <>
      Newsletter coming soon — stay tuned for updates on engineering, AI agents, and building
      production systems.
    </>
  ),
};

const social: Social = [
  {
    name: "GitHub",
    icon: "github",
    link: "https://github.com/fworks-tech",
    essential: true,
  },
  {
    name: "LinkedIn",
    icon: "linkedin",
    link: "https://www.linkedin.com/in/fabiorborges/",
    essential: true,
  },
  {
    name: "Email",
    icon: "email",
    link: `mailto:${person.email}`,
    essential: true,
  },
];

const home: Home = {
  path: "/",
  image: "/api/og/generate",
  label: "Home",
  title: `${person.name}'s Portfolio`,
  description:
    "Senior Full-Stack Engineer & AI Systems Architect. Building production GraphQL APIs and autonomous AI agents.",
  headline: "Hey there, I'm Fabio Borges",
  featured: {
    display: false,
    title: <></>,
    href: "/projects",
  },
  subline:
    "I'm a Senior Full-Stack & AI Engineer with 10+ years of experience across frontend, backend, and testing. I've shipped products for companies in the US, Europe, and Brazil, always balancing solid architecture with real‑world delivery.",
};

const about: About = {
  path: "/about",
  label: "About",
  title: `About – ${person.name}`,
  description: "Senior Full-Stack Engineer & AI Systems Architect from Joinville, Brazil.",
  tableOfContent: {
    display: false,
    subItems: false,
  },
  avatar: {
    display: true,
  },
  calendar: {
    display: false,
    link: "https://cal.com",
  },
  intro: {
    display: true,
    title: "Introduction",
    description: (
      <>
        I&apos;m a Senior Full‑Stack Engineer & AI Systems Architect with 10+ years of experience across
        frontend, backend, and testing. I&apos;ve shipped products for companies in the US, Europe, and
        Brazil, always balancing solid architecture with real‑world delivery.
        <br />
        <br />
        On the backend, I design and build production GraphQL APIs and federated architectures with
        TypeScript and Node.js. At BairesDev I&apos;ve engineered AI‑powered checkout systems for major
        US telecom partners using Apollo Federation and WunderGraph, handling 1,000+ transactions
        per day with CI‑enforced contracts and New Relic observability end‑to‑end.
        <br />
        <br />
        On the frontend, I have deep experience building modern React and Next.js applications for
        e‑commerce, enterprise dashboards, and complex form workflows. I&apos;ve led Core Web Vitals and
        SEO improvements, implemented WCAG 2.1 AA accessibility, and created reusable component
        systems using TypeScript, Storybook, Jest, and Playwright.
        <br />
        <br />I also build agentic AI systems and tooling. Agenthood is my open‑source multi‑agent
        framework where 16 specialized agents enforce engineering standards, review code and
        commits, manage multi‑tier memory, and run autonomously via a TypeScript CLI.
        The project includes a browser‑based Studio playground with SSE streaming, 6 providers,
        and server‑side rate limiting. Other projects like ApolloDroid and VeriHire explore how
        to bring LLMs into real products with the same discipline I apply to production web systems.
        <br />
        <br />
        My best work happens where scalable GraphQL backends, high‑quality React frontends, and AI
        agents meet — designing contracts, building the systems behind them, and shaping the UX that
        teams and users actually rely on every day.
      </>
    ),
  },
  work: {
    display: false,
  title: "Work Experience — Fabio Ritzel Borges",
    experiences: [],
  },
  studies: {
    display: false,
    title: "Education",
    institutions: [],
  },
  technical: {
    display: true,
    title: "Technical skills",
    skills: [
      {
        title: "Frontend",
        description: <></>,
        tags: [
          { name: "TypeScript", icon: "typescript" },
          { name: "React", icon: "react" },
          { name: "Next.js", icon: "nextjs" },
          { name: "Tailwind CSS" },
          { name: "Once UI" },
          { name: "SCSS Modules" },
        ],
        images: [],
      },
      {
        title: "Backend & APIs",
        description: <></>,
        tags: [
          { name: "GraphQL", icon: "graphql" },
          { name: "Apollo Federation" },
          { name: "Node.js" },
          { name: "Django", icon: "python" },
          { name: "PostgreSQL" },
          { name: "MongoDB" },
          { name: "AWS" },
          { name: "Docker" },
        ],
        images: [],
      },
      {
        title: "AI & Agents",
        description: <></>,
        tags: [
          { name: "Claude AI" },
          { name: "OpenCode" },
          { name: "Groq" },
          { name: "Ollama" },
          { name: "RAG pipelines" },
          { name: "LanceDB" },
          { name: "Chroma" },
          { name: "ReAct loops" },
          { name: "Multi-agent orchestration" },
          { name: "Vector search" },
          { name: "Tree-sitter" },
        ],
        images: [],
      },
    ],
  },
};

const workExperience = {
  experiences: [
    {
      company: "BairesDev",
      timeframe: "Dec 2025 – Present",
      role: "Full Stack Engineer",
      location: "United States (remote)",
      achievements: [
        "Engineered automated AI checkout systems using GraphQL Federation for major US telecom partners, processing 1,000+ daily transactions.",
        "Architected subgraph solutions overseeing the full lifecycle — from API analysis to CI/infrastructure setup.",
        "Enhanced system observability by implementing New Relic flow-tracking instrumentation.",
      ],
      images: [],
    },
    {
      company: "BairesDev",
      timeframe: "Jan 2025 – Sep 2025",
      role: "Full Stack Engineer",
      location: "United States (remote)",
      achievements: [
        "Implemented reusable React interactive forms covering US regulations for Veterans, significantly reducing time spent on digital paperwork.",
        "Improved Core Web Vitals and React performance through advanced optimization techniques.",
        "Ensured a11y and WCAG 2.1 AA compliance with mobile-first design patterns.",
        "Established robust testing strategies with Jest and Playwright, reducing regression bugs by 35%.",
      ],
      images: [],
    },
    {
      company: "Present Technologies",
      timeframe: "Jan 2023 – Apr 2024",
      role: "Full Stack Engineer",
      location: "Portugal (remote)",
      achievements: [
        "Architected scalable front-end interfaces for Farfetch's global e-commerce platform, improving SEO and page load performance by 25%.",
        "Led the complete application rebuild of Liminal Link and contributed to LinkGPT, an AI-powered digital market assistant.",
        "Implemented automated testing and performance monitoring tools, significantly reducing memory leaks.",
      ],
      images: [],
    },
    {
      company: "DBC Company",
      timeframe: "Aug 2021 – Sep 2022",
      role: "Senior Frontend Developer",
      location: "Brazil",
      achievements: [
        "Designed front-end application architecture from scratch, influencing product decisions and supporting backend tasks.",
        "Built Chart.js dashboards that reduced data analysis time by 40% through modern chart types and data export methods.",
        "Developed responsive applications in React.js with reusable component libraries.",
      ],
      images: [],
    },
    {
      company: "Gofind",
      timeframe: "Jul 2020 – Aug 2021",
      role: "Senior Frontend Developer",
      location: "Brazil",
      achievements: [
        "Architected a product/store management platform and a geolocation-based product discovery app.",
        "Reduced deployment downtime by 50% through GitLab CI/CD integration and automated testing.",
        "Optimized performance using Clean Architecture, Context API, and Zod form validation.",
      ],
      images: [],
    },
    {
      company: "SoftExpert",
      timeframe: "Jun 2019 – Jul 2020",
      role: "Senior Frontend Developer",
      location: "Brazil",
      achievements: [
        "Engineered a scalable enterprise ERP system with React.js, Redux, and Material-UI.",
        "Developed core framework components in TypeScript with Formik, ensuring standardized UI/UX patterns.",
        "Integrated RESTful APIs in collaboration with backend teams, improving API response time by 20%.",
      ],
      images: [],
    },
    {
      company: "TOTVS",
      timeframe: "Jun 2016 – Jun 2019",
      role: "R&D Engineer → QA Technician → Intern",
      location: "Joinville, Brazil",
      achievements: [
        "Maintained and evolved core ERP product functionalities across front-end, back-end, and DevOps.",
        "Led internal Protractor e2e training, improving code quality and reducing production bugs.",
        "Integrated testing into CI/CD pipelines using Jenkins; monitored static analysis with SonarQube.",
        "Developed internal frameworks for web application development, enhancing delivery velocity.",
      ],
      images: [],
    },
  ],
  education: [
    {
      institution: "Pontifícia Universidade Católica do Paraná",
      degree: "Postgraduate — Software Architecture, Data Science & Cybersecurity",
      timeframe: "Apr 2025 – Apr 2026",
    },
    {
      institution: "UNINTER Centro Universitário Internacional",
      degree: "Associate's — Systems Analysis and Development",
      timeframe: "Jan 2018 – Dec 2021",
    },
  ],
};

const blog: Blog = {
  path: "/blog",
  label: "Blog",
  title: "Blog — Fabio Ritzel Borges",
  description: "Engineering blog by Fabio Ritzel Borges — GraphQL Federation, multi-agent AI systems, TypeScript, React, and production full-stack engineering.",
};

const work: Work = {
  path: "/work",
  label: "Work",
  title: "Work Experience",
  description:
    "10+ years across USA, Europe, and Brazil — TypeScript, GraphQL, React, and AI systems",
};

const projects: Work = {
  path: "/projects",
  label: "Projects",
  title: "Projects — Fabio Ritzel Borges",
  description: `Open-source tools, AI experiments, and personal builds by ${person.name}`,
};

export { person, social, newsletter, home, about, blog, work, projects, workExperience };
