import { About, Blog, Gallery, Home, Newsletter, Person, Social, Work } from "@/types";
import { Text } from "@once-ui-system/core";

const person: Person = {
  firstName: "Fabio",
  lastName: "Ritzel Borges",
  name: "Fabio Ritzel Borges",
  role: "Software Engineer",
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
  description: `This is my place in the internet to showcase my projects, thoughts, few updates about this fast growing tech world we live in, and share a bit about myself.`,
  headline: <>Welcome to FLABS</>,
  featured: {
    display: false,
    title: <></>,
    href: "/work",
  },
  subline: (
    <>
      Senior full-stack engineer based in Joinville, Brazil.{" "}
      <Text as="span" size="xl" weight="strong">GraphQL · React · Next.js · GenAI</Text>
      <br />
      I build production-ready platforms and tinker with AI agents after hours.
    </>
  ),
};

const about: About = {
  path: "/about",
  label: "About",
  title: `About – ${person.name}`,
  description: `Meet ${person.name}, ${person.role} from ${person.location}`,
  tableOfContent: {
    display: true,
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
        Senior full-stack engineer based in Joinville, Brazil. I build production-ready web
        platforms, federated GraphQL APIs, and GenAI/RAG tools with an emphasis on clean
        architecture, performance, and accessibility. After hours I tinker with AI agents and
        hobby projects.
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
        title: "Backend & Data",
        description: <>Node.js · GraphQL · Python · Django · PostgreSQL · MongoDB</>,
        tags: [
          { name: "GraphQL", icon: "graphql" },
          { name: "Python", icon: "python" },
        ],
        images: [],
      },
      {
        title: "AI & Agents",
        description: <>Claude AI · RAG · Chroma · multi-agent frameworks</>,
        tags: [],
        images: [],
      },
    ],
  },
};

const blog: Blog = {
  path: "/blog",
  label: "Blog",
  title: "Writing about engineering, AI, and building things",
  description: `Thoughts and experiments from ${person.name}`,
};

const work: Work = {
  path: "/work",
  label: "Work",
  title: `Projects – ${person.name}`,
  description: `Engineering and AI projects by ${person.name}`,
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
