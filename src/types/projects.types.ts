export type Team = {
  name: string;
  role: string;
  avatar: string;
  linkedIn: string;
};

/** A project displayed on the projects page. */
export type ProjectData = {
  /** GitHub repo name — stable identifier used for keys and exclusions. */
  slug: string;
  /**
   * Slug of the case-study detail page (`/projects/<detailSlug>`). Defaults to
   * the repo name, but points at the MDX slug when one is merged, so the card
   * link always resolves even when a repo name and its MDX file differ
   * (e.g. repo `flabs.tech` → MDX `flabs-tech`).
   */
  detailSlug: string;
  title: string;
  summary: string;
  link: string;
  /** When true the card renders no links and a "Coming soon" badge. */
  comingSoon?: boolean;
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
