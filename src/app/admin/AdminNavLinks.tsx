"use client";

import { Group, NavLink } from "@mantine/core";
import Link from "next/link";

const navItems = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/drafts", label: "Drafts" },
  { href: "/admin/ai", label: "AI Assistant" },
  { href: "/admin/quiz", label: "Quiz" },
  { href: "/admin/analytics", label: "Analytics" },
];

export function AdminNavLinks() {
  return (
    <Group gap="4" wrap="nowrap">
      {navItems.map((item) => (
        <NavLink
          key={item.href}
          component={Link}
          href={item.href}
          label={item.label}
          variant="subtle"
          active={false}
          py="6"
        />
      ))}
    </Group>
  );
}
