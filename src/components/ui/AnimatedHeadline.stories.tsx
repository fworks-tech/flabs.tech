import type { Meta, StoryObj } from "@storybook/nextjs";

import { AnimatedHeadline } from "./AnimatedHeadline";

const meta = {
  title: "UI/AnimatedHeadline",
  component: AnimatedHeadline,
  tags: ["autodocs"],
  args: {
    text: "Hello World",
  },
} satisfies Meta<typeof AnimatedHeadline>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Short: Story = {
  args: { text: "Hi" },
};

export const WithClassName: Story = {
  args: { text: "Styled", className: "custom-class" },
};
