"use client";

import { logger } from "@/lib/logger";
import { Button, Column, Heading, Text } from "@once-ui-system/core";
import { useEffect } from "react";

/**
 * Route-level error boundary displayed when a page segment throws
 * during rendering or data fetching.
 *
 * Logs the error via pino and presents a user-friendly message with
 * a "Try again" button that calls `reset()` to re-attempt rendering.
 */
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
    <Column fillWidth paddingY="128" horizontal="center" gap="24">
      <Heading variant="display-strong-xs" align="center">
        Something went wrong
      </Heading>
      <Text variant="body-default-m" onBackground="neutral-weak" align="center">
        {error.message || "An unexpected error occurred."}
      </Text>
      <Button onClick={reset}>Try again</Button>
    </Column>
  );
}
