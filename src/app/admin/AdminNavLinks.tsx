'use client';

import { Group, NavLink } from '@mantine/core';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/drafts', label: 'Drafts' },
  { href: '/admin/ai', label: 'AI Assistant' },
  { href: '/admin/quiz', label: 'Quiz' },
  { href: '/admin/analytics', label: 'Analytics' },
];

export function AdminNavLinks() {
  const pathname = usePathname();

  return (
    <Group gap="4" wrap="nowrap">
      {navItems.map((item) => {
        const isActive =
          item.href === '/admin' ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <NavLink
            key={item.href}
            component={Link}
            href={item.href}
            label={item.label}
            variant="subtle"
            active={isActive}
            py="6"
          />
        );
      })}
    </Group>
  );
}
