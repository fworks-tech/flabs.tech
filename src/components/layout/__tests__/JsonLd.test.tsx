import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { JsonLd } from "@/components/layout/JsonLd";

describe("JsonLd", () => {
  it("renders a script tag with JSON-LD", () => {
    const data = { "@context": "https://schema.org", "@type": "Person", name: "Test" };
    const { container } = render(<JsonLd data={data} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).toBeInTheDocument();
    expect(JSON.parse(script!.textContent!)).toEqual(data);
  });

  it("renders nothing else", () => {
    const { container } = render(<JsonLd data={{}} />);
    expect(container.children.length).toBe(1);
  });
});