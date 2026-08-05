"use client";

import { Button } from "@mantine/core";
import posthog from "posthog-js";
import { useTransition } from "react";
import { signOutAction } from "./actions";

export function SignOutButton() {
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={() => {
        if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
          posthog.reset();
        }
        startTransition(async () => {
          await signOutAction();
        });
      }}
    >
      <Button type="submit" variant="subtle" size="xs" loading={pending}>
        Sign out
      </Button>
    </form>
  );
}
