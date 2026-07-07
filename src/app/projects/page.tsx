import { baseURL, sameAs } from "@/config";
import { about, person, projects } from "@/content";
import { ProjectsList } from "@/features/projects/ProjectsList";
import { Column, Heading, Meta, Schema, Text } from "@once-ui-system/core";

export async function generateMetadata() {
  const meta = Meta.generate({
    title: projects.title,
    description: projects.description,
    baseURL: baseURL,
    image: `/api/og/generate?title=${encodeURIComponent(projects.title)}`,
    path: projects.path,
  });

  return {
    ...meta,
    alternates: {
      canonical: `${baseURL}${projects.path}`,
    },
  };
}

export default function ProjectsPage() {
  return (
    <Column maxWidth="m" paddingTop="24">
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
      <Column fillWidth horizontal="center" align="center" gap="8" marginBottom="xl">
        <Heading variant="display-strong-l" align="center">
          Projects
        </Heading>
        <Text variant="body-default-l" onBackground="neutral-weak" align="center">
          Open-source tools, AI experiments, and personal builds.
        </Text>
      </Column>
      <ProjectsList />
    </Column>
  );
}
