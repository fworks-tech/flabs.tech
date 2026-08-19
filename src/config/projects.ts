/**
 * Content mapping from GitHub repo name to an optional MDX slug (without
 * extension) in src/content/projects/.
 *
 * This map only attaches rich content (images, detailed summary, team).
 * Featured-project membership and order are owned by the GitHub profile
 * README's "Featured Projects" table (see src/lib/github-repos.ts), so the
 * site and the profile can never drift.
 */
export const mdxSlugByRepo: Record<string, string> = {
  atlaslink: "atlaslink",
  "arxiv-manager": "arxiv-manager",
  "flabs.tech": "flabs-tech",
  agenthood: "agenthood",
  "agenthood-site": "agenthood-site",
  hasheyes: "hasheyes",
  logroute: "logroute",
};

/**
 * Fallback featured repo list, in display order, used when the profile
 * README cannot be fetched or parsed. Mirrors the profile's current
 * Featured Projects table so degradation stays truthful.
 */
export const defaultFeaturedRepos: string[] = [
  "atlaslink",
  "arxiv-manager",
  "flabs.tech",
  "agenthood",
  "agenthood-site",
  "hasheyes",
  "logroute",
];
