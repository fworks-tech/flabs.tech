import { Badge, Button, Group, Stack, Text, Title } from "@mantine/core";
import { baseURL, sameAs } from "@/config";
import { blog, person } from "@/content";
import ClientMailchimp from "@/components/ui/ClientMailchimp";
import { Posts } from "@/features/blog/Posts";
import { isAuthenticated } from "@/lib/auth";
import { filterPosts } from "@/lib/draft";
import { getPosts } from "@/lib/mdx";
import { generateMeta } from "@/lib/seo";
import { Schema } from "@/lib/schema";

export async function generateMetadata() {
  return generateMeta({
    title: blog.title,
    description: blog.description,
    baseURL,
    image: `/api/og/generate?title=${encodeURIComponent(blog.title)}`,
    path: blog.path,
  });
}

export default async function Blog() {
  const auth = await isAuthenticated();
  const allPosts = getPosts(["src", "content", "blog"]);
  const visiblePosts = filterPosts(allPosts, auth);
  const hasPosts = visiblePosts.length > 0;
  const hasEarlierPosts = visiblePosts.length > 3;

  const schema = (
    <Schema
      as="blogPosting"
      baseURL={baseURL}
      sameAs={[sameAs.linkedin, sameAs.github].filter((v): v is string => Boolean(v))}
      title={blog.title}
      description={blog.description}
      path={blog.path}
      image={`/api/og/generate?title=${encodeURIComponent(blog.title)}`}
      author={{
        name: person.name,
        url: `${baseURL}/blog`,
        image: `${baseURL}${person.avatar}`,
      }}
    />
  );

  if (!hasPosts) {
    return (
      <Stack maw={1024} pt="24" align="center" gap="xl" mx="auto">
        {schema}
        <Stack align="center" gap="m">
          <Title order={1} ta="center">
            Blog
          </Title>
          <Text size="md" c="dimmed" ta="center">
            Real-world notes on software engineering — architecture, frontend, backend, AI, DevOps,
            and everything in between.
          </Text>
        </Stack>
        <Group gap="12" wrap="wrap" justify="center">
          {[
            "GraphQL Federation",
            "Multi-Agent AI",
            "Next.js Performance",
            "Open Source",
            "Claude SDK",
          ].map((topic) => (
            <Badge key={topic} size="lg">
              {topic}
            </Badge>
          ))}
        </Group>
        <Group gap="16" wrap="wrap" justify="center">
          <Button component="a" href="https://github.com/fworks-tech" variant="light" size="md">
            Follow on GitHub
          </Button>
        </Group>
      </Stack>
    );
  }

  return (
    <Stack maw={1024} pt="24" mx="auto">
      {schema}
      <Stack align="center" gap="8" mb="xl">
        <Title order={1} ta="center">
          Blog
        </Title>
        <Text size="md" c="dimmed" ta="center">
          Real-world notes on software engineering — architecture, frontend, backend, AI, DevOps,
          and everything in between.
        </Text>
      </Stack>
      <Stack gap="40">
        <Posts range={[1, 3]} />
        {hasEarlierPosts && (
          <>
            <Title order={2}>Earlier posts</Title>
            <Posts range={[4]} />
          </>
        )}
        <ClientMailchimp marginBottom="lg" padding="md" />
      </Stack>
    </Stack>
  );
}
