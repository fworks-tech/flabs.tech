import { MantineProvider } from "@mantine/core";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { type ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { sendMessage, stop, mockUseChat } = vi.hoisted(() => {
  const sendMessage = vi.fn();
  const stop = vi.fn();
  const mockUseChat = vi.fn(() => ({
    messages: [],
    sendMessage,
    status: "ready",
    error: null,
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
    vi.clearAllMocks();
  });

  it("renders toggle button initially", () => {
    render(<AiAssistant />, { wrapper: Wrapper });
    expect(screen.getByLabelText("Open AI assistant")).toBeInTheDocument();
  });

  it("opens chat when toggle is clicked", async () => {
    const user = userEvent.setup();
    render(<AiAssistant />, { wrapper: Wrapper });
    await user.click(screen.getByLabelText("Open AI assistant"));
    expect(screen.getByText("AI Assistant")).toBeInTheDocument();
  });

  it("shows welcome message when opened", async () => {
    const user = userEvent.setup();
    render(<AiAssistant />, { wrapper: Wrapper });
    await user.click(screen.getByLabelText("Open AI assistant"));
    expect(screen.getByText(/Fabio's AI assistant/)).toBeInTheDocument();
  });

  it("closes chat when close button is clicked", async () => {
    const user = userEvent.setup();
    render(<AiAssistant />, { wrapper: Wrapper });
    await user.click(screen.getByLabelText("Open AI assistant"));
    expect(screen.getByTestId("chat-overlay")).toBeInTheDocument();
    await user.click(screen.getByLabelText("Close AI assistant"));
    expect(screen.queryByTestId("chat-overlay")).not.toBeInTheDocument();
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

  it("shows session limit notice", async () => {
    mockUseChat.mockReturnValue({
      messages: Array.from({ length: 20 }, (_, i) => ({
        id: String(i),
        role: "user" as const,
        parts: [{ type: "text" as const, text: `msg ${i}` }],
      })),
      sendMessage,
      status: "ready",
      error: null,
      stop,
    });
    const user = userEvent.setup();
    render(<AiAssistant />, { wrapper: Wrapper });
    await user.click(screen.getByLabelText("Open AI assistant"));
    expect(screen.getByText(/conversation limit reached/i)).toBeInTheDocument();
  });

  it("shows stop button while loading", async () => {
    mockUseChat.mockReturnValue({
      messages: [],
      sendMessage,
      status: "submitted",
      error: null,
      stop,
    });
    const user = userEvent.setup();
    render(<AiAssistant />, { wrapper: Wrapper });
    await user.click(screen.getByLabelText("Open AI assistant"));
    expect(screen.getByLabelText("Stop")).toBeInTheDocument();
  });

  it("shows error message on error", async () => {
    mockUseChat.mockReturnValue({
      messages: [],
      sendMessage,
      status: "error",
      error: new Error("rate limit exceeded"),
      stop,
    });
    const user = userEvent.setup();
    render(<AiAssistant />, { wrapper: Wrapper });
    await user.click(screen.getByLabelText("Open AI assistant"));
    expect(screen.getByText(/Too many requests/i)).toBeInTheDocument();
  });

  it("disables send when input is empty", async () => {
    const user = userEvent.setup();
    render(<AiAssistant />, { wrapper: Wrapper });
    await user.click(screen.getByLabelText("Open AI assistant"));
    expect(screen.getByLabelText("Send message")).toBeDisabled();
  });
});