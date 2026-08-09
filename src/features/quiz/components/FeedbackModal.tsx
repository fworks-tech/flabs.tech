"use client";

import { Button, Group, Modal, Radio, Stack, Text, Textarea } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useState } from "react";

import { FEEDBACK_REASONS, type FeedbackReason } from "@/features/quiz/lib/feedback";

interface FeedbackModalProps {
  opened: boolean;
  onClose: () => void;
  questionId: string;
}

/**
 * "Report an issue with this question" modal. Posts to the feedback API;
 * the server persists to a bounded list for admin review.
 */
export function FeedbackModal({ opened, onClose, questionId }: FeedbackModalProps) {
  const [reason, setReason] = useState<FeedbackReason | null>(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setReason(null);
    setMessage("");
  }

  async function handleSubmit() {
    if (!reason) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/quiz/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, reason, message }),
      });
      if (!res.ok) throw new Error(`feedback ${res.status}`);
      notifications.show({
        message: "Thanks — we'll review it",
        color: "green",
        autoClose: 3000,
      });
      reset();
      onClose();
    } catch {
      notifications.show({
        color: "red",
        message: "Couldn't send feedback right now",
        autoClose: 3000,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      opened={opened}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Report an issue"
      size="sm"
    >
      <Stack gap="md">
        <Radio.Group
          value={reason ?? undefined}
          onChange={(value) => setReason(value as FeedbackReason)}
          label="What's wrong with this question?"
          required
        >
          <Stack gap="xs" mt="xs">
            {FEEDBACK_REASONS.map((r) => (
              <Radio key={r} value={r} label={r.replace("-", " ")} />
            ))}
          </Stack>
        </Radio.Group>

        <Textarea
          label="Message (optional)"
          placeholder="What should we fix?"
          maxLength={200}
          value={message}
          onChange={(event) => setMessage(event.currentTarget.value)}
          minRows={2}
          maxRows={4}
          data-testid="feedback-message"
        />
        <Text size="xs" c="dimmed" ta="right">
          {message.length}/200
        </Text>

        <Group justify="flex-end">
          <Button variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={submitting} disabled={!reason} data-testid="feedback-submit">
            Send
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
