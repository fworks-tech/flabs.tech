import type { Meta, StoryObj } from "@storybook/react";

import { ProjectCard } from "./ProjectCard";

const meta = {
  title: "UI/ProjectCard",
  component: ProjectCard,
  args: {
    href: "/work/test",
    title: "Test Project",
    description: "A sample project description",
    content: "Full case study content",
    avatars: [{ src: "/images/avatar.png" }],
    images: [],
    link: "",
  },
} satisfies Meta<typeof ProjectCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithTag: Story = { args: { tag: "React" } };

export const WithLink: Story = { args: { link: "https://example.com" } };

export const WithImages: Story = {
  args: { images: ["https://picsum.photos/800/600"] },
};
