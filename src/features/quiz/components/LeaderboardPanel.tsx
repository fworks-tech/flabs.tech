"use client";

import { Badge, Group, Loader, SegmentedControl, Skeleton, Stack, Text } from "@mantine/core";

import type { LeaderboardEntry } from "@/features/quiz/lib/leaderboard";
import type { LeaderboardWeek } from "@/features/quiz/hooks/useLeaderboard";
import styles from "./LeaderboardPanel.module.scss";

interface LeaderboardPanelProps {
  entries: LeaderboardEntry[];
  loading: boolean;
  error: boolean;
  week: LeaderboardWeek;
  onWeekChange: (week: LeaderboardWeek) => void;
  /** The player's saved entry id, highlighted when present. */
  highlightId?: string | null;
}

function medal(rank: number) {
  if (rank === 0) return styles.gold;
  if (rank === 1) return styles.silver;
  if (rank === 2) return styles.bronze;
  return styles.plain;
}

function SkeletonRow() {
  return (
    <Group justify="space-between" wrap="nowrap" className={styles.row}>
      <Group gap="xs" wrap="nowrap">
        <Skeleton width={24} height={16} />
        <Skeleton width={80} height={14} />
      </Group>
      <Group gap="xs" wrap="nowrap">
        <Skeleton width={32} height={14} />
        <Skeleton width={40} height={14} />
      </Group>
    </Group>
  );
}

/**
 * Top-10 leaderboard with a week/all-time toggle. Failures render a
 * subtle "unavailable" note — the leaderboard never blocks the game.
 */
export function LeaderboardPanel({
  entries,
  loading,
  error,
  week,
  onWeekChange,
  highlightId,
}: LeaderboardPanelProps) {
  return (
    <Stack gap="sm" w="100%" maw={420}>
      <Group justify="space-between" wrap="nowrap">
        <Text fw={700} size="sm">
          Leaderboard
        </Text>
        <SegmentedControl
          size="xs"
          value={week}
          onChange={(value) => onWeekChange(value as LeaderboardWeek)}
          data={[
            { label: "This week", value: "current" },
            { label: "All time", value: "all" },
          ]}
          aria-label="Leaderboard period"
        />
      </Group>

      {loading ? (
        <Stack gap="2">
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </Stack>
      ) : error ? (
        <Text size="xs" c="dimmed" ta="center" py="md" data-testid="leaderboard-unavailable">
          Leaderboard unavailable right now.
        </Text>
      ) : entries.length === 0 ? (
        <Stack gap="4" align="center" py="md" data-testid="leaderboard-empty">
          <Text size="sm" c="dimmed">
            No scores yet this {week === "current" ? "week" : "period"}
          </Text>
          <Text size="xs" c="dimmed">
            Be the first to claim your spot!
          </Text>
        </Stack>
      ) : (
        <Stack gap="2" data-testid="leaderboard-list">
          {entries.map((entry) => {
            const isPlayer = highlightId != null && entry.id === highlightId;
            return (
              <Group
                key={`${entry.id}-${entry.rank}`}
                justify="space-between"
                wrap="nowrap"
                className={`${styles.row} ${medal(entry.rank)} ${isPlayer ? styles.player : ""}`}
                data-testid="leaderboard-row"
              >
                <Group gap="xs" wrap="nowrap">
                  <span className={styles.rank}>{entry.rank + 1}</span>
                  <Text size="sm" fw={isPlayer ? 700 : 400}>
                    {entry.displayName}
                  </Text>
                  {isPlayer && (
                    <Badge size="xs" variant="light" color="grape">
                      you
                    </Badge>
                  )}
                </Group>
                <Group gap="xs" wrap="nowrap">
                  <Text size="xs" c="dimmed" ff="monospace">
                    {Math.round(entry.accuracy * 100)}%
                  </Text>
                  <Text size="sm" fw={600} ff="monospace">
                    {entry.score}
                  </Text>
                </Group>
              </Group>
            );
          })}
        </Stack>
      )}
    </Stack>
  );
}
