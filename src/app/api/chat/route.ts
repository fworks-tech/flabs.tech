import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { streamText } from "ai";
import { about, home, person, workExperience } from "@/content";
import { getPosts } from "@/lib/mdx";
import { rateLimit } from "@/lib/rateLimiter";
import { type NextRequest } from "next/server";

const zen = createOpenAICompatible({
  name: "zen",
  baseURL: "https://opencode.ai/zen/go/v1",
  headers: {
    Authorization: `Bearer ${process.env.OPENCODE_API_KEY}`,
  },
});

const model = zen.chatModel("mimo-v2.5");

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

function normalizeMessages(raw: any[]): Array<{ role: "user" | "assistant"; content: string }> {
  return raw.map((m: any) => {
    const role: "user" | "assistant" = m.role === "assistant" ? "assistant" : "user";
    if (m.parts && Array.isArray(m.parts)) {
      const text = m.parts
        .filter((p: any) => p.type === "text" || !p.type)
        .map((p: any) => p.text || "")
        .join("");
      return { role, content: text };
    }
    if (typeof m.content === "string") {
      return { role, content: m.content };
    }
    return { role, content: "" };
  });
}

const MAX_MESSAGES_PER_REQUEST = 20;
const MAX_INPUT_LENGTH = 500;

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  const { allowed, retryAfter } = rateLimit(ip, 30, 60_000);
  if (!allowed) {
    return new Response(
      JSON.stringify({
        error: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
      }),
      { status: 429, headers: { "Content-Type": "application/json" } },
    );
  }

  let body: { messages?: unknown };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { messages } = body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response(JSON.stringify({ error: "Invalid messages" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (messages.length > MAX_MESSAGES_PER_REQUEST) {
    return new Response(
      JSON.stringify({ error: `Maximum ${MAX_MESSAGES_PER_REQUEST} messages per request.` }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const lastMsg = messages[messages.length - 1];
  if (!lastMsg || (typeof lastMsg !== "object")) {
    return new Response(JSON.stringify({ error: "Invalid message format" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  const text = lastMsg.parts
    ? lastMsg.parts.filter((p: any) => p.type === "text").map((p: any) => p.text).join("")
    : lastMsg.content || "";
  if (text.length > MAX_INPUT_LENGTH) {
    return new Response(
      JSON.stringify({ error: `Message too long (max ${MAX_INPUT_LENGTH} characters).` }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const normalized = normalizeMessages(messages);

  const result = streamText({
    model,
    messages: normalized,
    system: buildSystemPrompt(),
  });

  return result.toUIMessageStreamResponse();
}
