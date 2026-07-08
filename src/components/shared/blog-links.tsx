import { Anchor, Group, Text } from "@mantine/core";

interface BlogLinksProps {
  github: string;
  npm: string;
  docs: string;
}

export function BlogLinks({ github, npm, docs }: BlogLinksProps) {
  return (
    <Group p="20" gap="16" wrap="wrap" justify="center">
      <Anchor href={github} target="_blank" rel="noopener noreferrer" size="sm">
        GitHub
      </Anchor>
      <Anchor href={npm} target="_blank" rel="noopener noreferrer" size="sm">
        npm
      </Anchor>
      <Anchor href={docs} target="_blank" rel="noopener noreferrer" size="sm">
        Docs
      </Anchor>
    </Group>
  );
}
