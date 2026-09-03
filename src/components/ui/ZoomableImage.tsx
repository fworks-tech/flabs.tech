'use client';

import { Image } from '@mantine/core';
import { useCallback, useState, type MouseEvent } from 'react';

import styles from './ZoomableImage.module.scss';

type ZoomableImageProps = {
  src: string;
  alt?: string;
};

/** Magnification applied while the cursor is over the image. */
const ZOOM_SCALE = 2;

export function ZoomableImage({ src, alt = '' }: ZoomableImageProps) {
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState('50% 50%');

  // Track the cursor so the zoom centers on the point being inspected.
  const handleMouseMove = useCallback((event: MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    setOrigin(`${x.toFixed(1)}% ${y.toFixed(1)}%`);
    setZoomed(true);
  }, []);

  return (
    <div
      className={styles.viewport}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setZoomed(false)}
    >
      <Image
        src={src}
        alt={alt}
        className={styles.image}
        style={{
          transform: zoomed ? `scale(${ZOOM_SCALE})` : 'scale(1)',
          transformOrigin: origin,
        }}
      />
    </div>
  );
}
