import type { Meta, StoryObj } from "@storybook/react";

import { HeadingLink } from "./HeadingLink";

const meta = {
  title: "UI/HeadingLink",
  component: HeadingLink,
  args: { id: "section-1", level: 2, children: "Section Title" },
} satisfies Meta<typeof HeadingLink>;

export default meta;
type Story = StoryObj<typeof meta>;

export const H1: Story = { args: { level: 1, children: "H1 Heading" } };
export const H2: Story = {};
export const H3: Story = { args: { level: 3, children: "H3 Heading" } };
export const H4: Story = { args: { level: 4, children: "H4 Heading" } };
