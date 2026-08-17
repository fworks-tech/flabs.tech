export type FeaturedRepo = {
  owner: string;
  name: string;
  /** Optional MDX slug to merge rich content from (maps to src/content/projects/<slug>.mdx) */
  mdxSlug?: string;
};

/**
 * Featured GitHub repos displayed on the /projects page.
 *
 * To add a new project: append an entry here. If you have rich MDX content
 * (images, detailed description, team info), set `mdxSlug` to the filename
 * (without .mdx) in src/content/projects/.
 *
 * To remove a project: delete the entry. The site will stop showing it on
 * the next build or ISR revalidation.
 */
export const featuredRepos: FeaturedRepo[] = [
  { owner: "fworks-tech", name: "arxiv-manager", mdxSlug: "arxiv-manager" },
  { owner: "fworks-tech", name: "flabs.tech", mdxSlug: "flabs-tech" },
  { owner: "fworks-tech", name: "agenthood", mdxSlug: "agenthood" },
  { owner: "fworks-tech", name: "agenthood-site", mdxSlug: "agenthood-site" },
  { owner: "fworks-tech", name: "hasheyes", mdxSlug: "hasheyes" },
  { owner: "fworks-tech", name: "logroute", mdxSlug: "logroute" },
];
