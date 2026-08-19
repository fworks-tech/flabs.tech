import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkMdx from "remark-mdx";
import remarkStringify from "remark-stringify";
import type { Image, Root } from "mdast";
import type { Node, Parent } from "unist";

export const DEFAULT_BASE_URL = "https://flabs.tech";

type JsxElement = Node & {
  name?: string | null;
  attributes?: Array<{ name?: string; value?: unknown }>;
  children?: Node[];
};

const LIST_ITEM_NAMES = new Set(["ListItem", "List.Item"]);

function hasAttribute(jsx: JsxElement, name: string, value: string): boolean {
  return (jsx.attributes ?? []).some(
    (attr) => attr.name === name && String(attr.value) === value,
  );
}

function absolutizeImageUrl(url: string, baseUrl: string): string {
  if (url.startsWith("/")) return `${baseUrl}${url}`;
  return url;
}

function toListItemChildren(children: Node[]): Node[] {
  if (children.length === 1 && children[0].type === "text") {
    return [{ type: "paragraph", children } as Node];
  }
  return children;
}

function collectListItems(node: Node): Array<{ children?: Node[] }> {
  const results: Array<{ children?: Node[] }> = [];
  for (const child of (node as Parent).children ?? []) {
    if (
      (child.type === "mdxJsxTextElement" || child.type === "mdxJsxFlowElement") &&
      LIST_ITEM_NAMES.has((child as JsxElement).name ?? "")
    ) {
      results.push({ children: (child as Parent).children });
    } else if (Array.isArray((child as Parent).children)) {
      results.push(...collectListItems(child));
    }
  }
  return results;
}

function buildList(jsx: JsxElement, baseUrl: string): Node[] {
  const ordered = hasAttribute(jsx, "type", "ordered");
  const items = collectListItems(jsx).map((item) => ({
    type: "listItem",
    spread: false,
    children: toListItemChildren(normalizeChildren(item.children, baseUrl)),
  }));
  if (items.length === 0) return [];
  return [{ type: "list", ordered, spread: false, children: items } as Node];
}

function normalizeChildren(children: Node[] | undefined, baseUrl: string): Node[] {
  return (children ?? []).flatMap((child) => normalizeNode(child, baseUrl));
}

function normalizeNode(node: Node, baseUrl: string): Node[] {
  switch (node.type) {
    case "mdxjsEsm":
    case "mdxFlowExpression":
    case "mdxTextExpression":
      return [];
    case "mdxJsxFlowElement":
    case "mdxJsxTextElement": {
      const jsx = node as JsxElement;
      const name = jsx.name ?? "";
      if (name === "List") {
        return buildList(jsx, baseUrl);
      }
      if (LIST_ITEM_NAMES.has(name)) {
        return [
          {
            type: "listItem",
            spread: false,
            children: toListItemChildren(normalizeChildren((node as Parent).children, baseUrl)),
          } as Node,
        ];
      }
      return normalizeChildren((node as Parent).children, baseUrl);
    }
    case "image": {
      const image = node as Image;
      return [{ ...image, url: absolutizeImageUrl(image.url, baseUrl) } as Image];
    }
    default: {
      const parent = node as Parent;
      if (Array.isArray(parent.children)) {
        const children = normalizeChildren(parent.children, baseUrl);
        return [{ ...node, children } as Node];
      }
      return [node];
    }
  }
}

/**
 * Converts MDX body content (frontmatter already stripped) to plain Markdown
 * suitable for platforms like Dev.to that cannot render MDX custom components.
 *
 * - Drops top-level `import`/`export` (mdxjsEsm) and `{expr}` nodes
 * - Unwraps unknown custom components to their inner Markdown
 * - Maps Mantine-style `<List>`/`<ListItem>` to Markdown lists
 * - Rewrites relative image URLs to absolute so they resolve off-site
 *
 * @param mdx - MDX body markdown (no frontmatter)
 * @param opts - Optional `baseUrl` used to absolutize image URLs
 */
export function mdxToMarkdown(mdx: string, opts: { baseUrl?: string } = {}): string {
  const baseUrl = opts.baseUrl ?? DEFAULT_BASE_URL;
  const tree = unified().use(remarkParse).use(remarkMdx).parse(mdx) as Root;
  const root = { type: "root", children: normalizeChildren(tree.children, baseUrl) } as Root;
  const file = unified().use(remarkStringify, { bullet: "-" }).stringify(root);
  return file.toString();
}
