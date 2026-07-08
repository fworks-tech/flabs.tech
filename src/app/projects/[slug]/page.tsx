import { Avatar, AvatarGroup, Button, Divider, Group, Image, Stack, Text, Title } from "@mantine/core";
import { NavLink } from "@/components/ui/NavLink";
import { CustomMDX, ScrollToHash } from "@/components";
import { JsonLd } from "@/components/layout/JsonLd";
import { baseURL, sameAs } from "@/config";
import { about, person, projects } from "@/content";
import { ProjectsList } from "@/features/projects/ProjectsList";
import { formatDate } from "@/lib/formatDate";
import { logger } from "@/lib/logger";
import { getPosts } from "@/lib/mdx";
import { generateMeta } from "@/lib/seo";
import { Schema } from "@/lib/schema";
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

  const meta = generateMeta({
    title: post.metadata.title,
    description: post.metadata.summary,
    baseURL,
    image: post.metadata.image || `/api/og/generate?title=${post.metadata.title}`,
    path: `${projects.path}/${post.slug}`,
  });

  return {
    ...meta,
    alternates: {
      canonical: `${baseURL}${projects.path}/${post.slug}`,
    },
    openGraph: {
      ...(meta.openGraph || {}),
      type: "article",
      publishedTime: post.metadata.publishedAt,
      ...(post.metadata.image && {
        images: [{ url: post.metadata.image, width: 1200, height: 630 }],
      }),
    },
  };
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

  if (!post) {
    logger.warn({ slug: slugPath }, "project post not found");
    notFound();
  }

  const avatars = post.metadata.team?.map((person) => ({ src: person.avatar })) || [];

  return (
    <Stack component="section" maw={1024} align="center" gap="lg" mx="auto">
      <Schema
        as="blogPosting"
        baseURL={baseURL}
        sameAs={[sameAs.linkedin, sameAs.github].filter((v): v is string => !!v)}
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
      <Stack maw={600} gap="16" align="center">
        <NavLink href="/projects" size="sm">
          Projects
        </NavLink>
        <Text size="xs" c="dimmed" mb="12">
          {post.metadata.publishedAt && formatDate(post.metadata.publishedAt)}
        </Text>
        <Title order={1}>{post.metadata.title}</Title>
      </Stack>
      {avatars.length > 0 && (
        <Group mb="32" justify="center">
          <AvatarGroup spacing="sm">
            {avatars.map((avatar: { src: string }, idx: number) => (
              <Avatar key={idx} src={avatar.src} size="sm" />
            ))}
          </AvatarGroup>
        </Group>
      )}
      {post.metadata.images.length > 0 && (
        <Image
          src={post.metadata.images[0]}
          alt="Project screenshot"
          radius="md"
          style={{ aspectRatio: "16 / 9", objectFit: "cover" }}
        />
      )}
      <Stack component="article" maw={600} mx="auto">
        <CustomMDX source={post.content} />
      </Stack>
      {post.metadata.link && (
        <Group justify="center">
          <Button component="a" href={post.metadata.link} variant="light" size="md">
            View on GitHub
          </Button>
        </Group>
      )}
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Projects", item: `${baseURL}/projects` },
          { "@type": "ListItem", position: 2, name: post.metadata.title, item: `${baseURL}${projects.path}/${post.slug}` },
        ],
      }} />
      <Stack gap="40" align="center" mt="40">
        <Divider maw={640} />
        <Title order={2} mb="24">
          More Projects
        </Title>
        <ProjectsList exclude={[post.slug]} range={[1, 3]} />
      </Stack>
      <ScrollToHash />
    </Stack>
  );
}
