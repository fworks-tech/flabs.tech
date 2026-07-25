export type Team = {
  name: string;
  role: string;
  avatar: string;
  linkedIn: string;
};

/** A project displayed on the projects page. */
export type ProjectData = {
  slug: string;
  title: string;
  summary: string;
  link: string;
  tag?: string;
  tags?: string[];
  images: string[];
  content: string;
  publishedAt: string;
  team: Team[];
  githubUrl: string;
  homepage?: string;
  language?: string;
  updatedAt: string;
};
