import Anthropic from "@anthropic-ai/sdk";
import { InsightOutput, Preferences } from "../types";

const SYSTEM_PROMPT = `You are an insight extractor. Respond ONLY with valid JSON, no markdown.

Your job: find how this book's core ideas connect to what the user actually reads for.

Rules:
- Generate exactly 3 insights across these lenses (pick the most relevant):
  • 삶의 지혜 — practical wisdom for daily life and personal growth
  • 경제/재테크 — economic thinking, financial mindset, value creation
  • 명상/마음챙김 — inner clarity, emotional regulation, presence
  • AI/기술 — connections to software engineering, systems thinking, AI trends
- Each insight must be specific to THIS book, not generic advice
- application: how the book's idea maps to this lens (1 sentence, concrete)
- action: one thing to actually try this week (1 sentence, specific)
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
독서 목적: ${prefs.reading_goals.join(", ")}
관심 분야: ${prefs.reading_interests.join(", ")}
직업: ${prefs.profession} (관심: ${prefs.professional_interests.join(", ")})

이 책의 핵심 아이디어를 위의 렌즈 중 가장 연결되는 3가지 관점에서 인사이트를 추출해주세요.`,
      },
    ],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  return JSON.parse(cleaned) as InsightOutput;
}
