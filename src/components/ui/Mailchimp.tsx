"use client";

import { Box, Button, Group, Stack, Text, TextInput, Title } from "@mantine/core";
import { mailchimp } from "@/config";
import { newsletter } from "@/content";
import { useState } from "react";
import styles from "./Mailchimp.module.scss";

function debounce<T extends (...args: any[]) => void>(func: T, delay: number): T {
  let timeout: ReturnType<typeof setTimeout>;
  return ((...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  }) as T;
}

export const Mailchimp = ({ marginBottom, padding }: { marginBottom?: string; padding?: string; }) => {
  const [email, setEmail] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [touched, setTouched] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const validateEmail = (email: string): boolean => {
    if (email === "") {
      return true;
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    if (!validateEmail(value)) {
      setError("Please enter a valid email address.");
    } else {
      setError("");
    }
  };

  const debouncedHandleChange = debounce(handleChange, 2000);

  const handleBlur = () => {
    setTouched(true);
    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
    }
  };

  if (newsletter.display === false) return null;

  return (
    <Box
      style={{
        position: "relative",
        overflow: "hidden",
        backdropFilter: "blur(16px)",
        background: "rgba(255,255,255,0.03)",
        borderRadius: "var(--mantine-radius-lg)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
      p="xl"
      mb="md"
      mx="auto"
      maw={600}
    >
      <Stack align="center" gap="md">
        <Title order={2}>{newsletter.title}</Title>
        <Text ta="center" c="dimmed">
          {newsletter.description}
        </Text>
      </Stack>
      <form
        style={{ width: "100%", marginTop: "var(--mantine-spacing-md)" }}
        action={mailchimp.action}
        method="post"
        id="mc-embedded-subscribe-form"
        name="mc-embedded-subscribe-form"
      >
        <Stack id="mc_embed_signup_scroll" gap="xs">
          <div className={styles.formGroup}>
            <TextInput
              id="mce-EMAIL"
              name="EMAIL"
              type="email"
              label="Email Address"
              placeholder="your@email.com"
              required
              error={error}
              onChange={(e) => {
                if (error) {
                  handleChange(e);
                } else {
                  debouncedHandleChange(e);
                }
              }}
              onBlur={handleBlur}
            />
            <Group mt="xs">
              <Button id="mc-embedded-subscribe" type="submit" loading={isLoading}>
                {isLoading ? "Subscribing..." : "Subscribe"}
              </Button>
            </Group>
            <Text size="xs" c="dimmed" mt="4">
              We&apos;ll never share your email.
            </Text>
            {error && (
              <Text size="xs" c="red" role="alert">
                {error}
              </Text>
            )}
          </div>
          <div style={{ display: "none" }}>
            <input
              type="checkbox"
              readOnly
              name="group[3492][1]"
              id="mce-group[3492]-3492-0"
              value=""
              checked
            />
          </div>
          <div id="mc-responses" className="clearfalse">
            <div className="response" id="mce-error-response" style={{ display: "none" }} />
            <div className="response" id="mce-success-response" style={{ display: "none" }} />
          </div>
          <div aria-hidden="true" style={{ position: "absolute", left: "-5000px" }}>
            <input
              type="text"
              readOnly
              name="b_c1a5a210340eb6c7bff33b2ba_0462d244aa"
              tabIndex={-1}
              value=""
            />
          </div>
        </Stack>
      </form>
    </Box>
  );
};
