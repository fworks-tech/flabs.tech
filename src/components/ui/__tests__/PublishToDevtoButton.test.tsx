import { MantineProvider } from "@mantine/core";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const notificationsMock = vi.hoisted(() => ({ show: vi.fn() }));
vi.mock("@mantine/notifications", () => ({ notifications: notificationsMock }));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import { PublishToDevtoButton } from "../PublishToDevtoButton";

const renderButton = (props?: React.ComponentProps<typeof PublishToDevtoButton>) =>
  render(
    <MantineProvider>
      <PublishToDevtoButton slug="my-post" {...props} />
    </MantineProvider>,
  );

describe("PublishToDevtoButton", () => {
  beforeEach(() => {
    notificationsMock.show.mockReset();
    mockFetch.mockReset();
  });

  it("renders the button with a default label", () => {
    renderButton();
    expect(screen.getByRole("button", { name: "Publish to Dev.to" })).toBeInTheDocument();
  });

  it("uses a custom label when provided", () => {
    renderButton({ label: "Update on Dev.to" });
    expect(screen.getByRole("button", { name: "Update on Dev.to" })).toBeInTheDocument();
  });

  it("posts the slug on click and shows a success notification", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({ ok: true, url: "https://dev.to/flabs/my-post", devtoId: 1 }),
    });

    renderButton();
    await userEvent.click(screen.getByRole("button"));

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/crosspost/devto",
      expect.objectContaining({ method: "POST" }),
    );
    expect(mockFetch.mock.calls[0][1].body).toBe(JSON.stringify({ slug: "my-post" }));
    expect(notificationsMock.show).toHaveBeenCalledWith(
      expect.objectContaining({
        color: "green",
        message: "https://dev.to/flabs/my-post",
      }),
    );
  });

  it("shows an error notification when the API rejects", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: "Tags are required" }),
    });

    renderButton();
    await userEvent.click(screen.getByRole("button"));

    expect(notificationsMock.show).toHaveBeenCalledWith(
      expect.objectContaining({
        color: "red",
        message: "Tags are required",
      }),
    );
  });
});
