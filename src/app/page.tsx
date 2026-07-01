import { baseURL, routes, sameAs } from "@/config";
import { about, home, person } from "@/content";
import { Posts } from "@/features/blog/Posts";
import { ProjectGrid } from "@/features/work/ProjectGrid";
import { getPosts } from "@/lib/mdx";
import { Button, Column, Heading, Meta, Row, Schema, SmartLink, Text } from "@once-ui-system/core";

export async function generateMetadata() {
  return Meta.generate({
    title: home.title,
    description: home.description,
    baseURL: baseURL,
    path: home.path,
    image: home.image,
  });
}

export default function Home() {
  const hasBlogPosts = getPosts(["src", "content", "blog"]).length > 0;

  return (
    <Column maxWidth="m" gap="xl" paddingY="12">
      <Schema
        as="webPage"
        baseURL={baseURL}
        sameAs={[sameAs.linkedin, sameAs.github].filter(Boolean)}
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

      {/* Hero: split layout — text left, avatar right */}
      <Row fillWidth gap="xl" vertical="center" paddingY="64" s={{ direction: "column" }}>
        <Column flex={5} gap="l">
          <Text variant="label-default-m" onBackground="neutral-weak">
            Senior Full-Stack Engineer · Joinville, Brazil
          </Text>
          <Heading variant="display-strong-xl">{home.headline}</Heading>
          <Text variant="body-default-l" onBackground="neutral-weak">
            {home.subline}
          </Text>
          <Row gap="12" wrap>
            <Button href="/projects" variant="primary" size="m" arrowIcon>
              View Projects
            </Button>
            <Button href={about.path} variant="secondary" size="m">
              About Me
            </Button>
          </Row>
        </Column>
      </Row>

      {/* Recent Work */}
      <Column fillWidth gap="m">
        <Row fillWidth horizontal="between" vertical="center" paddingBottom="4">
          <Heading as="h2" variant="heading-strong-xl">
            Recent Projects
          </Heading>
          <SmartLink href="/projects" suffixIcon="arrowRight">
            <Text variant="body-default-s" onBackground="neutral-weak">
              View all
            </Text>
          </SmartLink>
        </Row>
        <ProjectGrid range={[1, 3]} />
      </Column>

      {/* Recent Posts */}
      {routes["/blog"] && hasBlogPosts && (
        <Column fillWidth gap="m">
          <Row fillWidth horizontal="between" vertical="center" paddingBottom="4">
            <Heading as="h2" variant="heading-strong-xl">
              Recent Posts
            </Heading>
            <SmartLink href="/blog" suffixIcon="arrowRight">
              <Text variant="body-default-s" onBackground="neutral-weak">
                View all
              </Text>
            </SmartLink>
          </Row>
          <Posts range={[1, 2]} columns="2" thumbnail />
        </Column>
      )}
    </Column>
  );
}
