import type { Meta, StoryObj } from "@storybook/react";

import Post from "./Post";

const mockPost = {
  slug: "test-post",
  metadata: {
    title: "Test Post Title",
    publishedAt: "2025-06-01",
    tag: "tech",
    image: "https://picsum.photos/800/400",
  },
  content: "Post body content",
};

const meta = {
  title: "Features/Post",
  component: Post,
  args: { post: mockPost, thumbnail: false },
} satisfies Meta<typeof Post>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithThumbnail: Story = { args: { thumbnail: true } };

export const WithTag: Story = {
  args: { post: { ...mockPost, metadata: { ...mockPost.metadata, tag: "graphql" } } },
};

export const WithoutTag: Story = {
  args: { post: { ...mockPost, metadata: { ...mockPost.metadata, tag: "" } } },
};
