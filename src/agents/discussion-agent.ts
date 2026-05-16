import Anthropic from "@anthropic-ai/sdk";
import { DiscussionOutput } from "../types";

const PERSONAS = [
  "CTO / 시스템 설계자",
  "심리학자",
  "철학자",
  "스타트업 창업자",
  "행동경제학자",
  "Naval Ravikant 스타일 사상가",
];

const SYSTEM_PROMPT = `You are a discussion facilitator for a book club. Respond ONLY with valid JSON, no markdown.

Your job: given a book, generate intellectually challenging discussion content in Korean.

Rules:
- discussion_questions: 2 deep, non-obvious questions that challenge assumptions
- debate: pick 3 personas from the list and give each a concise, distinct perspective (2-3 sentences max)
- key_tensions: 2 core contradictions or unresolved tensions in the book's argument
- Avoid shallow agreement or generic praise
- Prioritize critical thinking and counterarguments
- All text in Korean

Output schema:
{
  "book": "",
  "discussion_questions": ["", ""],
  "debate": [
    { "persona": "", "perspective": "" }
  ],
  "key_tensions": ["", ""]
}`;

export async function runDiscussion(
  client: Anthropic,
  book: string,
  author: string,
  reason: string
): Promise<DiscussionOutput> {
  const personaSample = PERSONAS.sort(() => Math.random() - 0.5).slice(0, 3).join(", ");

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Book: "${book}" by ${author}
Why recommended: ${reason}
Use these personas for debate: ${personaSample}

Generate the discussion content.`,
      },
    ],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  return JSON.parse(cleaned) as DiscussionOutput;
}
