import { baseURL } from "@/config";
import { about, person, social } from "@/content";
import {
  Avatar,
  Button,
  Column,
  Heading,
  Icon,
  Meta,
  Row,
  Schema,
  Tag,
  Text,
} from "@once-ui-system/core";

export async function generateMetadata() {
  return Meta.generate({
    title: about.title,
    description: about.description,
    baseURL: baseURL,
    image: `/api/og/generate?title=${encodeURIComponent(about.title)}`,
    path: about.path,
  });
}

export default function About() {
  return (
    <Column maxWidth="m" paddingTop="40" horizontal="center" align="center" gap="xl">
      <Schema
        as="webPage"
        baseURL={baseURL}
        title={about.title}
        description={about.description}
        path={about.path}
        image={`/api/og/generate?title=${encodeURIComponent(about.title)}`}
        author={{
          name: person.name,
          url: `${baseURL}${about.path}`,
          image: `${baseURL}${person.avatar}`,
        }}
      />

      {/* Header: Avatar + Name + Role + Location + Social */}
      <Column horizontal="center" align="center" gap="m" fillWidth>
        {about.avatar.display && <Avatar src={person.avatar} size="xl" />}
        <Column horizontal="center" align="center" gap="4">
          <Heading variant="display-strong-xl" align="center">
            {person.name}
          </Heading>
          <Text variant="display-default-xs" onBackground="neutral-weak" align="center">
            {person.role}
          </Text>
          <Row gap="8" vertical="center" paddingTop="4">
            <Icon onBackground="accent-weak" name="globe" />
            <Text variant="body-default-s" onBackground="neutral-weak">
              Joinville, Brazil
            </Text>
            {person.languages && person.languages.length > 0 && (
              <>
                <Text variant="body-default-s" onBackground="neutral-weak">
                  ·
                </Text>
                {person.languages.map((lang, i) => (
                  <Tag key={i} size="s">
                    {lang}
                  </Tag>
                ))}
              </>
            )}
          </Row>
        </Column>

        {social.length > 0 && (
          <Row gap="8" wrap horizontal="center" paddingTop="8">
            {social
              .filter((item) => item.essential)
              .map(
                (item) =>
                  item.link && (
                    <Button
                      key={item.name}
                      href={item.link}
                      prefixIcon={item.icon}
                      label={item.name}
                      size="s"
                      weight="default"
                      variant="secondary"
                    />
                  ),
              )}
          </Row>
        )}
      </Column>

      {/* Introduction */}
      {about.intro.display && (
        <Column textVariant="body-default-l" fillWidth gap="m" maxWidth="s" align="center">
          {about.intro.description}
        </Column>
      )}

      {/* Technical skills */}
      {about.technical.display && (
        <Column fillWidth gap="l" maxWidth="s">
          <Heading as="h2" variant="display-strong-s">
            {about.technical.title}
          </Heading>
          {about.technical.skills.map((skill, index) => (
            <Column key={`${skill.title}-${index}`} fillWidth gap="4">
              <Text variant="heading-strong-l">{skill.title}</Text>
              <Text variant="body-default-m" onBackground="neutral-weak">
                {skill.description}
              </Text>
              {skill.tags && skill.tags.length > 0 && (
                <Row wrap gap="8" paddingTop="8">
                  {skill.tags.map((tag, tagIndex) => (
                    <Tag key={`${skill.title}-${tagIndex}`} size="l" prefixIcon={tag.icon}>
                      {tag.name}
                    </Tag>
                  ))}
                </Row>
              )}
            </Column>
          ))}
        </Column>
      )}
    </Column>
  );
}
