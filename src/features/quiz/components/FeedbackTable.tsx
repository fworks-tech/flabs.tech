"use client";

import { Badge, Button, Group, Table, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useState } from "react";

import type { FeedbackItem } from "@/features/quiz/lib/feedback";

interface FeedbackTableProps {
  items: { item: FeedbackItem; read: boolean }[];
}

const REASON_COLORS: Record<string, string> = {
  "wrong-answer": "red",
  unclear: "orange",
  typo: "yellow",
  other: "gray",
};

/** Feedback review table with mark-as-read actions (client mutation). */
export function FeedbackTable({ items }: FeedbackTableProps) {
  const [rows, setRows] = useState(items);

  async function markRead(id: string) {
    try {
      const res = await fetch("/api/quiz/feedback/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("mark read failed");
      setRows((prev) => prev.map((row) => (row.item.id === id ? { ...row, read: true } : row)));
    } catch {
      notifications.show({ color: "red", message: "Couldn't update feedback", autoClose: 3000 });
    }
  }

  if (rows.length === 0) {
    return <Text c="dimmed" size="sm">No feedback yet.</Text>;
  }

  return (
    <Table striped highlightOnHover>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Time</Table.Th>
          <Table.Th>Question</Table.Th>
          <Table.Th>Reason</Table.Th>
          <Table.Th>Message</Table.Th>
          <Table.Th>Status</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {rows.map(({ item, read }) => (
          <Table.Tr key={item.id} data-testid="feedback-row">
            <Table.Td>
              <Text size="xs" c="dimmed">{new Date(item.at).toLocaleString()}</Text>
            </Table.Td>
            <Table.Td>
              <Text size="xs" ff="monospace">{item.questionId}</Text>
            </Table.Td>
            <Table.Td>
              <Badge color={REASON_COLORS[item.reason] ?? "gray"} size="xs" variant="light">
                {item.reason}
              </Badge>
            </Table.Td>
            <Table.Td>
              <Text size="xs" lineClamp={2}>{item.message || "—"}</Text>
            </Table.Td>
            <Table.Td>
              {read ? (
                <Badge color="green" size="xs" variant="light">read</Badge>
              ) : (
                <Button size="compact-xs" variant="subtle" onClick={() => markRead(item.id)}>
                  Mark as read
                </Button>
              )}
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
}
