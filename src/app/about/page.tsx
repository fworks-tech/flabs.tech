import { Anchor, Avatar, Badge, Button, Group, Stack, Text, Title } from "@mantine/core";
import { IconGlobe, IconFileCv } from "@tabler/icons-react";
import { baseURL, sameAs } from "@/config";
import { about, person, social } from "@/content";
import { generateMeta } from "@/lib/seo";
import { Schema } from "@/lib/schema";
import type { ReactNode } from "react";

export async function generateMetadata() {
  return generateMeta({
    title: about.title,
    description: about.description,
    baseURL,
    image: `/api/og/generate?title=${encodeURIComponent(about.title)}`,
    path: about.path,
  });
}

const iconMap: Record<string, ReactNode> = {
  github: <IconGlobe size={16} />,
  linkedin: <IconGlobe size={16} />,
  email: <IconGlobe size={16} />,
};

export default function About() {
  return (
    <Stack maw={1024} pt="40" align="center" gap="xl" mx="auto">
      <Schema
        as="webPage"
        baseURL={baseURL}
        sameAs={[sameAs.linkedin, sameAs.github].filter((v): v is string => Boolean(v))}
        title={about.title}
        description={about.description}
        path={about.path}
        image={`/api/og/generate?title=${encodeURIComponent(about.title)}`}
        author={{
          name: person.name,
          url: `${baseURL}${about.path}`,
          image: `${baseURL}${person.avatar}`,
        }}
      />

      <Stack align="center" gap="md">
        {about.avatar.display && <Avatar src={person.avatar} size="xl" alt={`Photo of ${person.name}`} />}
        <Stack align="center" gap="4">
          <Title order={1} ta="center">
            {person.name}
          </Title>
          <Text size="lg" c="dimmed" ta="center">
            {person.role}
          </Text>
          <Group gap="8" align="center" pt="4">
            <IconGlobe size={16} />
            <Text size="sm" c="dimmed">
              Joinville, Brazil
            </Text>
            {person.languages && person.languages.length > 0 && (
              <>
                <Text size="sm" c="dimmed">·</Text>
                {person.languages.map((lang, i) => (
                  <Badge key={i} size="sm">{lang}</Badge>
                ))}
              </>
            )}
          </Group>
        </Stack>

        {social.length > 0 && (
          <Group gap="8" wrap="wrap" justify="center" pt="8">
            {social
              .filter((item) => item.essential)
              .map(
                (item) =>
                  item.link && (
                    <Button
                      key={item.name}
                      component="a"
                      href={item.link}
                      variant="light"
                      size="sm"
                    >
                      {item.name}
                    </Button>
                  ),
              )}
            {person.resume && (
              <Button
                component="a"
                href={person.resume}
                variant="light"
                size="sm"
              >
                Download CV
              </Button>
            )}
            <Button
              component="a"
              href="https://github.com/sponsors/fworks-tech"
              target="_blank"
              rel="noopener noreferrer"
              variant="filled"
              size="sm"
            >
              Sponsor Me
            </Button>
          </Group>
        )}
      </Stack>

      {about.intro.display && (
        <Stack gap="md" maw={600} align="center">
          {about.intro.description as ReactNode}
        </Stack>
      )}

      {about.technical.display && (
        <Stack gap="lg" maw={600}>
          <Title order={2}>{about.technical.title}</Title>
          {about.technical.skills.map((skill, index) => (
            <Stack key={`${skill.title}-${index}`} gap="4">
              <Title order={3}>{skill.title}</Title>
              <Text size="md" c="dimmed">
                {skill.description}
              </Text>
              {skill.tags && skill.tags.length > 0 && (
                <Group gap="8" pt="8" wrap="wrap">
                  {skill.tags.map((tag: { name: string; icon?: string }, tagIndex: number) => (
                    <Badge key={`${skill.title}-${tagIndex}`} size="lg">
                      {tag.name}
                    </Badge>
                  ))}
                </Group>
              )}
            </Stack>
          ))}
        </Stack>
      )}
    </Stack>
  );
}
