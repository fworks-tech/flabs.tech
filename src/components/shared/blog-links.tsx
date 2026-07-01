import { Flex, SmartLink, Text } from "@once-ui-system/core";

interface BlogLinksProps {
  /** URL to the GitHub repository */
  github: string;
  /** URL to the npm package */
  npm: string;
  /** URL to the documentation site */
  docs: string;
}

/**
 * Renders a row of external links (GitHub, npm, Docs) styled as Once UI
 * SmartLink elements. Used in MDX blog content to provide quick access
 * to project resources.
 */
export function BlogLinks({ github, npm, docs }: BlogLinksProps) {
  return (
    <Flex fillWidth paddingY="20" gap="16" wrap horizontal="center">
      <SmartLink
        href={github}
        suffixIcon="arrowUpRightFromSquare"
        style={{ margin: "0", width: "fit-content" }}
      >
        <Text variant="body-default-s">GitHub</Text>
      </SmartLink>
      <SmartLink
        href={npm}
        suffixIcon="arrowUpRightFromSquare"
        style={{ margin: "0", width: "fit-content" }}
      >
        <Text variant="body-default-s">npm</Text>
      </SmartLink>
      <SmartLink
        href={docs}
        suffixIcon="arrowUpRightFromSquare"
        style={{ margin: "0", width: "fit-content" }}
      >
        <Text variant="body-default-s">Docs</Text>
      </SmartLink>
    </Flex>
  );
}
