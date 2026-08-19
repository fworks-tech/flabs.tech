import { baseURL, routes as routesConfig } from "@/config";
import { filterPosts } from "@/lib/draft";
import { fetchFeaturedRepos } from "@/lib/github-repos";
import { getPosts } from "@/lib/mdx";

export default async function sitemap() {
  const blogs = filterPosts(getPosts(["src", "content", "blog"]), false).map((post) => ({
    url: `${baseURL}/blog/${post.slug}`,
    lastModified: post.metadata.publishedAt,
  }));

  // Only featured projects get detail pages and appear in the sitemap.
  const featured = await fetchFeaturedRepos();
  const featuredSlugs = new Set(featured.map((p) => p.detailSlug));
  const projects = filterPosts(getPosts(["src", "content", "projects"]), false)
    .filter((post) => featuredSlugs.has(post.slug))
    .map((post) => ({
      url: `${baseURL}/projects/${post.slug}`,
      lastModified: post.metadata.publishedAt,
    }));

  const workItems = filterPosts(getPosts(["src", "content", "work"]), false).map((post) => ({
    url: `${baseURL}/work/${post.slug}`,
    lastModified: post.metadata.publishedAt,
  }));

  const activeRoutes = Object.keys(routesConfig).filter(
    (route) => routesConfig[route as keyof typeof routesConfig],
  );

  const routes = activeRoutes.map((route) => ({
    url: `${baseURL}${route !== "/" ? route : ""}`,
    lastModified: new Date().toISOString().split("T")[0],
  }));

  return [...routes, ...blogs, ...projects, ...workItems];
}
