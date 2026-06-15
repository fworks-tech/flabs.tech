import type { Meta, StoryObj } from "@storybook/react";

import { ScrollToHash } from "./ScrollToHash";

const meta = {
  title: "UI/ScrollToHash",
  component: ScrollToHash,
} satisfies Meta<typeof ScrollToHash>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
