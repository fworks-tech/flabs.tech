import { Anchor, Avatar, AvatarGroup, Divider, Group, Stack, Text, Title } from "@mantine/core";
import Image from "next/image";
import { NavLink } from "@/components/ui/NavLink";
import { CustomMDX, ScrollToHash } from "@/components";
import { JsonLd } from "@/components/layout/JsonLd";
import { baseURL, sameAs } from "@/config";
import { about, person, work } from "@/content";
import { Projects } from "@/features/work/Projects";
import { formatDate } from "@/lib/formatDate";
import { logger } from "@/lib/logger";
import { getPosts } from "@/lib/mdx";
import { generateMeta } from "@/lib/seo";
import { Schema } from "@/lib/schema";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const posts = getPosts(["src", "content", "work"]);
  return posts.map((post) => ({
    slug: post.slug,
  }));
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

  const posts = getPosts(["src", "content", "work"]);
  const post = posts.find((post) => post.slug === slugPath);

  if (!post) return {};

  const meta = generateMeta({
    title: post.metadata.title,
    description: post.metadata.summary,
    baseURL,
    image: post.metadata.image || `/api/og/generate?title=${post.metadata.title}`,
    path: `${work.path}/${post.slug}`,
  });

  return {
    ...meta,
    alternates: {
      canonical: `${baseURL}${work.path}/${post.slug}`,
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

export default async function Project({
  params,
}: {
  params: Promise<{ slug: string | string[] }>;
}) {
  const routeParams = await params;
  const slugPath = Array.isArray(routeParams.slug)
    ? routeParams.slug.join("/")
    : routeParams.slug || "";

  const post = getPosts(["src", "content", "work"]).find((post) => post.slug === slugPath);

  if (!post) {
    logger.warn({ slug: slugPath }, "work post not found");
    notFound();
  }

  const avatars =
    post.metadata.team?.map((person) => ({
      src: person.avatar,
    })) || [];

  return (
    <Stack component="section" maw={1024} align="center" gap="lg" mx="auto">
      <Schema
        as="blogPosting"
        baseURL={baseURL}
        sameAs={[sameAs.linkedin, sameAs.github].filter((v): v is string => !!v)}
        path={`${work.path}/${post.slug}`}
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
        <NavLink href="/work" size="sm">
          Work
        </NavLink>
        <Text size="xs" c="dimmed" mb="12">
          {post.metadata.publishedAt && formatDate(post.metadata.publishedAt)}
        </Text>
        <Title order={1}>{post.metadata.title}</Title>
      </Stack>
      <Group mb="32" justify="center">
        <Group gap="16" align="center">
          {post.metadata.team && (
            <AvatarGroup spacing="sm">
              {avatars.map((avatar: { src: string }, idx: number) => (
                <Avatar key={idx} src={avatar.src} size="sm" />
              ))}
            </AvatarGroup>
          )}
          <Text size="sm" c="dimmed">
            {post.metadata.team?.map((member: { name: string; linkedIn?: string }, idx: number) => (
              <span key={idx}>
                {idx > 0 && <span>, </span>}
                {member.linkedIn ? (
                  <Anchor href={member.linkedIn} size="sm">
                    {member.name}
                  </Anchor>
                ) : (
                  member.name
                )}
              </span>
            ))}
          </Text>
        </Group>
      </Group>
      {post.metadata.images.length > 0 && (
        <div
          style={{
            position: "relative",
            aspectRatio: "16 / 9",
            borderRadius: "var(--mantine-radius-md)",
            overflow: "hidden",
          }}
        >
          <Image
            src={post.metadata.images[0]}
            alt="Project screenshot"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 1024px"
            style={{ objectFit: "cover" }}
          />
        </div>
      )}
      <Stack component="article" maw={600} mx="auto">
        <CustomMDX source={post.content} />
      </Stack>
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Work", item: `${baseURL}/work` },
          { "@type": "ListItem", position: 2, name: post.metadata.title, item: `${baseURL}${work.path}/${post.slug}` },
        ],
      }} />
      <Stack gap="40" align="center" mt="40">
        <Divider maw={640} />
        <Title order={2} mb="24">
          Related work
        </Title>
        <Projects exclude={[post.slug]} range={[2]} />
      </Stack>
      <ScrollToHash />
    </Stack>
  );
}
