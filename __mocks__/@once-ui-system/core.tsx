import React from "react";

function createComponent(displayName: string) {
  const Component = React.forwardRef<HTMLElement, any>(({ children, ...props }, ref) => {
    const { as, href, onClick, ...rest } = props;
    const Tag = as || "div";
    const extra: Record<string, any> = {};
    if (href) extra.href = href;
    if (onClick) extra.onClick = onClick;
    return (
      <Tag
        ref={ref}
        data-testid={displayName}
        data-props={JSON.stringify(rest)}
        {...extra}
      >
        {children}
      </Tag>
    );
  });
  Component.displayName = displayName;
  return Component;
}

function createVoidComponent(displayName: string) {
  const Component = React.forwardRef<HTMLElement, any>((props, ref) => {
    const { href, onClick, ...rest } = props;
    const extra: Record<string, any> = {};
    if (href) extra.href = href;
    if (onClick) extra.onClick = onClick;
    return <div ref={ref} data-testid={displayName} data-props={JSON.stringify(rest)} {...extra} />;
  });
  Component.displayName = displayName;
  return Component;
}

const Column = createComponent("Column");
const Row = createComponent("Row");
const Flex = createComponent("Flex");
const Grid = createComponent("Grid");
const Heading = createComponent("Heading");
const Text = createComponent("Text");
const Button = createComponent("Button");
const IconButton = createComponent("IconButton");
const ToggleButton = createComponent("ToggleButton");
const Card = createComponent("Card");
const Input = createComponent("Input");
const PasswordInput = createComponent("PasswordInput");
const Avatar = createComponent("Avatar");
const AvatarGroup = createComponent("AvatarGroup");
const Media = createComponent("Media");
const Carousel = createComponent("Carousel");
const SmartLink = createComponent("SmartLink");
const Spinner = createComponent("Spinner");
const Icon = createComponent("Icon");
const Tag = createComponent("Tag");
const Line = createComponent("Line");
const List = createComponent("List");
const ListItem = createComponent("ListItem");
const InlineCode = createVoidComponent("InlineCode");
const CodeBlock = createVoidComponent("CodeBlock");
const Accordion = createComponent("Accordion");
const AccordionGroup = createComponent("AccordionGroup");
const Feedback = createComponent("Feedback");
const Table = createComponent("Table");
const Background = createComponent("Background");
const HeadingLink = createComponent("HeadingLink");

const LayoutProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;
const ToastProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;
const IconProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;
const ThemeProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;
const DataThemeProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;

const addToast = vi.fn();
const useToast = () => ({ addToast });
const useTheme = () => ({ theme: "light", setTheme: vi.fn() });

const Meta = {
  generate: vi.fn((config: any) => ({
    title: config.title || "Test Title",
    description: config.description || "Test Description",
    openGraph: { title: config.title, description: config.description },
  })),
};

const Schema = {
  generate: vi.fn(() => ({})),
};

export {
  Accordion,
  AccordionGroup,
  Avatar,
  AvatarGroup,
  Background,
  Button,
  Card,
  Carousel,
  CodeBlock,
  Column,
  DataThemeProvider,
  Feedback,
  Flex,
  Grid,
  Heading,
  HeadingLink,
  Icon,
  IconButton,
  IconProvider,
  InlineCode,
  Input,
  LayoutProvider,
  Line,
  List,
  ListItem,
  Media,
  Meta,
  PasswordInput,
  Row,
  Schema,
  SmartLink,
  Spinner,
  Table,
  Tag,
  Text,
  ThemeProvider,
  ToggleButton,
  ToastProvider,
  useTheme,
  useToast,
};
