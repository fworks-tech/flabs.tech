import type { Meta, StoryObj } from '@storybook/nextjs';

import { ZoomableImage } from './ZoomableImage';

const meta = {
  title: 'UI/ZoomableImage',
  component: ZoomableImage,
  args: { src: 'https://picsum.photos/800/400', alt: 'Demo image — hover to zoom' },
} satisfies Meta<typeof ZoomableImage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
