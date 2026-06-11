import {
  Heading,
  Text,
  Button,
  Column,
  Row,
  Schema,
  Meta,
  SmartLink,
} from "@once-ui-system/core";
import { home, about, person, baseURL, routes } from "@/resources";
import { getPosts } from "@/utils/utils";
import { ProjectGrid } from "@/components/work/ProjectGrid";
import { Posts } from "@/components/blog/Posts";

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
  const hasBlogPosts = getPosts(["src", "app", "blog", "posts"]).length > 0;

  return (
    <Column maxWidth="m" gap="xl" paddingY="12">
      <Schema
        as="webPage"
        baseURL={baseURL}
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
      <Row
        fillWidth
        gap="xl"
        vertical="center"
        paddingY="64"
        s={{ direction: "column", gap: "l" }}
      >
        <Column flex={5} gap="l">
          <Text variant="label-default-m" onBackground="neutral-weak">
            Senior Full-Stack Engineer · Joinville, Brazil
          </Text>
          <Heading variant="display-strong-xl">
            {home.headline}
          </Heading>
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
