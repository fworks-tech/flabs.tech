"use client";

import { Button, Group, Paper, Stack, Text, Title } from "@mantine/core";
import { IconPrinter } from "@tabler/icons-react";

import { rankMeta } from "@/features/quiz/lib/ranking";
import styles from "./Certificate.module.scss";

interface CertificateProps {
  displayName: string;
  score: number;
  correct: number;
  total: number;
  maxStreak: number;
}

/**
 * Printable completion certificate. Client-rendered from the saved score
 * (no server storage of certificates); `window.print()` plus a print
 * stylesheet that isolates the certificate card on paper.
 */
export function Certificate({
  displayName,
  score,
  correct,
  total,
  maxStreak,
}: CertificateProps) {
  const rank = rankMeta(correct, total);
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Stack align="center" gap="sm">
      <Paper
        withBorder
        p="xl"
        radius="md"
        className={styles.certificate}
        data-testid="certificate"
      >
        <Text tt="uppercase" ta="center" size="xs" fw={700} c="dimmed">
          flabs.tech · DevSprint
        </Text>
        <Title order={3} ta="center" mt="xs">
          Certificate of Completion
        </Title>
        <Text ta="center" mt="md" c="dimmed" size="sm">
          This certifies that
        </Text>
        <Text ta="center" fw={800} size="xl" mt="4" data-testid="certificate-name">
          {displayName}
        </Text>
        <Text ta="center" mt="md" size="sm">
          completed the JavaScript sprint with a score of{" "}
          <Text component="span" fw={700}>
            {score} / {total}
          </Text>{" "}
          ({Math.round((correct / Math.max(1, total)) * 100)}% accuracy, max streak {maxStreak}),
          earning the rank of{" "}
          <Text component="span" fw={700} data-testid="certificate-rank">
            {rank.badge}
          </Text>
          .
        </Text>
        <Text ta="center" size="sm" c="dimmed" mt="lg">
          {today}
        </Text>
      </Paper>

      <Button
        variant="light"
        leftSection={<IconPrinter size={16} aria-hidden="true" />}
        onClick={() => window.print()}
        data-testid="print-certificate"
      >
        Print certificate
      </Button>
    </Stack>
  );
}
