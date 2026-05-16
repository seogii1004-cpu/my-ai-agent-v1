import Anthropic from "@anthropic-ai/sdk";
import { BookRecord, Preferences, RecommenderOutput } from "../types";

const SYSTEM_PROMPT = `You are a book recommender agent. Respond ONLY with valid JSON, no markdown.

Rules:
- max 3 recommendations
- concise reasoning only (Korean preferred)
- avoid generic bestsellers
- prioritize intellectual continuity
- connect recommendations to current interests

Output schema:
{
  "recommendations": [
    { "title": "", "author": "", "reason": "", "score": 0.0 }
  ]
}`;

export async function runRecommender(
  client: Anthropic,
  history: BookRecord[],
  prefs: Preferences
): Promise<RecommenderOutput> {
  const recentBooks = history.slice(-5).map((b) => b.book);
  const input = {
    reading_interests: prefs.reading_interests,
    favorite_genres: prefs.favorite_genres,
    reading_goals: prefs.reading_goals,
    professional_interests: prefs.professional_interests,
    recent_books: recentBooks,
  };

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Recommend books based on this profile: ${JSON.stringify(input)}`,
      },
    ],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  return JSON.parse(cleaned) as RecommenderOutput;
}
