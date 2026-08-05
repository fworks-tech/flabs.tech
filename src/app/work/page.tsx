import { Badge, Divider, Group, Stack, Text, Title } from "@mantine/core";
import { baseURL, sameAs } from "@/config";
import { about, person, work, workExperience } from "@/content";
import { generateMeta } from "@/lib/seo";
import { Schema } from "@/lib/schema";

export async function generateMetadata() {
  return generateMeta({
    title: work.title,
    description: work.description,
    baseURL,
    image: `/api/og/generate?title=${encodeURIComponent(work.title)}`,
    path: work.path,
  });
}

export default function WorkPage() {
  return (
    <Stack maw={1024} pt="24" pb="xl" mx="auto">
      <Schema
        as="webPage"
        baseURL={baseURL}
        sameAs={[sameAs.linkedin, sameAs.github].filter((v): v is string => Boolean(v))}
        path={work.path}
        title={work.title}
        description={work.description}
        image={`/api/og/generate?title=${encodeURIComponent(work.title)}`}
        author={{
          name: person.name,
          url: `${baseURL}${about.path}`,
          image: `${baseURL}${person.avatar}`,
        }}
      />

      <Stack align="center" gap="8" mb="xl">
        <Title order={1} ta="center">
          Work Experience
        </Title>
        <Text size="md" c="dimmed" ta="center">
          {work.description}
        </Text>
      </Stack>

      <Stack gap="xl" maw={600} mx="auto">
        {workExperience.experiences.map((exp, i) => (
          <Stack key={i} gap="md">
            <Group justify="space-between" align="flex-start" wrap="wrap" gap="8">
              <Stack gap="4">
                <Title order={2}>{exp.company}</Title>
                <Text size="md" c="dimmed">
                  {exp.role}
                </Text>
                <Text size="sm" c="dimmed">
                  {exp.location}
                </Text>
              </Stack>
              <Badge size="md">{exp.timeframe}</Badge>
              {exp.type && (
                <Badge size="md" variant="light">
                  {exp.type}
                </Badge>
              )}
            </Group>
            <Stack component="ul" gap="8" pl="md">
              {exp.achievements.map((item, j) => (
                <Group key={j} component="li" gap="8" align="flex-start" wrap="nowrap">
                  <Text span c="dimmed" style={{ flexShrink: 0, marginTop: "2px" }}>
                    –
                  </Text>
                  <Text size="md" c="dimmed">
                    {item}
                  </Text>
                </Group>
              ))}
            </Stack>
            {exp.tags && exp.tags.length > 0 && (
              <Group gap="8">
                {exp.tags.map((tag) => (
                  <Badge key={tag} size="sm" variant="light">
                    {tag}
                  </Badge>
                ))}
              </Group>
            )}
            {i < workExperience.experiences.length - 1 && <Divider />}
          </Stack>
        ))}
      </Stack>

      <Stack gap="lg" maw={600} mx="auto" mt="xl">
        <Title order={2}>Education</Title>
        {workExperience.education.map((edu, i) => (
          <Group key={i} justify="space-between" align="flex-start" wrap="wrap" gap="8" pb="md">
            <Stack gap="4">
              <Title order={3}>{edu.institution}</Title>
              <Text size="md" c="dimmed">
                {edu.degree}
              </Text>
            </Stack>
            <Badge size="sm">{edu.timeframe}</Badge>
          </Group>
        ))}
      </Stack>
    </Stack>
  );
}
