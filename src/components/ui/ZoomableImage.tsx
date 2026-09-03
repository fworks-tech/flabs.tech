'use client';

import { Image } from '@mantine/core';
import { useCallback, useState, type ImgHTMLAttributes, type MouseEvent } from 'react';

import styles from './ZoomableImage.module.scss';

// Article-image magnifier: the viewport carries the standard article gutters,
// so this component is article-specific by design. Extra img attributes
// (e.g. title) pass through to the image; `style` is intentionally excluded
// because the zoom owns transform and transform-origin.
type ZoomableImageProps = {
  src: string;
  alt?: string;
} & Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt' | 'style'>;

/** Magnification applied while the cursor is over the image. */
const ZOOM_SCALE = 2;

export function ZoomableImage({ src, alt = '', className, ...rest }: ZoomableImageProps) {
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState('50% 50%');

  // Track the cursor so the zoom centers on the point being inspected.
  // Hover-only: touch and keyboard users keep the static image, which is
  // the pre-existing behavior for article images.
  const handleMouseMove = useCallback((event: MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const x = Math.min(100, Math.max(0, ((event.clientX - rect.left) / rect.width) * 100));
    const y = Math.min(100, Math.max(0, ((event.clientY - rect.top) / rect.height) * 100));
    setOrigin(`${x.toFixed(1)}% ${y.toFixed(1)}%`);
    setZoomed(true);
  }, []);

  const handleMouseLeave = useCallback(() => setZoomed(false), []);

  return (
    <div className={styles.viewport} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
      <Image
        src={src}
        alt={alt}
        {...rest}
        className={className ? `${styles.image} ${className}` : styles.image}
        style={{
          transform: zoomed ? `scale(${ZOOM_SCALE})` : 'scale(1)',
          transformOrigin: origin,
        }}
      />
    </div>
  );
}
