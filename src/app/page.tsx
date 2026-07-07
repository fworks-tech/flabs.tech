import { Anchor, Group, Stack, Text, Title } from "@mantine/core";
import Link from "next/link";
import { baseURL, routes, sameAs } from "@/config";
import { about, home, person } from "@/content";
import { Posts } from "@/features/blog/Posts";
import { ProjectGrid } from "@/features/work/ProjectGrid";
import { TrackedButton } from "@/components/ui/TrackedButton";
import { getPosts } from "@/lib/mdx";
import { generateMeta } from "@/lib/seo";
import { Schema } from "@/lib/schema";

export async function generateMetadata() {
  return generateMeta({
    title: home.title,
    description: home.description,
    baseURL,
    path: home.path,
    image: home.image,
  });
}

export default function Home() {
  const hasBlogPosts = getPosts(["src", "content", "blog"]).length > 0;

  return (
    <Stack maw={1024} gap="xl" py="12" mx="auto">
      <Schema
        as="webPage"
        baseURL={baseURL}
        sameAs={[sameAs.linkedin, sameAs.github].filter((v): v is string => Boolean(v))}
        path={home.path}
        title={home.title}
        description={home.description}
        image={`/api/og/generate?title=${encodeURIComponent(home.title)}`}
        author={{
          name: person.name,
          url: `${baseURL}${about.path}`,
          image: `${baseURL}${person.avatar}`,
        }}
      />

      <Group gap="xl" align="center" py="64">
        <Stack style={{ flex: 5 }} gap="lg">
          <Text size="sm" c="dimmed">
            Senior Full-Stack Engineer · Joinville, Brazil
          </Text>
          <Title order={1}>{home.headline}</Title>
          <Text size="lg" c="dimmed">
            {home.subline}
          </Text>
          <Group gap="12" wrap="wrap">
            <TrackedButton href="/projects" variant="primary" size="m" eventName="cta_click" eventLabel="View Projects">
              View Projects
            </TrackedButton>
            <TrackedButton href={about.path} variant="secondary" size="m" eventName="cta_click" eventLabel="About Me">
              About Me
            </TrackedButton>
          </Group>
        </Stack>
      </Group>

      <Stack gap="md">
        <Group justify="space-between" align="center" pb="4">
          <Title order={2}>Recent Projects</Title>
          <Anchor component={Link} href="/projects" size="sm">
            View all
          </Anchor>
        </Group>
        <ProjectGrid range={[1, 3]} />
      </Stack>

      {routes["/blog"] && hasBlogPosts && (
        <Stack gap="md">
          <Group justify="space-between" align="center" pb="4">
            <Title order={2}>Recent Posts</Title>
            <Anchor component={Link} href="/blog" size="sm">
              View all
            </Anchor>
          </Group>
          <Posts range={[1, 2]} columns="2" thumbnail />
        </Stack>
      )}
    </Stack>
  );
}
