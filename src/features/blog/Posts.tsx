import { SimpleGrid } from "@mantine/core";
import { filterPosts } from "@/lib/draft";
import { getPosts } from "@/lib/mdx";
import Post from "./Post";

interface PostsProps {
  range?: [number] | [number, number];
  columns?: "1" | "2" | "3";
  thumbnail?: boolean;
  direction?: "row" | "column";
  exclude?: string[];
  includeDrafts?: boolean;
}

const colsMap: Record<string, number> = { "1": 1, "2": 2, "3": 3 };

export function Posts({
  range,
  columns = "1",
  thumbnail = false,
  exclude = [],
  direction,
  includeDrafts = false,
}: PostsProps) {
  let allBlogs = filterPosts(
    getPosts(["src", "content", "blog"]),
    includeDrafts,
  );

  if (exclude.length) {
    allBlogs = allBlogs.filter((post) => !exclude.includes(post.slug));
  }

  const sortedBlogs = allBlogs.sort((a, b) => {
    return new Date(b.metadata.publishedAt).getTime() - new Date(a.metadata.publishedAt).getTime();
  });

  const displayedBlogs = range
    ? sortedBlogs.slice(range[0] - 1, range.length === 2 ? range[1] : sortedBlogs.length)
    : sortedBlogs;

  return (
    <>
      {displayedBlogs.length > 0 && (
        <SimpleGrid cols={colsMap[columns] || 1} spacing="lg" mb="40">
          {displayedBlogs.map((post) => (
            <Post key={post.slug} post={post} thumbnail={thumbnail} direction={direction} />
          ))}
        </SimpleGrid>
      )}
    </>
  );
}
