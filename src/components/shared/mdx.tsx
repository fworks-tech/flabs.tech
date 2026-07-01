import { MDXRemote, type MDXRemoteProps } from "next-mdx-remote/rsc";
import type React from "react";
import type { ReactNode } from "react";
import remarkGfm from "remark-gfm";
import { slugify as transliterate } from "transliteration";
import { BlogLinks } from "@/components/shared/blog-links";
import { logger } from "@/lib/logger";

import tableStyles from "./mdx-table.module.scss";

import {
  Accordion,
  AccordionGroup,
  Button,
  Card,
  CodeBlock,
  Column,
  Feedback,
  Grid,
  Heading,
  HeadingLink,
  Icon,
  InlineCode,
  Line,
  List,
  ListItem,
  Media,
  type MediaProps,
  Row,
  SmartLink,
  Text,
  type TextProps,
} from "@once-ui-system/core";

type CustomLinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  children: ReactNode;
};

function CustomLink({ href, children, ...props }: CustomLinkProps) {
  if (href.startsWith("/")) {
    return (
      <SmartLink href={href} {...props}>
        {children}
      </SmartLink>
    );
  }

  if (href.startsWith("#")) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  }

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
      {children}
    </a>
  );
}

function createImage({ alt, src, ...props }: MediaProps & { src: string }) {
  if (!src) {
    logger.error("Media requires a valid 'src' property.");
    return null;
  }

  return (
    <Media
      marginTop="8"
      marginBottom="16"
      enlarge
      radius="m"
      border="neutral-alpha-medium"
      sizes="(max-width: 960px) 100vw, 960px"
      alt={alt}
      src={src}
      {...props}
    />
  );
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
  const strWithAnd = str.replace(/&/g, " and "); // Replace & with 'and'
  return transliterate(strWithAnd, {
    lowercase: true,
    separator: "-", // Replace spaces with -
  }).replace(/\-\-+/g, "-"); // Replace multiple - with single -
}

function createHeading(as: "h1" | "h2" | "h3" | "h4" | "h5" | "h6") {
  const CustomHeading = ({
    children,
    ...props
  }: Omit<React.ComponentProps<typeof HeadingLink>, "as" | "id">) => {
    const slug = slugify(extractText(children));
    return (
      <HeadingLink marginTop="24" marginBottom="12" as={as} id={slug} {...props}>
        {children}
      </HeadingLink>
    );
  };

  CustomHeading.displayName = `${as}`;

  return CustomHeading;
}

function createParagraph({ children }: TextProps) {
  return (
    <Text
      style={{ lineHeight: "175%" }}
      variant="body-default-m"
      onBackground="neutral-medium"
      marginTop="8"
      marginBottom="12"
    >
      {children}
    </Text>
  );
}

function createInlineCode({ children }: { children: ReactNode }) {
  return <InlineCode>{children}</InlineCode>;
}

function createCodeBlock(props: any) {
  // For pre tags that contain code blocks
  if (props.children?.props?.className) {
    const { className, children } = props.children.props;

    // Extract language from className (format: language-xxx)
    const language = className.replace("language-", "");
    const label = language.charAt(0).toUpperCase() + language.slice(1);

    return (
      <CodeBlock
        marginTop="8"
        marginBottom="16"
        codes={[
          {
            code: children,
            language,
            label,
          },
        ]}
        copyButton={true}
      />
    );
  }

  // Fallback for other pre tags or empty code blocks
  return <pre {...props} />;
}

function createList(as: "ul" | "ol") {
  const Component = ({ children }: { children: ReactNode }) => <List as={as}>{children}</List>;
  Component.displayName = `List(${as})`;
  return Component;
}

function createListItem({ children }: { children: ReactNode }) {
  return (
    <ListItem marginTop="4" marginBottom="8" style={{ lineHeight: "175%" }}>
      {children}
    </ListItem>
  );
}

function createHR() {
  return (
    <Row fillWidth horizontal="center" padding="m">
      <Line maxWidth="40" />
    </Row>
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
  Heading,
  Text,
  CodeBlock,
  InlineCode,
  Accordion,
  AccordionGroup,
  Feedback,
  Button,
  Card,
  Grid,
  Row,
  Column,
  Icon,
  Media,
  SmartLink,
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
