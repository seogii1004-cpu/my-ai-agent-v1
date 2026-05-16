import Anthropic from "@anthropic-ai/sdk";
import { TrendOutput } from "../types";

const SYSTEM_PROMPT = `You are a trend connector agent. Respond ONLY with valid JSON, no markdown.

Your job: connect a book's ideas to current movements in AI, technology, and knowledge work.

Rules:
- trend_connections: exactly 2 connections between the book and current trends
- trend: name of the current trend or movement (concise)
- relevance: why this book is relevant to that trend right now (1-2 sentences)
- emerging_idea: one forward-looking idea that combines this book with where technology is heading
- All text in Korean

Output schema:
{
  "trend_connections": [
    { "trend": "", "relevance": "" }
  ],
  "emerging_idea": ""
}`;

export async function runTrend(
  client: Anthropic,
  book: string,
  author: string,
  interests: string[]
): Promise<TrendOutput> {
  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 768,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Book: "${book}" by ${author}
User's technical interests: ${interests.join(", ")}

Connect this book to current trends in AI and technology.`,
      },
    ],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  return JSON.parse(cleaned) as TrendOutput;
}
