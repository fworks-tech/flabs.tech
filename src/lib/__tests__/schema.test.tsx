import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Schema } from "../schema";

describe("Schema", () => {
  it("renders WebPage schema", () => {
    const { container } = render(
      <Schema
        as="webPage"
        baseURL="https://flabs.tech"
        path="/about"
        title="About"
        description="About page"
        author={{
          name: "Fabio",
          url: "https://flabs.tech/about",
          image: "https://flabs.tech/avatar.png",
        }}
      />,
    );
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).toBeTruthy();
    const data = JSON.parse(script!.textContent || "");
    expect(data["@type"]).toBe("WebPage");
    expect(data.name).toBe("About");
    expect(data.url).toBe("https://flabs.tech/about");
  });

  it("renders BlogPosting schema with dates", () => {
    const { container } = render(
      <Schema
        as="blogPosting"
        baseURL="https://flabs.tech"
        path="/blog/post-1"
        title="Post 1"
        description="First post"
        datePublished="2026-01-01"
        dateModified="2026-06-15"
        author={{
          name: "Fabio",
          url: "https://flabs.tech/about",
          image: "https://flabs.tech/avatar.png",
        }}
      />,
    );
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).toBeTruthy();
    const data = JSON.parse(script!.textContent || "");
    expect(data["@type"]).toBe("BlogPosting");
    expect(data.headline).toBe("Post 1");
    expect(data.datePublished).toBe("2026-01-01");
    expect(data.dateModified).toBe("2026-06-15");
  });

  it("includes sameAs links when provided", () => {
    const { container } = render(
      <Schema
        as="webPage"
        baseURL="https://flabs.tech"
        path="/"
        title="Home"
        description="Home"
        sameAs={["https://github.com/fworks-tech", "https://linkedin.com/in/fabiorborges"]}
      />,
    );
    const script = container.querySelector('script[type="application/ld+json"]');
    const data = JSON.parse(script!.textContent || "");
    expect(data.sameAs).toContain("https://github.com/fworks-tech");
  });
});
