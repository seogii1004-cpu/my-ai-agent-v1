import Anthropic from "@anthropic-ai/sdk";
import { InsightOutput, Preferences } from "../types";

const SYSTEM_PROMPT = `You are an insight connector agent. Respond ONLY with valid JSON, no markdown.

Your job: connect a book's core ideas to the user's real-life domains in practical, specific ways.

Rules:
- Generate exactly 3 insights, one per domain (pick the 3 most relevant domains)
- Each insight must be concrete and actionable, not generic
- application: how the book idea maps to this domain (1 sentence)
- action: one specific thing to try this week (1 sentence)
- All text in Korean

Output schema:
{
  "book": "",
  "insights": [
    { "domain": "", "application": "", "action": "" }
  ]
}`;

export async function runInsight(
  client: Anthropic,
  book: string,
  author: string,
  prefs: Preferences
): Promise<InsightOutput> {
  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Book: "${book}" by ${author}
User's life domains: ${prefs.life_domains.join(", ")}
User's interests: ${prefs.interests.join(", ")}

Connect this book's core ideas to 3 of the user's life domains.`,
      },
    ],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  return JSON.parse(cleaned) as InsightOutput;
}
