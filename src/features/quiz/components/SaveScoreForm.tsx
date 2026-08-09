"use client";

import { Button, Group, Text, TextInput } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useState } from "react";

import type { ScorePayload } from "@/features/quiz/lib/leaderboard";

interface SaveScoreFormProps {
  defaultName: string;
  score: number;
  correct: number;
  total: number;
  maxStreak: number;
  durationMs: number;
  onNameChange: (name: string) => void;
  onSave: (payload: ScorePayload) => Promise<number | null>;
}

/**
 * Save-score flow on the game-over card: display-name input (prefilled
 * from localStorage), submit to the leaderboard API, show the rank.
 * Failures degrade to a quiet message — saving is best-effort.
 */
export function SaveScoreForm({
  defaultName,
  score,
  correct,
  total,
  maxStreak,
  durationMs,
  onNameChange,
  onSave,
}: SaveScoreFormProps) {
  const [name, setName] = useState(defaultName);
  const [saving, setSaving] = useState(false);
  const [rank, setRank] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);

  const canSave = name.trim().length > 0 && !saving;

  async function handleSave() {
    if (!canSave) return;
    const trimmed = name.trim().slice(0, 20);
    setName(trimmed);
    onNameChange(trimmed);
    setSaving(true);
    setFailed(false);
    const result = await onSave({
      displayName: trimmed,
      score,
      correct,
      total,
      maxStreak,
      durationMs,
    });
    setSaving(false);
    if (result === null) {
      setFailed(true);
      return;
    }
    setRank(result);
    notifications.show({
      message: result === 0 ? "You're #1!" : `Score saved — rank #${result + 1}`,
      color: "green",
      autoClose: 3000,
    });
  }

  return (
    <Group gap="xs" wrap="nowrap" w="100%" justify="center" data-testid="save-score-form">
      <TextInput
        placeholder="Your name"
        maxLength={20}
        value={name}
        onChange={(event) => {
          setName(event.currentTarget.value);
          setFailed(false);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") handleSave();
        }}
        aria-label="Display name"
        w={180}
        data-testid="save-name-input"
      />
      <Button onClick={handleSave} loading={saving} disabled={!canSave} data-testid="save-score">
        Save score
      </Button>
      {rank !== null && (
        <Text size="sm" fw={600} data-testid="save-rank">
          You&apos;re #{rank + 1}
        </Text>
      )}
      {failed && (
        <Text size="xs" c="dimmed" data-testid="save-failed">
          Couldn&apos;t save right now.
        </Text>
      )}
    </Group>
  );
}
