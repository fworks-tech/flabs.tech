import type { Meta, StoryObj } from "@storybook/react";

import { ShareSection } from "./ShareSection";

const meta = {
  title: "Features/ShareSection",
  component: ShareSection,
  args: { title: "Test Post", url: "https://flabs.tech/blog/test" },
} satisfies Meta<typeof ShareSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
