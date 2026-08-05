import { AppShell, Button, Group, NavLink, Stack, Text, Title } from "@mantine/core";
import Link from "next/link";
import { requireSession } from "@/lib/session";
import { SignOutButton } from "./SignOutButton";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

const navItems = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/drafts", label: "Drafts" },
  { href: "/admin/ai", label: "AI Assistant" },
  { href: "/admin/analytics", label: "Analytics" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();

  return (
    <AppShell header={{ height: 64 }} padding="lg">
      <AppShell.Header>
        <Group h="100%" px="lg" justify="space-between" wrap="nowrap">
          <Group gap="lg" wrap="nowrap">
            <Title order={4}>flabs.tech Admin</Title>
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
          </Group>
          <Group gap="md" wrap="nowrap">
            <Text size="sm" c="dimmed" visibleFrom="sm">
              {session.user.login ?? session.user.name}
            </Text>
            <SignOutButton />
          </Group>
        </Group>
      </AppShell.Header>
      <AppShell.Main>
        <Stack maw={1200} mx="auto" w="100%" gap="xl" pt="md">
          {children}
        </Stack>
      </AppShell.Main>
    </AppShell>
  );
}
