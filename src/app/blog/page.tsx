import { Button, Column, Heading, Row, Tag, Text, Meta, Schema } from "@once-ui-system/core";
import { Mailchimp } from "@/components";
import { Posts } from "@/components/blog/Posts";
import { baseURL, blog, person } from "@/resources";
import { getPosts } from "@/utils/utils";

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
  const allPosts = getPosts(["src", "app", "blog", "posts"]);
  const hasPosts = allPosts.length > 0;

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
            Posts
          </Heading>
          <Text
            variant="body-default-l"
            onBackground="neutral-weak"
            align="center"
            wrap="balance"
          >
            Thinking out loud about distributed systems, AI agents, and the messy
            reality of shipping production software.
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
      <Heading marginBottom="l" variant="heading-strong-xl" marginLeft="24">
        {blog.title}
      </Heading>
      <Column fillWidth flex={1} gap="40">
        <Posts range={[1, 1]} thumbnail />
        <Posts range={[2, 3]} columns="2" thumbnail direction="column" />
        <Mailchimp marginBottom="l" />
        <Heading as="h2" variant="heading-strong-xl" marginLeft="l">
          Earlier posts
        </Heading>
        <Posts range={[4]} columns="2" />
      </Column>
    </Column>
  );
}
