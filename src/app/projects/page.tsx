import { Stack, Text, Title } from "@mantine/core";
import { baseURL, sameAs } from "@/config";
import { about, person, projects } from "@/content";
import { ProjectsList } from "@/features/projects/ProjectsList";
import { generateMeta } from "@/lib/seo";
import { Schema } from "@/lib/schema";

export async function generateMetadata() {
  return generateMeta({
    title: projects.title,
    description: projects.description,
    baseURL,
    image: `/api/og/generate?title=${encodeURIComponent(projects.title)}`,
    path: projects.path,
  });
}

export default function ProjectsPage() {
  return (
    <Stack maw={1024} pt="24" mx="auto">
      <Schema
        as="webPage"
        baseURL={baseURL}
        sameAs={[sameAs.linkedin, sameAs.github].filter(Boolean)}
        path={projects.path}
        title={projects.title}
        description={projects.description}
        image={`/api/og/generate?title=${encodeURIComponent(projects.title)}`}
        author={{
          name: person.name,
          url: `${baseURL}${about.path}`,
          image: `${baseURL}${person.avatar}`,
        }}
      />
      <Stack align="center" gap="8" mb="xl">
        <Title order={1} ta="center">
          Projects
        </Title>
        <Text size="md" c="dimmed" ta="center">
          Open-source tools, AI experiments, and personal builds.
        </Text>
      </Stack>
      <ProjectsList />
    </Stack>
  );
}
