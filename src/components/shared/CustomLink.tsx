'use client';

import { Anchor } from '@mantine/core';
import Link from 'next/link';
import type React from 'react';
import type { ReactNode } from 'react';

type CustomLinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  children: ReactNode;
};

export function CustomLink({ href, children, ...props }: CustomLinkProps) {
  if (href.startsWith('/')) {
    return (
      <Anchor component={Link} href={href} {...props}>
        {children}
      </Anchor>
    );
  }

  if (href.startsWith('#')) {
    return (
      <Anchor href={href} {...props}>
        {children}
      </Anchor>
    );
  }

  return (
    <Anchor href={href} target="_blank" rel="noopener noreferrer" {...props}>
      {children}
    </Anchor>
  );
}
