import { MantineProvider } from "@mantine/core";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { type ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { sendMessage, stop, mockUseChat } = vi.hoisted(() => {
  const sendMessage = vi.fn();
  const stop = vi.fn();
  const mockUseChat = vi.fn(() => ({
    messages: [],
    sendMessage,
    status: "ready" as const,
    error: null as Error | null,
    stop,
  }));
  return { sendMessage, stop, mockUseChat };
});

vi.mock("@ai-sdk/react", () => ({
  useChat: mockUseChat,
}));

import { AiAssistant } from "@/components/ai/AiAssistant";

function Wrapper({ children }: { children: ReactNode }) {
  return <MantineProvider>{children}</MantineProvider>;
}

describe("AiAssistant", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    mockUseChat.mockReturnValue({
      messages: [],
      sendMessage,
      status: "ready" as const,
      error: null,
      stop,
    });
  });

  describe("toggle button", () => {
    it("renders toggle button initially", () => {
      render(<AiAssistant />, { wrapper: Wrapper });
      expect(screen.getByLabelText("Open AI assistant")).toBeInTheDocument();
    });

    it("hides toggle when chat is open", async () => {
      const user = userEvent.setup();
      render(<AiAssistant />, { wrapper: Wrapper });
      await user.click(screen.getByLabelText("Open AI assistant"));
      const toggle = screen.getByLabelText("Open AI assistant");
      expect(toggle).toHaveClass("toggleHidden");
    });
  });

  describe("opening and closing", () => {
    it("opens chat when toggle is clicked", async () => {
      const user = userEvent.setup();
      render(<AiAssistant />, { wrapper: Wrapper });
      await user.click(screen.getByLabelText("Open AI assistant"));
      expect(screen.getByText("AI Assistant")).toBeInTheDocument();
    });

    it("shows overlay when chat is open", async () => {
      const user = userEvent.setup();
      render(<AiAssistant />, { wrapper: Wrapper });
      await user.click(screen.getByLabelText("Open AI assistant"));
      expect(screen.getByTestId("chat-overlay")).toBeInTheDocument();
    });

    it("closes chat when close button is clicked", async () => {
      const user = userEvent.setup();
      render(<AiAssistant />, { wrapper: Wrapper });
      await user.click(screen.getByLabelText("Open AI assistant"));
      expect(screen.getByTestId("chat-overlay")).toBeInTheDocument();
      await user.click(screen.getByLabelText("Close AI assistant"));
      expect(screen.queryByTestId("chat-overlay")).not.toBeInTheDocument();
    });

    it("closes chat when overlay is clicked", async () => {
      const user = userEvent.setup();
      render(<AiAssistant />, { wrapper: Wrapper });
      await user.click(screen.getByLabelText("Open AI assistant"));
      expect(screen.getByTestId("chat-overlay")).toBeInTheDocument();
      await user.click(screen.getByTestId("chat-overlay"));
      expect(screen.queryByTestId("chat-overlay")).not.toBeInTheDocument();
    });
  });

  describe("welcome message", () => {
    it("shows welcome message when opened with no messages", async () => {
      const user = userEvent.setup();
      render(<AiAssistant />, { wrapper: Wrapper });
      await user.click(screen.getByLabelText("Open AI assistant"));
      expect(screen.getByText(/Fabio's AI assistant/)).toBeInTheDocument();
      expect(screen.getByText(/Ask me about his experience/)).toBeInTheDocument();
    });

    it("hides welcome message when messages exist", async () => {
      mockUseChat.mockReturnValue({
        messages: [
          {
            id: "1",
            role: "user" as const,
            parts: [{ type: "text" as const, text: "hello" }],
          },
        ],
        sendMessage,
        status: "ready" as const,
        error: null,
        stop,
      });
      const user = userEvent.setup();
      render(<AiAssistant />, { wrapper: Wrapper });
      await user.click(screen.getByLabelText("Open AI assistant"));
      expect(screen.queryByText(/Fabio's AI assistant/)).not.toBeInTheDocument();
    });
  });

  describe("message input", () => {
    it("disables send when input is empty", async () => {
      const user = userEvent.setup();
      render(<AiAssistant />, { wrapper: Wrapper });
      await user.click(screen.getByLabelText("Open AI assistant"));
      expect(screen.getByLabelText("Send message")).toBeDisabled();
    });

    it("enables send when input has text", async () => {
      const user = userEvent.setup();
      render(<AiAssistant />, { wrapper: Wrapper });
      await user.click(screen.getByLabelText("Open AI assistant"));
      await user.type(screen.getByPlaceholderText("Ask anything..."), "hello");
      expect(screen.getByLabelText("Send message")).toBeEnabled();
    });

    it("submits message on enter", async () => {
      const user = userEvent.setup();
      render(<AiAssistant />, { wrapper: Wrapper });
      await user.click(screen.getByLabelText("Open AI assistant"));
      const input = screen.getByPlaceholderText("Ask anything...");
      await user.type(input, "hello");
      await user.keyboard("{Enter}");
      expect(sendMessage).toHaveBeenCalledWith({ text: "hello" });
    });

    it("does not submit on shift+enter (newline)", async () => {
      const user = userEvent.setup();
      render(<AiAssistant />, { wrapper: Wrapper });
      await user.click(screen.getByLabelText("Open AI assistant"));
      const input = screen.getByPlaceholderText("Ask anything...");
      await user.type(input, "hello");
      await user.keyboard("{Shift>}{Enter}{/Shift}");
      expect(sendMessage).not.toHaveBeenCalled();
    });

    it("clears input after submit", async () => {
      const user = userEvent.setup();
      render(<AiAssistant />, { wrapper: Wrapper });
      await user.click(screen.getByLabelText("Open AI assistant"));
      const input = screen.getByPlaceholderText("Ask anything...");
      await user.type(input, "hello");
      await user.keyboard("{Enter}");
      expect(input).toHaveValue("");
    });

    it("does not submit when input is only whitespace", async () => {
      const user = userEvent.setup();
      render(<AiAssistant />, { wrapper: Wrapper });
      await user.click(screen.getByLabelText("Open AI assistant"));
      const input = screen.getByPlaceholderText("Ask anything...");
      await user.type(input, "   ");
      await user.keyboard("{Enter}");
      expect(sendMessage).not.toHaveBeenCalled();
    });

    it("enforces character limit of 500", async () => {
      const user = userEvent.setup();
      render(<AiAssistant />, { wrapper: Wrapper });
      await user.click(screen.getByLabelText("Open AI assistant"));
      const input = screen.getByPlaceholderText("Ask anything...");
      await user.type(input, "a".repeat(10));
      expect(input).toHaveValue("a".repeat(10));
      const charCount = input.parentElement!.querySelector("[class*='charCount']");
      expect(charCount).toHaveTextContent("10/500");
    });

    it("shows character count", async () => {
      const user = userEvent.setup();
      render(<AiAssistant />, { wrapper: Wrapper });
      await user.click(screen.getByLabelText("Open AI assistant"));
      const input = screen.getByPlaceholderText("Ask anything...");
      await user.type(input, "hello");
      const charCount = input.parentElement!.querySelector("[class*='charCount']");
      expect(charCount).toHaveTextContent("5/500");
    });

    it("shows warning color when at character limit", async () => {
      const user = userEvent.setup();
      render(<AiAssistant />, { wrapper: Wrapper });
      await user.click(screen.getByLabelText("Open AI assistant"));
      const input = screen.getByPlaceholderText("Ask anything...");
      await user.paste("a".repeat(500));
      const charCount = input.parentElement!.querySelector("[class*='charCount']");
      expect(charCount).toHaveClass("charCountWarn");
    });
  });

  describe("submit button", () => {
    it("submits form when send button is clicked", async () => {
      const user = userEvent.setup();
      render(<AiAssistant />, { wrapper: Wrapper });
      await user.click(screen.getByLabelText("Open AI assistant"));
      await user.type(screen.getByPlaceholderText("Ask anything..."), "hello");
      await user.click(screen.getByLabelText("Send message"));
      expect(sendMessage).toHaveBeenCalledWith({ text: "hello" });
    });
  });

  describe("loading states", () => {
    it("shows stop button in header while loading (submitted)", async () => {
      mockUseChat.mockReturnValue({
        messages: [],
        sendMessage,
        status: "submitted" as const,
        error: null,
        stop,
      });
      const user = userEvent.setup();
      render(<AiAssistant />, { wrapper: Wrapper });
      await user.click(screen.getByLabelText("Open AI assistant"));
      expect(screen.getByLabelText("Stop generating")).toBeInTheDocument();
    });

    it("shows stop button in header while streaming", async () => {
      mockUseChat.mockReturnValue({
        messages: [],
        sendMessage,
        status: "streaming" as const,
        error: null,
        stop,
      });
      const user = userEvent.setup();
      render(<AiAssistant />, { wrapper: Wrapper });
      await user.click(screen.getByLabelText("Open AI assistant"));
      expect(screen.getByLabelText("Stop generating")).toBeInTheDocument();
    });

    it("shows stop button in form while loading", async () => {
      mockUseChat.mockReturnValue({
        messages: [],
        sendMessage,
        status: "submitted" as const,
        error: null,
        stop,
      });
      const user = userEvent.setup();
      render(<AiAssistant />, { wrapper: Wrapper });
      await user.click(screen.getByLabelText("Open AI assistant"));
      expect(screen.getByLabelText("Stop")).toBeInTheDocument();
    });

    it("calls stop when stop button in header is clicked", async () => {
      mockUseChat.mockReturnValue({
        messages: [],
        sendMessage,
        status: "submitted" as const,
        error: null,
        stop,
      });
      const user = userEvent.setup();
      render(<AiAssistant />, { wrapper: Wrapper });
      await user.click(screen.getByLabelText("Open AI assistant"));
      await user.click(screen.getByLabelText("Stop generating"));
      expect(stop).toHaveBeenCalled();
    });

    it("calls stop when stop button in form is clicked", async () => {
      mockUseChat.mockReturnValue({
        messages: [],
        sendMessage,
        status: "submitted" as const,
        error: null,
        stop,
      });
      const user = userEvent.setup();
      render(<AiAssistant />, { wrapper: Wrapper });
      await user.click(screen.getByLabelText("Open AI assistant"));
      await user.click(screen.getByLabelText("Stop"));
      expect(stop).toHaveBeenCalled();
    });

    it("disables input while loading", async () => {
      mockUseChat.mockReturnValue({
        messages: [],
        sendMessage,
        status: "submitted" as const,
        error: null,
        stop,
      });
      const user = userEvent.setup();
      render(<AiAssistant />, { wrapper: Wrapper });
      await user.click(screen.getByLabelText("Open AI assistant"));
      expect(screen.getByPlaceholderText("Ask anything...")).toBeDisabled();
    });

    it("does not submit while loading", async () => {
      mockUseChat.mockReturnValue({
        messages: [],
        sendMessage,
        status: "submitted" as const,
        error: null,
        stop,
      });
      const user = userEvent.setup();
      render(<AiAssistant />, { wrapper: Wrapper });
      await user.click(screen.getByLabelText("Open AI assistant"));
      await user.type(screen.getByPlaceholderText("Ask anything..."), "hello");
      await user.keyboard("{Enter}");
      expect(sendMessage).not.toHaveBeenCalled();
    });

    it("hides send button while loading", async () => {
      mockUseChat.mockReturnValue({
        messages: [],
        sendMessage,
        status: "submitted" as const,
        error: null,
        stop,
      });
      const user = userEvent.setup();
      render(<AiAssistant />, { wrapper: Wrapper });
      await user.click(screen.getByLabelText("Open AI assistant"));
      expect(screen.queryByLabelText("Send message")).not.toBeInTheDocument();
    });
  });

  describe("status indicator", () => {
    it("shows 'Thinking' when status is submitted", async () => {
      mockUseChat.mockReturnValue({
        messages: [],
        sendMessage,
        status: "submitted" as const,
        error: null,
        stop,
      });
      const user = userEvent.setup();
      render(<AiAssistant />, { wrapper: Wrapper });
      await user.click(screen.getByLabelText("Open AI assistant"));
      expect(screen.getByText("Thinking")).toBeInTheDocument();
    });

    it("shows 'Typing' when status is streaming", async () => {
      mockUseChat.mockReturnValue({
        messages: [],
        sendMessage,
        status: "streaming" as const,
        error: null,
        stop,
      });
      const user = userEvent.setup();
      render(<AiAssistant />, { wrapper: Wrapper });
      await user.click(screen.getByLabelText("Open AI assistant"));
      expect(screen.getByText("Typing")).toBeInTheDocument();
    });

    it("hides status indicator when ready", async () => {
      mockUseChat.mockReturnValue({
        messages: [],
        sendMessage,
        status: "ready" as const,
        error: null,
        stop,
      });
      const user = userEvent.setup();
      render(<AiAssistant />, { wrapper: Wrapper });
      await user.click(screen.getByLabelText("Open AI assistant"));
      expect(screen.queryByText("Thinking")).not.toBeInTheDocument();
      expect(screen.queryByText("Typing")).not.toBeInTheDocument();
    });

    it("hides status indicator when error", async () => {
      mockUseChat.mockReturnValue({
        messages: [],
        sendMessage,
        status: "error" as const,
        error: new Error("fail"),
        stop,
      });
      const user = userEvent.setup();
      render(<AiAssistant />, { wrapper: Wrapper });
      await user.click(screen.getByLabelText("Open AI assistant"));
      expect(screen.queryByText("Thinking")).not.toBeInTheDocument();
      expect(screen.queryByText("Typing")).not.toBeInTheDocument();
    });
  });

  describe("message rendering", () => {
    it("renders user messages with correct label", async () => {
      mockUseChat.mockReturnValue({
        messages: [
          {
            id: "1",
            role: "user" as const,
            parts: [{ type: "text" as const, text: "hello" }],
          },
        ],
        sendMessage,
        status: "ready" as const,
        error: null,
        stop,
      });
      const user = userEvent.setup();
      render(<AiAssistant />, { wrapper: Wrapper });
      await user.click(screen.getByLabelText("Open AI assistant"));
      expect(screen.getByText("You")).toBeInTheDocument();
      expect(screen.getByText("hello")).toBeInTheDocument();
    });

    it("renders assistant messages with correct label", async () => {
      mockUseChat.mockReturnValue({
        messages: [
          {
            id: "1",
            role: "assistant" as const,
            parts: [{ type: "text" as const, text: "Hi there!" }],
          },
        ],
        sendMessage,
        status: "ready" as const,
        error: null,
        stop,
      });
      const user = userEvent.setup();
      render(<AiAssistant />, { wrapper: Wrapper });
      await user.click(screen.getByLabelText("Open AI assistant"));
      expect(screen.getByText("Assistant")).toBeInTheDocument();
      expect(screen.getByText("Hi there!")).toBeInTheDocument();
    });

    it("renders conversation with multiple messages", async () => {
      mockUseChat.mockReturnValue({
        messages: [
          {
            id: "1",
            role: "user" as const,
            parts: [{ type: "text" as const, text: "hello" }],
          },
          {
            id: "2",
            role: "assistant" as const,
            parts: [{ type: "text" as const, text: "Hi there!" }],
          },
          {
            id: "3",
            role: "user" as const,
            parts: [{ type: "text" as const, text: "how are you?" }],
          },
        ],
        sendMessage,
        status: "ready" as const,
        error: null,
        stop,
      });
      const user = userEvent.setup();
      render(<AiAssistant />, { wrapper: Wrapper });
      await user.click(screen.getByLabelText("Open AI assistant"));
      expect(screen.getByText("hello")).toBeInTheDocument();
      expect(screen.getByText("Hi there!")).toBeInTheDocument();
      expect(screen.getByText("how are you?")).toBeInTheDocument();
    });

    it("handles messages with multiple text parts", async () => {
      mockUseChat.mockReturnValue({
        messages: [
          {
            id: "1",
            role: "assistant" as const,
            parts: [
              { type: "text" as const, text: "Part 1 " },
              { type: "text" as const, text: "Part 2" },
            ],
          },
        ],
        sendMessage,
        status: "ready" as const,
        error: null,
        stop,
      });
      const user = userEvent.setup();
      render(<AiAssistant />, { wrapper: Wrapper });
      await user.click(screen.getByLabelText("Open AI assistant"));
      expect(screen.getByText("Part 1 Part 2")).toBeInTheDocument();
    });

    it("filters out non-text parts", async () => {
      mockUseChat.mockReturnValue({
        messages: [
          {
            id: "1",
            role: "assistant" as const,
            parts: [
              { type: "text" as const, text: "Hello" },
              { type: "tool-invocation" as const },
            ],
          },
        ],
        sendMessage,
        status: "ready" as const,
        error: null,
        stop,
      });
      const user = userEvent.setup();
      render(<AiAssistant />, { wrapper: Wrapper });
      await user.click(screen.getByLabelText("Open AI assistant"));
      expect(screen.getByText("Hello")).toBeInTheDocument();
    });

    it("renders a fallback for a finished empty assistant response", async () => {
      mockUseChat.mockReturnValue({
        messages: [
          {
            id: "1",
            role: "assistant" as const,
            parts: [{ type: "tool-invocation" as const }],
          },
        ],
        sendMessage,
        status: "ready" as const,
        error: null,
        stop,
      });
      const user = userEvent.setup();
      render(<AiAssistant />, { wrapper: Wrapper });
      await user.click(screen.getByLabelText("Open AI assistant"));
      expect(screen.getByText(/couldn't produce a summary/i)).toBeInTheDocument();
    });

    it("shows typing dots (not the fallback) while an empty assistant response streams", async () => {
      mockUseChat.mockReturnValue({
        messages: [
          {
            id: "1",
            role: "assistant" as const,
            parts: [{ type: "tool-invocation" as const }],
          },
        ],
        sendMessage,
        status: "streaming" as const,
        error: null,
        stop,
      });
      const user = userEvent.setup();
      render(<AiAssistant />, { wrapper: Wrapper });
      await user.click(screen.getByLabelText("Open AI assistant"));
      expect(document.querySelector(".typingDots")).not.toBeNull();
      expect(screen.queryByText(/couldn't produce a summary/i)).not.toBeInTheDocument();
    });
  });

  describe("session limit", () => {
    it("shows session limit notice when 20 user messages reached", async () => {
      mockUseChat.mockReturnValue({
        messages: Array.from({ length: 20 }, (_, i) => ({
          id: String(i),
          role: "user" as const,
          parts: [{ type: "text" as const, text: `msg ${i}` }],
        })),
        sendMessage,
        status: "ready" as const,
        error: null,
        stop,
      });
      const user = userEvent.setup();
      render(<AiAssistant />, { wrapper: Wrapper });
      await user.click(screen.getByLabelText("Open AI assistant"));
      expect(screen.getByText(/conversation limit reached/i)).toBeInTheDocument();
    });

    it("hides form when session limit is reached", async () => {
      mockUseChat.mockReturnValue({
        messages: Array.from({ length: 20 }, (_, i) => ({
          id: String(i),
          role: "user" as const,
          parts: [{ type: "text" as const, text: `msg ${i}` }],
        })),
        sendMessage,
        status: "ready" as const,
        error: null,
        stop,
      });
      const user = userEvent.setup();
      render(<AiAssistant />, { wrapper: Wrapper });
      await user.click(screen.getByLabelText("Open AI assistant"));
      expect(screen.queryByPlaceholderText("Ask anything...")).not.toBeInTheDocument();
    });

    it("does not submit when session limit is reached", async () => {
      mockUseChat.mockReturnValue({
        messages: Array.from({ length: 20 }, (_, i) => ({
          id: String(i),
          role: "user" as const,
          parts: [{ type: "text" as const, text: `msg ${i}` }],
        })),
        sendMessage,
        status: "ready" as const,
        error: null,
        stop,
      });
      const user = userEvent.setup();
      render(<AiAssistant />, { wrapper: Wrapper });
      await user.click(screen.getByLabelText("Open AI assistant"));
      expect(sendMessage).not.toHaveBeenCalled();
    });

    it("shows message count in header", async () => {
      mockUseChat.mockReturnValue({
        messages: [
          {
            id: "1",
            role: "user" as const,
            parts: [{ type: "text" as const, text: "hello" }],
          },
          {
            id: "2",
            role: "assistant" as const,
            parts: [{ type: "text" as const, text: "hi" }],
          },
          {
            id: "3",
            role: "user" as const,
            parts: [{ type: "text" as const, text: "bye" }],
          },
        ],
        sendMessage,
        status: "ready" as const,
        error: null,
        stop,
      });
      const user = userEvent.setup();
      render(<AiAssistant />, { wrapper: Wrapper });
      await user.click(screen.getByLabelText("Open AI assistant"));
      expect(screen.getByText("2/20")).toBeInTheDocument();
    });

    it("does not show message count when no user messages", async () => {
      const user = userEvent.setup();
      render(<AiAssistant />, { wrapper: Wrapper });
      await user.click(screen.getByLabelText("Open AI assistant"));
      expect(screen.queryByText("/20")).not.toBeInTheDocument();
    });
  });

  describe("error handling", () => {
    it("shows rate limit error message", async () => {
      mockUseChat.mockReturnValue({
        messages: [],
        sendMessage,
        status: "error" as const,
        error: new Error("429 rate limit exceeded"),
        stop,
      });
      const user = userEvent.setup();
      render(<AiAssistant />, { wrapper: Wrapper });
      await user.click(screen.getByLabelText("Open AI assistant"));
      expect(screen.getByText(/Too many requests/i)).toBeInTheDocument();
    });

    it("shows generic error message for other errors", async () => {
      mockUseChat.mockReturnValue({
        messages: [],
        sendMessage,
        status: "error" as const,
        error: new Error("network failure"),
        stop,
      });
      const user = userEvent.setup();
      render(<AiAssistant />, { wrapper: Wrapper });
      await user.click(screen.getByLabelText("Open AI assistant"));
      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
    });

    it("hides error when status returns to ready", async () => {
      mockUseChat.mockReturnValue({
        messages: [],
        sendMessage,
        status: "error" as const,
        error: new Error("fail"),
        stop,
      });
      const user = userEvent.setup();
      const { unmount } = render(<AiAssistant />, { wrapper: Wrapper });
      await user.click(screen.getByLabelText("Open AI assistant"));
      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();

      unmount();

      mockUseChat.mockReturnValue({
        messages: [],
        sendMessage,
        status: "ready" as const,
        error: null,
        stop,
      });
      render(<AiAssistant />, { wrapper: Wrapper });
      await user.click(screen.getByLabelText("Open AI assistant"));
      expect(screen.queryByText(/Something went wrong/i)).not.toBeInTheDocument();
    });
  });

  describe("expand/minimize", () => {
    it("toggles expand when expand button is clicked", async () => {
      const user = userEvent.setup();
      render(<AiAssistant />, { wrapper: Wrapper });
      await user.click(screen.getByLabelText("Open AI assistant"));
      const expandBtn = screen.getByLabelText("Expand chat");
      await user.click(expandBtn);
      expect(screen.getByLabelText("Minimize chat")).toBeInTheDocument();
    });

    it("collapses when minimize button is clicked", async () => {
      const user = userEvent.setup();
      render(<AiAssistant />, { wrapper: Wrapper });
      await user.click(screen.getByLabelText("Open AI assistant"));
      await user.click(screen.getByLabelText("Expand chat"));
      expect(screen.getByLabelText("Minimize chat")).toBeInTheDocument();
      await user.click(screen.getByLabelText("Minimize chat"));
      expect(screen.getByLabelText("Expand chat")).toBeInTheDocument();
    });
  });
});
