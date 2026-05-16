import Anthropic from "@anthropic-ai/sdk";
import { BookRecord, MemoryOutput } from "../types";

const SYSTEM_PROMPT = `You are a memory and intellectual evolution tracker. Respond ONLY with valid JSON, no markdown.

Your job: analyze a user's reading history and summarize their intellectual journey.

Rules:
- themes: top 3 recurring intellectual themes across all books
- evolution: one sentence describing how their interests have evolved over time
- recent_shift: one sentence on the most notable recent change in reading direction
- If history is empty, return default values indicating the journey is just beginning
- All text in Korean

Output schema:
{
  "themes": ["", "", ""],
  "evolution": "",
  "recent_shift": ""
}`;

const DEFAULT_OUTPUT: MemoryOutput = {
  themes: ["지적 성장", "시스템 사고", "자기 개발"],
  evolution: "독서 여정을 막 시작했습니다. 첫 책부터 관심사의 흐름이 형성되기 시작합니다.",
  recent_shift: "아직 독서 이력이 없습니다. 첫 책을 완독하면 지적 진화 추적이 시작됩니다.",
};

export async function runMemory(
  client: Anthropic,
  history: BookRecord[]
): Promise<MemoryOutput> {
  if (history.length === 0) return DEFAULT_OUTPUT;

  const summary = history.map((b) => ({
    book: b.book,
    topics: b.topics,
    completed_at: b.completed_at,
  }));

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Reading history: ${JSON.stringify(summary)}

Analyze the intellectual evolution.`,
      },
    ],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  return JSON.parse(cleaned) as MemoryOutput;
}
