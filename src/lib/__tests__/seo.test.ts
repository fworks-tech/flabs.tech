import { describe, expect, it } from "vitest";
import { generateMeta } from "../seo";

describe("generateMeta", () => {
  it("returns title and description", () => {
    const meta = generateMeta({
      title: "About Me",
      description: "A description",
      baseURL: "https://flabs.tech",
      path: "/about",
    });
    expect(meta.title).toBe("About Me");
    expect(meta.description).toBe("A description");
  });

  it("sets OpenGraph fields", () => {
    const meta = generateMeta({
      title: "Test",
      description: "Desc",
      baseURL: "https://flabs.tech",
      path: "/test",
    });
    expect(meta.openGraph?.title).toBe("Test");
    expect(meta.openGraph?.description).toBe("Desc");
    expect(meta.openGraph?.url).toBe("https://flabs.tech/test");
    expect(meta.openGraph?.type).toBe("website");
  });

  it("sets Twitter card fields", () => {
    const meta = generateMeta({
      title: "Test",
      description: "Desc",
      baseURL: "https://flabs.tech",
      path: "/test",
    });
    expect(meta.twitter?.card).toBe("summary_large_image");
    expect(meta.twitter?.title).toBe("Test");
    expect(meta.twitter?.description).toBe("Desc");
  });

  it("includes image in OpenGraph and Twitter when provided", () => {
    const meta = generateMeta({
      title: "Post",
      description: "A post",
      baseURL: "https://flabs.tech",
      path: "/blog/post",
      image: "https://flabs.tech/api/og/image.png",
    });
    expect(meta.openGraph?.images).toHaveLength(1);
    expect(meta.openGraph?.images![0]).toMatchObject({
      url: "https://flabs.tech/api/og/image.png",
    });
    expect(meta.twitter?.images).toContain("https://flabs.tech/api/og/image.png");
  });

  it("generates correct canonical URL", () => {
    const meta = generateMeta({
      title: "Work",
      description: "My work",
      baseURL: "https://flabs.tech",
      path: "/work",
    });
    expect(meta.openGraph?.url).toBe("https://flabs.tech/work");
  });

  it("handles root path", () => {
    const meta = generateMeta({
      title: "Home",
      description: "Home page",
      baseURL: "https://flabs.tech",
      path: "/",
    });
    expect(meta.openGraph?.url).toBe("https://flabs.tech/");
  });
});
