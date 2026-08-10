import { Text } from '@mantine/core';

/**
 * Renders the server-side render time — i.e. when the page's data was last
 * fetched. Re-rendered on every navigation/refresh.
 */
export function LastUpdated() {
  return (
    <Text size="xs" c="dimmed" data-testid="last-updated">
      Last updated {new Date().toLocaleTimeString()}
    </Text>
  );
}
