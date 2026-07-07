import { Avatar, Divider, Group, Image, Stack, Text, Title } from "@mantine/core";
import { NavLink } from "@/components/ui/NavLink";
import Link from "next/link";
import { CustomMDX, ScrollToHash } from "@/components";
import { JsonLd } from "@/components/layout/JsonLd";
import { baseURL, sameAs } from "@/config";
import { about, blog, person } from "@/content";
import { Posts } from "@/features/blog/Posts";
import { ShareSection } from "@/features/blog/ShareSection";
import { isAuthenticated } from "@/lib/auth";
import { formatDate } from "@/lib/formatDate";
import { logger } from "@/lib/logger";
import { getPosts } from "@/lib/mdx";
import { generateMeta } from "@/lib/seo";
import { Schema } from "@/lib/schema";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const posts = getPosts(["src", "content", "blog"]);
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

  const posts = getPosts(["src", "content", "blog"]);
  const post = posts.find((post) => post.slug === slugPath);

  if (!post) return {};

  const meta = generateMeta({
    title: post.metadata.title,
    description: post.metadata.summary,
    baseURL,
    image: post.metadata.image || `/api/og/generate?title=${post.metadata.title}`,
    path: `${blog.path}/${post.slug}`,
  });

  return {
    ...meta,
    alternates: {
      canonical: `${baseURL}${blog.path}/${post.slug}`,
    },
    openGraph: {
      ...(meta.openGraph || {}),
      type: "article",
      publishedTime: post.metadata.publishedAt,
      ...(post.metadata.image && {
        images: [{ url: post.metadata.image, width: 1200, height: 630 }],
      }),
    },
    ...(Array.isArray(post.metadata.tags)
      ? { keywords: post.metadata.tags.join(", ") }
      : {}),
  };
}

export default async function Blog({ params }: { params: Promise<{ slug: string | string[] }> }) {
  const routeParams = await params;
  const slugPath = Array.isArray(routeParams.slug)
    ? routeParams.slug.join("/")
    : routeParams.slug || "";

  const [auth, allPosts] = await Promise.all([
    isAuthenticated(),
    Promise.resolve(getPosts(["src", "content", "blog"])),
  ]);
  const post = allPosts.find((post) => post.slug === slugPath);

  if (!post) {
    logger.warn({ slug: slugPath }, "blog post not found");
    notFound();
  }

  if (post.metadata.draft && !auth) {
    logger.warn({ slug: slugPath }, "attempt to view draft without auth");
    notFound();
  }

  const avatars =
    post.metadata.team?.map((person) => ({
      src: person.avatar,
    })) || [];

  return (
    <Group>
      <Stack component="section" maw={1024} align="center" gap="lg" pt="24" mx="auto">
        <Schema
          as="blogPosting"
          baseURL={baseURL}
          sameAs={[sameAs.linkedin, sameAs.github].filter((v): v is string => !!v)}
          path={`${blog.path}/${post.slug}`}
          title={post.metadata.title}
          description={post.metadata.summary}
          datePublished={post.metadata.publishedAt}
          dateModified={post.metadata.publishedAt}
          image={
            post.metadata.image ||
            `/api/og/generate?title=${encodeURIComponent(post.metadata.title)}`
          }
          author={{
            name: person.name,
            url: `${baseURL}${about.path}`,
            image: `${baseURL}${person.avatar}`,
          }}
        />
        <Stack maw={600} gap="16" align="center">
          <NavLink href="/blog" size="sm">
            Blog
          </NavLink>
          <Text size="xs" c="dimmed" mb="12">
            {post.metadata.publishedAt && formatDate(post.metadata.publishedAt)}
          </Text>
          <Title order={1} ta="center">
            {post.metadata.draft && auth ? "[DRAFT] " : ""}{post.metadata.title}
          </Title>
          {post.metadata.subtitle && (
            <Text
              size="md"
              c="dimmed"
              ta="center"
              fs="italic"
            >
              {post.metadata.subtitle}
            </Text>
          )}
        </Stack>
        <Group mb="32" justify="center">
          <Group gap="16" align="center">
            <Avatar size="sm" src={person.avatar} alt={`Photo of ${person.name}`} />
            <Text size="sm" c="dimmed">
              {person.name}
            </Text>
          </Group>
        </Group>
        {post.metadata.image && (
          <Image
            src={post.metadata.image}
            alt={post.metadata.title}
            radius="lg"
            mt="12"
            mb="8"
            style={{ aspectRatio: "16 / 9", objectFit: "cover" }}
          />
        )}
        <Stack component="article" maw={600}>
          <CustomMDX source={post.content} />
        </Stack>

        <ShareSection
          title={post.metadata.title}
          url={`${baseURL}${blog.path}/${post.slug}`}
          shareText={post.metadata.shareText}
        />

        <JsonLd data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Blog", item: `${baseURL}/blog` },
            { "@type": "ListItem", position: 2, name: post.metadata.title, item: `${baseURL}${blog.path}/${post.slug}` },
          ],
        }} />

        <Stack gap="40" align="center" mt="40">
          <Divider visibleFrom="md" maw={640} />
          <Title order={2} id="recent-posts" mb="24">
            Recent posts
          </Title>
          <Posts exclude={[post.slug]} range={[1, 2]} columns="2" thumbnail direction="column" includeDrafts={auth} />
        </Stack>
        <ScrollToHash />
      </Stack>
    </Group>
  );
}
