"use client";

import { useChat } from "@ai-sdk/react";
import { ActionIcon } from "@mantine/core";
import {
  IconArrowsMaximize,
  IconArrowsMinimize,
  IconMessage,
  IconSend,
  IconSquare,
  IconX,
} from "@tabler/icons-react";
import { DefaultChatTransport } from "ai";
import { useEffect, useRef, useState } from "react";
import styles from "./AiAssistant.module.scss";

const MAX_SESSION_MESSAGES = 20;
const MAX_INPUT_LENGTH = 500;

function getMessageText(msg: {
  role: string;
  parts: Array<{ type: string; text?: string }>;
}): string {
  return msg.parts
    .filter(
      (p): p is { type: "text"; text: string } =>
        p.type === "text" && typeof p.text === "string",
    )
    .map((p) => p.text)
    .join("");
}

function StatusDot({ status }: { status: string }) {
  if (status === "ready" || status === "error") return null;
  return (
    <span className={styles.statusDot}>
      <span className={styles.statusPulse} />
      {status === "submitted" ? "Thinking" : "Typing"}
    </span>
  );
}

export function AiAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [input, setInput] = useState("");
  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { messages, sendMessage, status, error, stop } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const isLoading = status === "submitted" || status === "streaming";
  const userMsgCount = messages.filter((m) => m.role === "user").length;
  const sessionLimitReached = userMsgCount >= MAX_SESSION_MESSAGES;

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!input.trim() || isLoading || sessionLimitReached) return;
    sendMessage({ text: input });
    setInput("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!input.trim() || isLoading || sessionLimitReached) return;
      sendMessage({ text: input });
      setInput("");
    }
  }

  return (
    <>
      <ActionIcon
        className={`${styles.toggle} ${isOpen ? styles.toggleHidden : ""}`}
        onClick={() => setIsOpen(true)}
        aria-label="Open AI assistant"
        variant="filled"
        size="xl"
        radius="xl"
      >
        <IconMessage size={24} />
      </ActionIcon>

      {isOpen && <div className={styles.overlay} onClick={() => setIsOpen(false)} data-testid="chat-overlay" />}

      <div
        className={`${styles.chat} ${isOpen ? styles.chatOpen : ""} ${
          expanded ? styles.chatExpanded : ""
        }`}
      >
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span className={styles.headerTitle}>AI Assistant</span>
            <StatusDot status={status} />
            {userMsgCount > 0 && (
              <span className={styles.msgCount}>{userMsgCount}/{MAX_SESSION_MESSAGES}</span>
            )}
          </div>
          <div className={styles.headerRight}>
            <ActionIcon
              variant="subtle"
              onClick={() => setExpanded(!expanded)}
              aria-label={expanded ? "Minimize chat" : "Expand chat"}
            >
              {expanded ? <IconArrowsMinimize size={16} /> : <IconArrowsMaximize size={16} />}
            </ActionIcon>
            {isLoading && (
              <ActionIcon
                variant="subtle"
                onClick={() => stop()}
                aria-label="Stop generating"
              >
                <IconSquare size={16} />
              </ActionIcon>
            )}
            <ActionIcon
              variant="subtle"
              onClick={() => setIsOpen(false)}
              aria-label="Close AI assistant"
            >
              <IconX size={16} />
            </ActionIcon>
          </div>
        </div>

        <div ref={chatRef} className={styles.messages}>
          {messages.length === 0 && (
            <div className={styles.welcome}>
              <div className={styles.welcomeIcon}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <p className={styles.welcomeTitle}>Hi, I&apos;m Fabio&apos;s AI assistant!</p>
              <p className={styles.welcomeText}>
                Ask me about his experience, skills, projects, or anything related to his portfolio.
              </p>
            </div>
          )}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`${styles.message} ${
                msg.role === "user" ? styles.messageUser : styles.messageAssistant
              }`}
            >
              <div className={styles.messageLabel}>
                {msg.role === "user" ? "You" : "Assistant"}
              </div>
              <div className={styles.messageContent}>{getMessageText(msg)}</div>
            </div>
          ))}
          {error && (
            <div className={styles.error}>
              {error.message?.includes("429") || error.message?.includes("rate limit")
                ? "Too many requests. Please wait a moment."
                : "Something went wrong. Please try again."}
            </div>
          )}
        </div>

        {sessionLimitReached ? (
          <div className={styles.limitNotice}>
            Conversation limit reached. Please refresh to start a new one.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputWrapper}>
              <textarea
                ref={inputRef}
                className={styles.input}
                placeholder="Ask anything..."
                value={input}
                onChange={(e) => {
                  if (e.target.value.length <= MAX_INPUT_LENGTH) {
                    setInput(e.target.value);
                  }
                }}
                onKeyDown={handleKeyDown}
                rows={1}
                disabled={isLoading}
              />
              <span className={`${styles.charCount} ${input.length >= MAX_INPUT_LENGTH ? styles.charCountWarn : ""}`}>
                {input.length}/{MAX_INPUT_LENGTH}
              </span>
            </div>
            {isLoading ? (
              <ActionIcon
                variant="filled"
                color="red"
                onClick={() => stop()}
                aria-label="Stop"
              >
                <IconSquare size={16} />
              </ActionIcon>
            ) : (
              <ActionIcon
                variant="filled"
                type="submit"
                disabled={!input.trim() || sessionLimitReached}
                aria-label="Send message"
              >
                <IconSend size={18} />
              </ActionIcon>
            )}
          </form>
        )}
      </div>
    </>
  );
}
