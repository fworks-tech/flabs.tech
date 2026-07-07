"use client";

import { Group, Stack, Text } from "@mantine/core";
import type React from "react";
import styles from "./about.module.scss";

interface TableOfContentsProps {
  structure: {
    title: string;
    display: boolean;
    items: string[];
  }[];
  about: {
    tableOfContent: {
      display: boolean;
      subItems: boolean;
    };
  };
}

const TableOfContents: React.FC<TableOfContentsProps> = ({ structure, about }) => {
  const scrollTo = (id: string, offset: number) => {
    const element = document.getElementById(id);
    if (element) {
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - offset;
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  if (!about.tableOfContent.display) return null;

  return (
    <Stack
      style={{
        position: "fixed",
        left: 0,
        top: "50%",
        transform: "translateY(-50%)",
        whiteSpace: "nowrap",
        paddingLeft: "24px",
      }}
      gap="32"
    >
      {structure
        .filter((section) => section.display)
        .map((section, sectionIndex) => (
          <Stack key={sectionIndex} gap="12">
            <Group
              className={styles.hover}
              gap="8"
              align="center"
              style={{ cursor: "pointer" }}
              onClick={() => scrollTo(section.title, 80)}
            >
              <div style={{ height: "1px", minWidth: "16px", background: "var(--mantine-color-dark-2)" }} />
              <Text>{section.title}</Text>
            </Group>
            {about.tableOfContent.subItems &&
              section.items.map((item, itemIndex) => (
                <Group
                  key={itemIndex}
                  className={styles.hover}
                  gap="12"
                  pl="24"
                  align="center"
                  style={{ cursor: "pointer" }}
                  onClick={() => scrollTo(item, 80)}
                >
                  <div style={{ height: "1px", minWidth: "8px", background: "var(--mantine-color-dark-2)" }} />
                  <Text>{item}</Text>
                </Group>
              ))}
          </Stack>
        ))}
    </Stack>
  );
};

export default TableOfContents;
