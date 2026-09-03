import { MDXRemote, type MDXRemoteProps } from "next-mdx-remote/rsc";
import type React from "react";
import type { ReactNode } from "react";
import remarkGfm from "remark-gfm";
import { slugify as transliterate } from "transliteration";
import { BlogLinks } from "@/components/shared/blog-links";
import { logger } from "@/lib/logger";

import {
  Accordion,
  Anchor,
  Button,
  Card,
  Code,
  Divider,
  Grid,
  List,
  ListItem,
  Text,
  Title,
} from "@mantine/core";
import Link from "next/link";

import tableStyles from "./mdx-table.module.scss";
import { HeadingLink } from "@/components/ui/HeadingLink";
import { ZoomableImage } from "@/components/ui/ZoomableImage";

type CustomLinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  children: ReactNode;
};

function CustomLink({ href, children, ...props }: CustomLinkProps) {
  if (href.startsWith("/")) {
    return (
      <Anchor component={Link} href={href} {...props}>
        {children}
      </Anchor>
    );
  }

  if (href.startsWith("#")) {
    return (
      <Anchor href={href} {...props}>
        {children}
      </Anchor>
    );
  }

  return (
    <Anchor href={href} target="_blank" rel="noopener noreferrer" {...props}>
      {children}
    </Anchor>
  );
}

function createImage({ alt, src, ...props }: { alt?: string; src: string }) {
  if (!src) {
    logger.error("Media requires a valid 'src' property.");
    return null;
  }

  return <ZoomableImage alt={alt || ""} src={src} {...props} />;
}

function extractText(node: ReactNode): string {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (node && typeof node === "object" && "props" in node) {
    return extractText((node as { props: { children?: ReactNode } }).props?.children ?? "");
  }
  return "";
}

function slugify(str: string): string {
  const strWithAnd = str.replace(/&/g, " and ");
  return transliterate(strWithAnd, {
    lowercase: true,
    separator: "-",
  }).replace(/\-\-+/g, "-");
}

function createHeading(as: "h1" | "h2" | "h3" | "h4" | "h5" | "h6") {
  const levelMap: Record<string, 1 | 2 | 3 | 4 | 5 | 6> = {
    h1: 1, h2: 2, h3: 3, h4: 4, h5: 5, h6: 6,
  };
  const CustomHeading = ({
    children,
    style,
  }: {
    children: ReactNode;
    style?: React.CSSProperties;
  }) => {
    const slug = slugify(extractText(children));
    return (
      <HeadingLink level={levelMap[as]} id={slug} style={style}>
        {children}
      </HeadingLink>
    );
  };

  CustomHeading.displayName = `${as}`;

  return CustomHeading;
}

function createParagraph({ children }: { children: ReactNode }) {
  return (
    <Text
      style={{ lineHeight: "175%" }}
      size="md"
      c="dimmed"
      my="8"
      mb="12"
    >
      {children}
    </Text>
  );
}

function createInlineCode({ children }: { children: ReactNode }) {
  return <Code>{children}</Code>;
}

function createCodeBlock(props: any) {
  if (props.children?.props?.className) {
    const { className, children } = props.children.props;
    const language = className.replace("language-", "");
    const label = language.charAt(0).toUpperCase() + language.slice(1);

    return (
      <pre style={{ position: "relative", borderRadius: "var(--mantine-radius-md)", overflow: "hidden" }}>
        <div style={{ padding: "var(--mantine-spacing-xs) var(--mantine-spacing-md)", background: "var(--mantine-color-dark-6)", color: "var(--mantine-color-dimmed)", fontSize: "var(--mantine-font-size-sm)" }}>
          {label}
        </div>
        <Code block style={{ padding: "var(--mantine-spacing-md)", fontSize: "var(--mantine-font-size-sm)" }}>
          {children}
        </Code>
      </pre>
    );
  }

  return <pre {...props} />;
}

function createList(as: "ul" | "ol") {
  const Component = ({ children }: { children: ReactNode }) => (
    <List type={as === "ol" ? "ordered" : "unordered"}>{children}</List>
  );
  Component.displayName = `List(${as})`;
  return Component;
}

function createListItem({ children }: { children: ReactNode }) {
  return (
    <ListItem my="4" mb="8" style={{ lineHeight: "175%" }}>
      {children}
    </ListItem>
  );
}

function createHR() {
  return (
    <Divider my="lg" />
  );
}

function createTable({ children }: { children: ReactNode }) {
  return <table className={tableStyles.table}>{children}</table>;
}

function createTableSection(as: "thead" | "tbody" | "tfoot") {
  const Component = ({ children }: { children: ReactNode }) => {
    if (as === "thead") return <thead>{children}</thead>;
    if (as === "tbody") return <tbody>{children}</tbody>;
    return <tfoot>{children}</tfoot>;
  };
  Component.displayName = `TableSection(${as})`;
  return Component;
}

function createTableRow({ children }: { children: ReactNode }) {
  return <tr>{children}</tr>;
}

function createTableHeader({ children }: { children: ReactNode }) {
  return <th>{children}</th>;
}

function createTableCell({ children }: { children: ReactNode }) {
  return <td>{children}</td>;
}

const components = {
  p: createParagraph as any,
  h1: createHeading("h1") as any,
  h2: createHeading("h2") as any,
  h3: createHeading("h3") as any,
  h4: createHeading("h4") as any,
  h5: createHeading("h5") as any,
  h6: createHeading("h6") as any,
  img: createImage as any,
  a: CustomLink as any,
  code: createInlineCode as any,
  pre: createCodeBlock as any,
  ol: createList("ol") as any,
  ul: createList("ul") as any,
  li: createListItem as any,
  hr: createHR as any,
  table: createTable as any,
  thead: createTableSection("thead") as any,
  tbody: createTableSection("tbody") as any,
  tfoot: createTableSection("tfoot") as any,
  tr: createTableRow as any,
  th: createTableHeader as any,
  td: createTableCell as any,
  Heading: Title,
  Text,
  Button,
  Card,
  Grid,
  Accordion,
  BlogLinks,
};

type CustomMDXProps = MDXRemoteProps & {
  components?: typeof components;
};

export function CustomMDX(props: CustomMDXProps) {
  const mdxComponents = { ...components };
  const defaultOptions = {
    blockJS: false,
    parseFrontmatter: false,
    scope: mdxComponents,
    mdxOptions: { remarkPlugins: [remarkGfm] },
  };
  const mergedOptions = {
    ...defaultOptions,
    ...props.options,
    scope: { ...mdxComponents, ...((props.options?.scope || {}) as Record<string, unknown>) },
    mdxOptions: { ...defaultOptions.mdxOptions, ...((props.options?.mdxOptions || {}) as Record<string, unknown>) },
  };
  return (
    <MDXRemote
      {...props}
      options={mergedOptions}
      components={{ ...components, ...(props.components || {}) }}
    />
  );
}
