'use client';

import { Alert, Button, Paper, Stack, Text } from '@mantine/core';
import { logger } from '@/lib/logger';
import { useEffect } from 'react';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error({ err: error.message, digest: error.digest }, 'admin error boundary caught');
  }, [error]);

  return (
    <Paper withBorder p="lg" maw={560} mx="auto">
      <Stack gap="sm" align="flex-start">
        <Alert color="red" variant="light" title="Something went wrong" w="100%">
          Loading this admin page failed. If the problem persists, check the data stores (Upstash
          Redis) and try again.
        </Alert>
        <Text size="xs" c="dimmed" ff="monospace">
          {error.digest ? `Error digest: ${error.digest}` : 'An unexpected error occurred.'}
        </Text>
        <Button onClick={reset} variant="light">
          Try again
        </Button>
      </Stack>
    </Paper>
  );
}
