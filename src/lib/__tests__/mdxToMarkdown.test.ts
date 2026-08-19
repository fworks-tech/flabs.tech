import { describe, expect, it } from "vitest";
import { mdxToMarkdown } from "../mdxToMarkdown";

describe("mdxToMarkdown", () => {
  it("keeps standard markdown structure", () => {
    const md = `## Hello

A paragraph with [a link](https://example.com).

\`\`\`js
const x = 1;
\`\`\`
`;

    const result = mdxToMarkdown(md);
    expect(result).toContain("## Hello");
    expect(result).toContain("A paragraph with [a link](https://example.com).");
    expect(result).toContain('```js');
    expect(result).toContain("const x = 1;");
  });

  it("keeps GFM tables", () => {
    const md = `| A | B |
| - | - |
| 1 | 2 |
`;

    const result = mdxToMarkdown(md);
    expect(result).toContain("| A | B |");
    expect(result).toContain("| - | - |");
    expect(result).toContain("| 1 | 2 |");
  });

  it("rewrites relative image urls to absolute", () => {
    const result = mdxToMarkdown("![hero](/images/pic.webp)");
    expect(result).toContain("![hero](https://flabs.tech/images/pic.webp)");
  });

  it("keeps absolute image urls unchanged", () => {
    const result = mdxToMarkdown("![hero](https://example.com/pic.png)");
    expect(result).toContain("![hero](https://example.com/pic.png)");
  });

  it("honours a custom baseUrl", () => {
    const result = mdxToMarkdown("![hero](/images/pic.webp)", {
      baseUrl: "https://blog.flabs.tech",
    });
    expect(result).toContain("![hero](https://blog.flabs.tech/images/pic.webp)");
  });

  it("strips top-level import and export statements", () => {
    const md = `import { Button } from "@mantine/core";

export const config = { a: 1 };

Some text.
`;

    const result = mdxToMarkdown(md);
    expect(result).not.toContain("import");
    expect(result).not.toContain("export");
    expect(result).toContain("Some text.");
  });

  it("strips inline expressions", () => {
    const md = `Value: {config.a}`;
    const result = mdxToMarkdown(md);
    expect(result).not.toContain("{config.a}");
    expect(result).toContain("Value:");
  });

  it("unwraps unknown custom components keeping inner content", () => {
    const md = `<Text>Ship it.</Text>`;
    const result = mdxToMarkdown(md);
    expect(result).toContain("Ship it.");
    expect(result).not.toContain("<Text>");
  });

  it("maps Mantine List/ListItem to markdown bullets", () => {
    const md = `<List>
  <ListItem>One</ListItem>
  <ListItem>Two</ListItem>
</List>
`;

    const result = mdxToMarkdown(md);
    expect(result).toContain("- One");
    expect(result).toContain("- Two");
    expect(result).not.toContain("<List");
  });

  it("maps List.Item dotted syntax to bullets", () => {
    const md = `<List>
  <List.Item>Alpha</List.Item>
</List>
`;

    const result = mdxToMarkdown(md);
    expect(result).toContain("- Alpha");
    expect(result).not.toContain("<List.Item>");
  });
});
