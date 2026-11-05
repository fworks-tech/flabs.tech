'use client';

import { Button, Group, Text, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';

import type { SaveResult } from '@/features/quiz/hooks/useLeaderboard';
import type { ScoreSubmission } from '@/features/quiz/lib/leaderboard';

interface SaveScoreFormProps {
  defaultName: string;
  runId: string;
  answers: number[];
  durationMs: number;
  onNameChange: (name: string) => void;
  onSave: (submission: ScoreSubmission) => Promise<SaveResult | null>;
}

/**
 * Save-score flow on the game-over card: display-name input (prefilled
 * from localStorage), submit to the leaderboard API, show the rank.
 * Failures degrade to a quiet message — saving is best-effort.
 */
export function SaveScoreForm({
  defaultName,
  runId,
  answers,
  durationMs,
  onNameChange,
  onSave,
}: SaveScoreFormProps) {
  const [name, setName] = useState(defaultName);
  const [saving, setSaving] = useState(false);
  const [savedRank, setSavedRank] = useState<number | null | undefined>(undefined);
  const [failed, setFailed] = useState(false);

  const canSave = name.trim().length > 0 && !saving && savedRank === undefined;

  async function handleSave() {
    if (!canSave) return;
    const trimmed = name.trim().slice(0, 20);
    setName(trimmed);
    onNameChange(trimmed);
    setSaving(true);
    setFailed(false);
    const result = await onSave({ displayName: trimmed, runId, answers, durationMs });
    setSaving(false);
    if (result === null) {
      setFailed(true);
      return;
    }
    setSavedRank(result.rank);
    notifications.show({
      message:
        result.rank === null
          ? 'Score saved — outside the top 100.'
          : result.rank === 0
            ? "You're #1!"
            : `Score saved — rank #${result.rank + 1}`,
      color: 'green',
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
          if (event.key === 'Enter') handleSave();
        }}
        aria-label="Display name"
        w={180}
        data-testid="save-name-input"
      />
      <Button onClick={handleSave} loading={saving} disabled={!canSave} data-testid="save-score">
        Save score
      </Button>
      {savedRank !== undefined && (
        <Text size="sm" fw={600} data-testid="save-rank">
          {savedRank === null ? 'Saved — outside the top 100' : `You're #${savedRank + 1}`}
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
