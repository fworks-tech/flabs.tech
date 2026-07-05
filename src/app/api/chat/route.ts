import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { streamText } from "ai";
import { about, home, person, workExperience } from "@/content";
import { getPosts } from "@/lib/mdx";

const zen = createOpenAICompatible({
  name: "zen",
  baseURL: "https://opencode.ai/zen/v1",
  headers: {
    Authorization: `Bearer ${process.env.OPENCODE_API_KEY}`,
  },
});

const model = zen.chatModel("deepseek-v4-flash-free");

function buildSystemPrompt(): string {
  const projects = getPosts(["src", "content", "projects"]);
  const blogs = getPosts(["src", "content", "blog"]);

  const projectList = projects
      .map((p) => `- ${p.metadata.title}: ${p.metadata.summary}`)
    .join("\n");

  const blogList = blogs
    .map((b) => `- ${b.metadata.title}`)
    .join("\n");

  const experienceList = workExperience.experiences
    .map(
      (e) =>
        `- ${e.role} at ${e.company} (${e.timeframe}): ${e.achievements.map(String).join("; ")}`,
    )
    .join("\n");

  const skillList = about.technical.skills
    .map((s) => `${s.title}: ${(s.tags ?? []).map((t) => t.name).join(", ")}`)
    .join("\n");

  return `You are an AI assistant for Fabio Ritzel Borges's portfolio website (flabs.tech).

## About Fabio
- Name: ${person.name}
- Role: ${person.role}
- Location: ${person.location}
- Email: ${person.email}
- Resume: ${person.resume}

## Bio
${home.subline}

Senior Full-Stack Engineer & AI Systems Architect with 10+ years of experience across frontend, backend, and AI. Designs production GraphQL APIs, federated architectures, and agentic AI systems.

## Skills
${skillList}

## Work Experience
${experienceList}

## Projects
${projectList}

## Blog Posts
${blogList}

## Guidelines
- Be concise, professional, and friendly.
- Answer questions about Fabio's experience, skills, projects, and work history.
- If asked about something not in your context, say you don't have that information.
- Keep responses short and helpful — this is a portfolio site chat widget.
- Use "he/him" pronouns when referring to Fabio.
- Do not fabricate information. Only answer based on the data provided.`;
}

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model,
    messages,
    system: buildSystemPrompt(),
  });

  return result.toTextStreamResponse();
}
