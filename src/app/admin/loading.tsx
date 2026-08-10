import { Card, Paper, SimpleGrid, Skeleton, Stack, Text } from '@mantine/core';

function StatCardSkeleton() {
  return (
    <Card withBorder padding="md">
      <Skeleton h={12} w="60%" mb="sm" />
      <Skeleton h={28} w="40%" />
    </Card>
  );
}

export default function AdminLoading() {
  return (
    <Stack gap="xl">
      <Stack gap="4">
        <Skeleton h={28} w={200} />
        <Skeleton h={14} w={320} />
      </Stack>

      <SimpleGrid cols={{ base: 2, sm: 3, lg: 7 }}>
        {Array.from({ length: 7 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </SimpleGrid>

      <Paper withBorder p="lg">
        <Skeleton h={16} w={180} mb="lg" />
        <Skeleton h={160} />
      </Paper>

      <SimpleGrid cols={{ base: 1, lg: 2 }}>
        <Paper withBorder p="lg">
          <Skeleton h={16} w={140} mb="lg" />
          <Skeleton h={120} />
        </Paper>
        <Paper withBorder p="lg">
          <Skeleton h={16} w={140} mb="lg" />
          <Skeleton h={120} />
        </Paper>
      </SimpleGrid>

      <Text size="xs" c="dimmed" ta="center">
        Loading…
      </Text>
    </Stack>
  );
}
