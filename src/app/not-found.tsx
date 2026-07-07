import { Stack, Text, Title } from "@mantine/core";

export default function NotFound() {
  return (
    <Stack align="center" justify="center" style={{ minHeight: "60vh" }} pb="160">
      <Text size="48px" fw={900}>
        404
      </Text>
      <Title order={1} mb="lg">
        Page Not Found
      </Title>
      <Text c="dimmed">The page you are looking for does not exist.</Text>
    </Stack>
  );
}
