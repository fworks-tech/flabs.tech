import { baseURL } from "@/config";
import { about, person, work, workExperience } from "@/content";
import { Column, Heading, Line, Meta, Row, Schema, Tag, Text } from "@once-ui-system/core";

export async function generateMetadata() {
  return Meta.generate({
    title: work.title,
    description: work.description,
    baseURL: baseURL,
    image: `/api/og/generate?title=${encodeURIComponent(work.title)}`,
    path: work.path,
  });
}

export default function WorkPage() {
  return (
    <Column maxWidth="m" paddingTop="24" paddingBottom="xl">
      <Schema
        as="webPage"
        baseURL={baseURL}
        path={work.path}
        title={work.title}
        description={work.description}
        image={`/api/og/generate?title=${encodeURIComponent(work.title)}`}
        author={{
          name: person.name,
          url: `${baseURL}${about.path}`,
          image: `${baseURL}${person.avatar}`,
        }}
      />

      <Column fillWidth horizontal="center" align="center" gap="8" marginBottom="xl">
        <Heading variant="display-strong-l" align="center">
          Work Experience
        </Heading>
        <Text variant="body-default-l" onBackground="neutral-weak" align="center">
          {work.description}
        </Text>
      </Column>

      <Column fillWidth gap="xl" maxWidth="s" style={{ margin: "0 auto" }}>
        {workExperience.experiences.map((exp, i) => (
          <Column key={i} fillWidth gap="m">
            <Row fillWidth horizontal="between" vertical="start" wrap gap="8">
              <Column gap="4">
                <Heading as="h2" variant="heading-strong-l">
                  {exp.company}
                </Heading>
                <Text variant="body-default-m" onBackground="brand-weak">
                  {exp.role}
                </Text>
                <Text variant="body-default-s" onBackground="neutral-weak">
                  {exp.location}
                </Text>
              </Column>
              <Tag size="m">{exp.timeframe}</Tag>
            </Row>
            <Column as="ul" gap="8" paddingLeft="m">
              {exp.achievements.map((item, j) => (
                <Row key={j} as="li" gap="8" vertical="start">
                  <Text
                    as="span"
                    onBackground="brand-weak"
                    style={{ flexShrink: 0, marginTop: "2px" }}
                  >
                    –
                  </Text>
                  <Text variant="body-default-m" onBackground="neutral-weak">
                    {item}
                  </Text>
                </Row>
              ))}
            </Column>
            {i < workExperience.experiences.length - 1 && <Line />}
          </Column>
        ))}
      </Column>

      <Column fillWidth gap="l" maxWidth="s" style={{ margin: "3rem auto 0" }}>
        <Heading as="h2" variant="display-strong-s">
          Education
        </Heading>
        {workExperience.education.map((edu, i) => (
          <Row
            key={i}
            fillWidth
            horizontal="between"
            vertical="start"
            wrap
            gap="8"
            paddingBottom="m"
          >
            <Column gap="4">
              <Text variant="heading-strong-m">{edu.institution}</Text>
              <Text variant="body-default-m" onBackground="neutral-weak">
                {edu.degree}
              </Text>
            </Column>
            <Tag size="s">{edu.timeframe}</Tag>
          </Row>
        ))}
      </Column>
    </Column>
  );
}
