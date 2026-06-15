import { CustomMDX, ScrollToHash } from "@/components";
import { baseURL } from "@/config";
import { about, person, projects } from "@/content";
import { ProjectsList } from "@/features/projects/ProjectsList";
import { formatDate } from "@/lib/formatDate";
import { getPosts } from "@/lib/mdx";
import {
  AvatarGroup,
  Button,
  Column,
  Heading,
  Line,
  Media,
  Meta,
  Row,
  Schema,
  SmartLink,
  Text,
} from "@once-ui-system/core";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const posts = getPosts(["src", "content", "projects"]);
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string | string[] }>;
}): Promise<Metadata> {
  const routeParams = await params;
  const slugPath = Array.isArray(routeParams.slug)
    ? routeParams.slug.join("/")
    : routeParams.slug || "";
  const posts = getPosts(["src", "content", "projects"]);
  const post = posts.find((p) => p.slug === slugPath);
  if (!post) return {};
  return Meta.generate({
    title: post.metadata.title,
    description: post.metadata.summary,
    baseURL: baseURL,
    image: post.metadata.image || `/api/og/generate?title=${post.metadata.title}`,
    path: `${projects.path}/${post.slug}`,
  });
}

export default async function ProjectDetail({
  params,
}: {
  params: Promise<{ slug: string | string[] }>;
}) {
  const routeParams = await params;
  const slugPath = Array.isArray(routeParams.slug)
    ? routeParams.slug.join("/")
    : routeParams.slug || "";
  const post = getPosts(["src", "content", "projects"]).find((p) => p.slug === slugPath);

  if (!post) notFound();

  const avatars = post.metadata.team?.map((person) => ({ src: person.avatar })) || [];

  return (
    <Column as="section" maxWidth="m" horizontal="center" gap="l">
      <Schema
        as="blogPosting"
        baseURL={baseURL}
        path={`${projects.path}/${post.slug}`}
        title={post.metadata.title}
        description={post.metadata.summary}
        datePublished={post.metadata.publishedAt}
        dateModified={post.metadata.publishedAt}
        image={
          post.metadata.image || `/api/og/generate?title=${encodeURIComponent(post.metadata.title)}`
        }
        author={{
          name: person.name,
          url: `${baseURL}${about.path}`,
          image: `${baseURL}${person.avatar}`,
        }}
      />
      <Column maxWidth="s" gap="16" horizontal="center" align="center">
        <SmartLink href="/projects">
          <Text variant="label-strong-m">Projects</Text>
        </SmartLink>
        <Text variant="body-default-xs" onBackground="neutral-weak" marginBottom="12">
          {post.metadata.publishedAt && formatDate(post.metadata.publishedAt)}
        </Text>
        <Heading variant="display-strong-m">{post.metadata.title}</Heading>
      </Column>
      {avatars.length > 0 && (
        <Row marginBottom="32" horizontal="center">
          <AvatarGroup reverse avatars={avatars} size="s" />
        </Row>
      )}
      {post.metadata.images.length > 0 && (
        <Media priority aspectRatio="16 / 9" radius="m" alt="image" src={post.metadata.images[0]} />
      )}
      <Column style={{ margin: "auto" }} as="article" maxWidth="xs">
        <CustomMDX source={post.content} />
      </Column>
      {post.metadata.link && (
        <Row horizontal="center">
          <Button href={post.metadata.link} variant="secondary" prefixIcon="github" size="m">
            View on GitHub
          </Button>
        </Row>
      )}
      <Column fillWidth gap="40" horizontal="center" marginTop="40">
        <Line maxWidth="40" />
        <Heading as="h2" variant="heading-strong-xl" marginBottom="24">
          More Projects
        </Heading>
        <ProjectsList exclude={[post.slug]} range={[1, 3]} />
      </Column>
      <ScrollToHash />
    </Column>
  );
}
