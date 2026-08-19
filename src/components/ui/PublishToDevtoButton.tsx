"use client";

import { useState } from "react";
import { Button } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { logger } from "@/lib/logger";

interface PublishToDevtoButtonProps {
  slug: string;
  label?: string;
  size?: "xs" | "sm" | "md" | "lg";
}

/**
 * Admin-only action that publishes a blog post to Dev.to via the
 * auth-guarded cross-post API.
 */
export function PublishToDevtoButton({
  slug,
  label = "Publish to Dev.to",
  size,
}: PublishToDevtoButtonProps) {
  const [loading, setLoading] = useState(false);

  const handlePublish = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/crosspost/devto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(data.error || `Dev.to publish failed (${response.status})`);
      }
      notifications.show({
        title: "Published",
        message: data.url,
        color: "green",
        autoClose: 6000,
        withCloseButton: true,
      });
    } catch (error) {
      logger.error(error, "failed to publish to Dev.to");
      notifications.show({
        title: "Publish failed",
        message: error instanceof Error ? error.message : "Unknown error",
        color: "red",
        autoClose: 6000,
        withCloseButton: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button size={size} variant="light" loading={loading} onClick={handlePublish}>
      {label}
    </Button>
  );
}
