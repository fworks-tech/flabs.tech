import { ProjectCard } from "@/components";
import { getPosts } from "@/lib/mdx";
import { Column } from "@once-ui-system/core";

interface ProjectsListProps {
  range?: [number, number?];
  exclude?: string[];
}

export function ProjectsList({ range, exclude }: ProjectsListProps) {
  let allProjects = getPosts(["src", "content", "projects"]);

  if (exclude?.length) {
    allProjects = allProjects.filter((p) => !exclude.includes(p.slug));
  }

  const sorted = allProjects.sort(
    (a, b) =>
      new Date(b.metadata.publishedAt).getTime() - new Date(a.metadata.publishedAt).getTime(),
  );

  const displayed = range ? sorted.slice(range[0] - 1, range[1] ?? sorted.length) : sorted;

  return (
    <Column fillWidth gap="xl" marginBottom="40" paddingX="l">
      {displayed.map((post, index) => (
        <ProjectCard
          priority={index < 2}
          key={post.slug}
          href={`/projects/${post.slug}`}
          images={post.metadata.images}
          title={post.metadata.title}
          description={post.metadata.summary}
          content={post.content}
          avatars={post.metadata.team?.map((member) => ({ src: member.avatar, "aria-label": `Photo of ${member.name}` })) || []}
          link={post.metadata.link || ""}
          tag={post.metadata.tag || ""}
          tags={post.metadata.tags}
        />
      ))}
    </Column>
  );
}
