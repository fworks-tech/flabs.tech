import type { About, Blog, Home, Newsletter, Person, Social, Work } from "@/types";

const person: Person = {
  firstName: "Fabio",
  lastName: "Borges",
  name: "Fabio Borges",
  role: "Full Stack Web Developer & AI Engineer",
  avatar: "/images/avatar.webp",
  email: "",
  resume: "/resume.pdf",
  location: "America/Sao_Paulo",
  city: "Joinville, Brazil",
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
    link: "https://github.com/fworks-tech",
    essential: false,
  },
];

const home: Home = {
  path: "/",
  image: "/api/og/generate",
  label: "Home",
  title: "Fabio Borges' Portfolio",
  description: `${person.role}. 10+ years across frontend, backend, testing, devops & AI engineering.`,
  headline: "Hey there, I'm Fabio Borges",
  featured: {
    display: false,
    title: <></>,
    href: "/projects",
  },
  subline:
    "Full Stack Web Developer & AI Engineer with 10+ years of experience across frontend, backend, testing, and DevOps. I've shipped products for companies in the US, Europe, and Brazil, always balancing solid architecture with real‑world delivery.",
};

const about: About = {
  path: "/about",
  label: "About",
  title: `About – ${person.name}`,
  description: `${person.role} from Joinville, Brazil.`,
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
        I&apos;m a Full Stack Web Developer & AI Engineer with 10+ years of experience across
        frontend, backend, testing, and DevOps. I&apos;ve shipped products for companies in the US, Europe, and
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
        framework where a squad of specialized agents enforce engineering standards, review code and
        commits, manage multi‑tier memory, and run autonomously via a TypeScript CLI.
        The project includes a browser‑based Studio playground with SSE streaming, 6 providers,
        and server‑side rate limiting.
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
  title: "Work Experience — Fabio Borges",
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
          { name: "Vite" },
          { name: "Tailwind CSS" },
          { name: "MUI" },
          { name: "Leaflet" },
          { name: "Storybook" },
        ],
        images: [],
      },
      {
        title: "Backend & APIs",
        description: <></>,
        tags: [
          { name: "Python" },
          { name: "FastAPI" },
          { name: "Node.js" },
          { name: "Django" },
          { name: "GraphQL", icon: "graphql" },
          { name: "PostgreSQL" },
          { name: "SQLite" },
          { name: "MongoDB" },
        ],
        images: [],
      },
      {
        title: "Web & Templating",
        description: <></>,
        tags: [
          { name: "HTMX" },
          { name: "Jinja2" },
          { name: "Apollo" },
        ],
        images: [],
      },
      {
        title: "Python Ecosystem",
        description: <></>,
        tags: [
          { name: "Typer" },
          { name: "Rich" },
          { name: "Pydantic" },
          { name: "SQLModel" },
          { name: "PyMuPDF" },
          { name: "Pillow" },
        ],
        images: [],
      },
      {
        title: "AI & Agents",
        description: <></>,
        tags: [
          { name: "Claude AI" },
          { name: "OpenCode" },
          { name: "LangChain" },
          { name: "HuggingFace" },
          { name: "sentence-transformers" },
          { name: "MCP" },
          { name: "Groq" },
          { name: "OpenAI" },
          { name: "Ollama" },
          { name: "Anthropic" },
          { name: "LanceDB" },
          { name: "Chroma" },
          { name: "Tree-sitter" },
          { name: "SSE" },
        ],
        images: [],
      },
      {
        title: "Testing",
        description: <></>,
        tags: [
          { name: "Vitest" },
          { name: "Playwright" },
          { name: "pytest" },
        ],
        images: [],
      },
      {
        title: "Cloud & DevOps",
        description: <></>,
        tags: [
          { name: "Docker" },
          { name: "Render" },
          { name: "GitHub Actions" },
          { name: "Vercel" },
          { name: "AWS" },
        ],
        images: [],
      },
    ],
  },
};

const workExperience = {
  experiences: [
    {
      company: "Micro1",
      timeframe: "Jun 2026 – Present",
      role: "AI Trainer",
      location: "Remote",
      type: "Part-time",
      achievements: [
        "Applying subject matter expertise to support AI training pipelines.",
        "Supporting the development of advanced AI systems by contributing expert feedback and domain-specific evaluation of model responses.",
        "Tasks include evaluating model outputs, reviewing technical reasoning, and contributing domain knowledge used to improve model performance.",
      ],
      tags: [],
      images: [],
    },
    {
      company: "BairesDev",
      timeframe: "Dec 2025 – Jun 2026",
      role: "Full Stack Engineer",
      location: "United States (remote)",
      type: "Full-time",
      achievements: [
        "Engineered automated AI checkout systems using GraphQL Federation for major US telecom partners, processing 1,000+ daily transactions.",
        "Architected subgraph solutions overseeing the full lifecycle — from API analysis to CI/infrastructure setup.",
        "Enhanced system observability by implementing New Relic flow-tracking instrumentation.",
      ],
      tags: [],
      images: [],
    },
    {
      company: "BairesDev",
      timeframe: "Jan 2025 – Sep 2025",
      role: "Full Stack Engineer",
      location: "United States (remote)",
      type: "Full-time",
      achievements: [
        "Implemented reusable React interactive forms covering US regulations for Veterans, significantly reducing time spent on digital paperwork.",
        "Improved Core Web Vitals and React performance through advanced optimization techniques.",
        "Ensured a11y and WCAG 2.1 AA compliance with mobile-first design patterns.",
        "Established robust testing strategies with Jest and Playwright, reducing regression bugs by 35%.",
      ],
      tags: [],
      images: [],
    },
    {
      company: "Present Technologies",
      timeframe: "Jan 2023 – Apr 2024",
      role: "Full Stack Engineer",
      location: "Portugal (remote)",
      type: "Full-time",
      achievements: [
        "Architected scalable front-end interfaces for Farfetch's global e-commerce platform, improving SEO and page load performance by 25%.",
        "Led the complete application rebuild of Liminal Link and contributed to LinkGPT, an AI-powered digital market assistant.",
        "Implemented automated testing and performance monitoring tools, significantly reducing memory leaks.",
      ],
      tags: [],
      images: [],
    },
    {
      company: "DBC Company",
      timeframe: "Aug 2021 – Sep 2022",
      role: "Senior Frontend Developer",
      location: "Brazil",
      type: "Full-time",
      achievements: [
        "Designed front-end application architecture from scratch, influencing product decisions and supporting backend tasks.",
        "Built Chart.js dashboards that reduced data analysis time by 40% through modern chart types and data export methods.",
        "Developed responsive applications in React.js with reusable component libraries.",
      ],
      tags: [],
      images: [],
    },
    {
      company: "Gofind",
      timeframe: "Jul 2020 – Aug 2021",
      role: "Senior Frontend Developer",
      location: "Brazil",
      type: "Full-time",
      achievements: [
        "Architected a product/store management platform and a geolocation-based product discovery app.",
        "Reduced deployment downtime by 50% through GitLab CI/CD integration and automated testing.",
        "Optimized performance using Clean Architecture, Context API, and Zod form validation.",
      ],
      tags: [],
      images: [],
    },
    {
      company: "SoftExpert",
      timeframe: "Jun 2019 – Jul 2020",
      role: "Senior Frontend Developer",
      location: "Brazil",
      type: "Full-time",
      achievements: [
        "Engineered a scalable enterprise ERP system with React.js, Redux, and Material-UI.",
        "Developed core framework components in TypeScript with Formik, ensuring standardized UI/UX patterns.",
        "Integrated RESTful APIs in collaboration with backend teams, improving API response time by 20%.",
      ],
      tags: [],
      images: [],
    },
    {
      company: "TOTVS",
      timeframe: "Jun 2016 – Jun 2019",
      role: "R&D Engineer → QA Technician → Intern",
      location: "Joinville, Brazil",
      type: "Full-time",
      achievements: [
        "Maintained and evolved core ERP product functionalities across front-end, back-end, and DevOps.",
        "Led internal Protractor e2e training, improving code quality and reducing production bugs.",
        "Integrated testing into CI/CD pipelines using Jenkins; monitored static analysis with SonarQube.",
        "Developed internal frameworks for web application development, enhancing delivery velocity.",
      ],
      tags: [],
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
  title: `Blog — ${person.name}`,
  description: `Engineering blog by ${person.name} — web development, AI agents, and production systems from real-world engineering.`,
};

const work: Work = {
  path: "/work",
  label: "Work",
  title: "Work Experience",
  description:
    "Architecture, frontend, backend, AI, and DevOps — real-world notes from a Full Stack Web Developer & AI Engineer",
};

const projects: Work = {
  path: "/projects",
  label: "Projects",
  title: `Projects — ${person.name}`,
  description: `Open-source tools, AI experiments, and personal builds by ${person.name}`,
};

export { person, social, newsletter, home, about, blog, work, projects, workExperience };
