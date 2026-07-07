"use client";

import { Button, Stack, Text, Title } from "@mantine/core";
import { logger } from "@/lib/logger";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error({ err: error.message, digest: error.digest }, "route error boundary caught");
  }, [error]);

  return (
    <Stack py="128" align="center" gap="24">
      <Title order={2} ta="center">
        Something went wrong
      </Title>
      <Text size="md" c="dimmed" ta="center">
        {error.message || "An unexpected error occurred."}
      </Text>
      <Button onClick={reset}>Try again</Button>
    </Stack>
  );
}
