"use client";

import { AppShell, Group, Stack, Text, Title } from "@mantine/core";

import { AdminNavLinks } from "./AdminNavLinks";
import { SignOutButton } from "./SignOutButton";

/**
 * Client-side admin shell. AppShell is a compound client component
 * (`AppShell.Header` / `AppShell.Main` are static properties on the
 * `"use client"` module) — accessing them from a Server Component
 * resolves to `undefined` at runtime (React error #130). The shell
 * therefore lives in a client component and receives the session
 * user's display name as a serializable prop.
 */
export function AdminShell({
  userLabel,
  children,
}: {
  userLabel: string;
  children: React.ReactNode;
}) {
  return (
    <AppShell header={{ height: 64 }} padding="lg">
      <AppShell.Header>
        <Group h="100%" px="lg" justify="space-between" wrap="nowrap">
          <Group gap="lg" wrap="nowrap">
            <Title order={4}>flabs.tech Admin</Title>
            <AdminNavLinks />
          </Group>
          <Group gap="md" wrap="nowrap">
            <Text size="sm" c="dimmed" visibleFrom="sm">
              {userLabel}
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
