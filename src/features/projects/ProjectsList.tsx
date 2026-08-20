import { Stack } from "@mantine/core";
import { ProjectCard } from "@/components";
import { fetchFeaturedRepos } from "@/lib/github-repos";

interface ProjectsListProps {
  range?: [number, number?];
  exclude?: string[];
}

export async function ProjectsList({ range, exclude }: ProjectsListProps) {
  let allProjects = await fetchFeaturedRepos();

  if (exclude?.length) {
    allProjects = allProjects.filter((p) => !exclude.includes(p.detailSlug));
  }

  // Order is canonical (profile README featured table order) — do not re-sort.
  const displayed = range
    ? allProjects.slice(range[0] - 1, range[1] ?? allProjects.length)
    : allProjects;

  return (
    <Stack gap="xl" mb="40" px="lg">
      {displayed.map((project, index) => (
        <ProjectCard
          priority={index < 2}
          key={project.slug}
          href={`/projects/${project.detailSlug}`}
          images={project.images}
          title={project.title}
          description={project.summary}
          content={project.content}
          avatars={
            project.team?.map((member) => ({
              src: member.avatar,
              "aria-label": `Photo of ${member.name}`,
            })) || []
          }
          link={project.link}
          comingSoon={project.comingSoon}
          tag={project.tag}
          tags={project.tags}
        />
      ))}
    </Stack>
  );
}
