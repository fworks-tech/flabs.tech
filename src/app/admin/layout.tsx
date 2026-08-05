import { AppShell, Button, Group, Stack, Text, Title } from "@mantine/core";
import { requireSession } from "@/lib/session";
import { AdminNavLinks } from "./AdminNavLinks";
import { signOutAction } from "./actions";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();

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
              {session.user.login ?? session.user.name}
            </Text>
            <form action={signOutAction}>
              <Button type="submit" variant="subtle" size="xs">
                Sign out
              </Button>
            </form>
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
