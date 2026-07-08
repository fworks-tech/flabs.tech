import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation");

import { ScrollToHash } from "@/components/ui/ScrollToHash";
import { useRouter } from "next/navigation";

describe("ScrollToHash", () => {
  it("renders nothing", () => {
    const { container } = render(<ScrollToHash />);
    expect(container.firstChild).toBeNull();
  });

  it("scrolls to element matching hash", () => {
    const el = document.createElement("div");
    el.id = "target";
    document.body.appendChild(el);
    Object.defineProperty(window, "location", {
      value: { hash: "#target", pathname: "/test" },
      writable: true,
    });
    el.scrollIntoView = vi.fn();

    render(<ScrollToHash />);

    expect(el.scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth" });
    document.body.removeChild(el);
  });

  it("does not scroll when no hash", () => {
    Object.defineProperty(window, "location", {
      value: { hash: "", pathname: "/test" },
      writable: true,
    });

    render(<ScrollToHash />);
  });
});
