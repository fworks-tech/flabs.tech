import { About, Blog, Gallery, Home, Newsletter, Person, Social, Work } from "@/types";

const person: Person = {
  firstName: "Fabio",
  lastName: "Ritzel Borges",
  name: "Fabio Ritzel Borges",
  role: "Senior Full-Stack Engineer & AI Systems Architect",
  avatar: "/images/avatar.png",
  email: "fritzelborges@gmail.com",
  location: "America/Sao_Paulo",
  languages: ["English", "Portuguese"],
};

const newsletter: Newsletter = {
  display: false,
  title: <>Subscribe to {person.firstName}'s Newsletter</>,
  description: <>Thoughts on engineering, GenAI, and building things.</>,
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
  image: "/images/og/home.jpg",
  label: "Home",
  title: `${person.name}'s Portfolio`,
  description: `Senior Full-Stack Engineer & AI Systems Architect. I build production GraphQL APIs, federated backends, and autonomous AI agent frameworks.`,
  headline: "Hey there, I'm Fabio Borges",
  featured: {
    display: false,
    title: <></>,
    href: "/work",
  },
  subline: "I design and build production-ready GraphQL APIs, federated backends, and autonomous AI agent frameworks.",
};

const about: About = {
  path: "/about",
  label: "About",
  title: `About – ${person.name}`,
  description: `Senior Full-Stack Engineer & AI Systems Architect from Joinville, Brazil.`,
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
        Senior Full-Stack Engineer & AI Systems Architect based in Joinville, Brazil.
        I design and build production-ready GraphQL APIs, federated backend services,
        and autonomous AI agent frameworks — with an emphasis on scalable architecture,
        clean TypeScript code, and operational reliability.
        <br />
        <br />
        Currently at BairesDev, engineering automated AI checkout systems with GraphQL
        Federation for major US telecom partners, processing 1,000+ daily transactions.
        After hours I build{" "}Agenthood — an open-source society of 14 specialized AI
        agents that enforce engineering standards on every commit.
      </>
    ),
  },
  work: {
    display: false,
    title: "Work Experience",
    experiences: [],
  },
  studies: {
    display: false,
    title: "Studies",
    institutions: [],
  },
  technical: {
    display: true,
    title: "Technical skills",
    skills: [
      {
        title: "Frontend",
        description: <>React · Next.js · TypeScript · Tailwind CSS · Once UI</>,
        tags: [
          { name: "TypeScript", icon: "typescript" },
          { name: "React", icon: "react" },
          { name: "Next.js", icon: "nextjs" },
        ],
        images: [],
      },
      {
        title: "Backend & APIs",
        description: <>GraphQL · Apollo Federation · Node.js · Django · PostgreSQL · MongoDB · AWS</>,
        tags: [
          { name: "GraphQL", icon: "graphql" },
          { name: "Python", icon: "python" },
        ],
        images: [],
      },
      {
        title: "AI & Agents",
        description: <>Agenthood · Claude AI · RAG · LanceDB · Chroma · Multi-agent orchestration · ReAct loops</>,
        tags: [],
        images: [],
      },
    ],
  },
};

const blog: Blog = {
  path: "/blog",
  label: "Posts",
  title: "Posts",
  description: `Thoughts on engineering, GraphQL, and agentic AI from ${person.name}`,
};

const work: Work = {
  path: "/work",
  label: "Work",
  title: "Work",
  description: `Production systems, AI experiments, and open-source tools by ${person.name}`,
};

const gallery: Gallery = {
  path: "/gallery",
  label: "Gallery",
  title: `Photo gallery – ${person.name}`,
  description: `A photo collection by ${person.name}`,
  images: [
    {
      src: "/images/gallery/horizontal-1.jpg",
      alt: "image",
      orientation: "horizontal",
    },
    {
      src: "/images/gallery/vertical-4.jpg",
      alt: "image",
      orientation: "vertical",
    },
    {
      src: "/images/gallery/horizontal-3.jpg",
      alt: "image",
      orientation: "horizontal",
    },
    {
      src: "/images/gallery/vertical-1.jpg",
      alt: "image",
      orientation: "vertical",
    },
    {
      src: "/images/gallery/vertical-2.jpg",
      alt: "image",
      orientation: "vertical",
    },
    {
      src: "/images/gallery/horizontal-2.jpg",
      alt: "image",
      orientation: "horizontal",
    },
    {
      src: "/images/gallery/horizontal-4.jpg",
      alt: "image",
      orientation: "horizontal",
    },
    {
      src: "/images/gallery/vertical-3.jpg",
      alt: "image",
      orientation: "vertical",
    },
  ],
};

export { person, social, newsletter, home, about, blog, work, gallery };
