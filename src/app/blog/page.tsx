import { baseURL } from "@/config";
import { blog, person } from "@/content";
import ClientMailchimp from "@/components/ui/ClientMailchimp";
import { Posts } from "@/features/blog/Posts";
import { getPosts } from "@/lib/mdx";
import { Button, Column, Heading, Meta, Row, Schema, Tag, Text } from "@once-ui-system/core";

export async function generateMetadata() {
  return Meta.generate({
    title: blog.title,
    description: blog.description,
    baseURL: baseURL,
    image: `/api/og/generate?title=${encodeURIComponent(blog.title)}`,
    path: blog.path,
  });
}

export default function Blog() {
  const allPosts = getPosts(["src", "content", "blog"]);
  const hasPosts = allPosts.length > 0;
  const hasEarlierPosts = allPosts.length > 3;

  const schema = (
    <Schema
      as="blogPosting"
      baseURL={baseURL}
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
      <Column maxWidth="m" paddingTop="24" horizontal="center" align="center" gap="xl">
        {schema}
        <Column fillWidth horizontal="center" align="center" gap="m">
          <Heading variant="display-strong-l" align="center">
            Blog
          </Heading>
          <Text variant="body-default-l" onBackground="neutral-weak" align="center" wrap="balance">
            Real-world notes on software engineering — architecture, frontend, backend, AI, DevOps,
            and everything in between.
          </Text>
        </Column>
        <Row gap="12" wrap horizontal="center">
          {[
            "GraphQL Federation",
            "Multi-Agent AI",
            "Next.js Performance",
            "Open Source",
            "Claude SDK",
          ].map((topic) => (
            <Tag key={topic} size="l">
              {topic}
            </Tag>
          ))}
        </Row>
        <Row gap="16" wrap horizontal="center">
          <Button
            href="https://github.com/fworks-tech"
            variant="secondary"
            size="m"
            prefixIcon="github"
          >
            Follow on GitHub
          </Button>
        </Row>
      </Column>
    );
  }

  return (
    <Column maxWidth="m" paddingTop="24">
      {schema}
      <Column fillWidth horizontal="center" align="center" gap="8" marginBottom="xl">
        <Heading variant="display-strong-l" align="center">
          Blog
        </Heading>
        <Text variant="body-default-l" onBackground="neutral-weak" align="center" wrap="balance">
          Real-world notes on software engineering — architecture, frontend, backend, AI, DevOps,
          and everything in between.
        </Text>
      </Column>
      <Column fillWidth flex={1} gap="40">
        <Posts range={[1, 3]} thumbnail />
        {hasEarlierPosts && (
          <>
            <Heading as="h2" variant="heading-strong-xl">
              Earlier posts
            </Heading>
            <Posts range={[4]} />
          </>
        )}
        <ClientMailchimp marginBottom="l" padding="m" />
      </Column>
    </Column>
  );
}
