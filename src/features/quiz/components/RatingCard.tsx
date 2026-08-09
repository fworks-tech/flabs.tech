"use client";

import { ActionIcon, Button, Group, Paper, Text, TextInput } from "@mantine/core";
import { IconThumbDown, IconThumbUp } from "@tabler/icons-react";
import { useState } from "react";

interface RatingCardProps {
  onSubmitted: () => void;
}

/**
 * "Do you recommend this test?" — thumbs up/down + optional comment.
 * One submission per game-over screen (component state).
 */
export function RatingCard({ onSubmitted }: RatingCardProps) {
  const [rating, setRating] = useState<0 | 1 | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [failed, setFailed] = useState(false);
  const [done, setDone] = useState(false);

  async function submit() {
    if (rating === null || submitting) return;
    setSubmitting(true);
    setFailed(false);
    try {
      const res = await fetch("/api/quiz/rating", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment }),
      });
      if (!res.ok) throw new Error(`rating ${res.status}`);
      setDone(true);
      onSubmitted();
    } catch {
      setFailed(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <Paper withBorder p="md" radius="md" w="100%" maw={420} ta="center" data-testid="rating-thanks">
        <Text size="sm">Thanks for your feedback!</Text>
      </Paper>
    );
  }

  return (
    <Paper withBorder p="md" radius="md" w="100%" maw={420} data-testid="rating-card">
      <Text size="sm" fw={600} ta="center" mb="xs">
        Do you recommend this test?
      </Text>
      <Group justify="center" gap="xs" wrap="nowrap">
        <ActionIcon
          size="lg"
          variant={rating === 1 ? "filled" : "light"}
          color="green"
          onClick={() => setRating(1)}
          aria-label="Recommend"
          aria-pressed={rating === 1}
          data-testid="rating-up"
        >
          <IconThumbUp size={18} aria-hidden="true" />
        </ActionIcon>
        <ActionIcon
          size="lg"
          variant={rating === 0 ? "filled" : "light"}
          color="red"
          onClick={() => setRating(0)}
          aria-label="Do not recommend"
          aria-pressed={rating === 0}
          data-testid="rating-down"
        >
          <IconThumbDown size={18} aria-hidden="true" />
        </ActionIcon>
        <TextInput
          placeholder="Optional comment (max 200 chars)"
          maxLength={200}
          value={comment}
          onChange={(event) => setComment(event.currentTarget.value)}
          w={220}
          data-testid="rating-comment"
        />
      </Group>
      <Group justify="center" mt="sm">
        {failed && (
          <Text size="sm" c="dimmed" data-testid="rating-failed">
            Couldn&apos;t submit right now.
          </Text>
        )}
        <Button
          variant="light"
          size="xs"
          disabled={rating === null || submitting}
          onClick={submit}
          loading={submitting}
          data-testid="rating-submit"
        >
          Submit rating
        </Button>
      </Group>
    </Paper>
  );
}
