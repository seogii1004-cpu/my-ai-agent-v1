import Anthropic from "@anthropic-ai/sdk";
import { loadReadingHistory, loadPreferences } from "../memory/memory-manager";
import { runRecommender } from "./recommender-agent";
import { runInsight } from "./insight-agent";
import { runMemory } from "./memory-agent";
import { runTrend } from "./trend-agent";
import { WeeklyBriefing } from "../types";

const SYSTEM_PROMPT = `You are the main reading agent orchestrator. Respond ONLY with valid JSON, no markdown.

Your job: generate a concise weekly reading briefing header in Korean.

Output schema:
{
  "date": "YYYY-MM-DD",
  "weekly_summary": ["string", "string"],
  "today_recommendation": { "book": "", "author": "", "reason": "" },
  "action_items": ["string", "string"]
}

Rules:
- weekly_summary: 2 sentences capturing the week's intellectual theme
- action_items: 2 practical actions for this week
- All text in Korean, keep concise`;

export async function runMainAgent(client: Anthropic): Promise<WeeklyBriefing> {
  const history = loadReadingHistory();
  const prefs = loadPreferences();

  console.log("[main-agent] Running recommender-agent...");
  const recommenderOutput = await runRecommender(client, history, prefs);
  const topRec = recommenderOutput.recommendations[0];

  console.log("[main-agent] Running sub-agents in parallel...");
  const [insights, memory, trends] = await Promise.all([
    runInsight(client, topRec.title, topRec.author, prefs),
    runMemory(client, history),
    runTrend(client, topRec.title, topRec.author, prefs.professional_interests),
  ]);
  console.log("[main-agent] All sub-agents completed.");

  const today = new Date().toISOString().split("T")[0];

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Generate this week's briefing header.
Date: ${today}
Top recommendation: "${topRec.title}" by ${topRec.author}
Reason: ${topRec.reason}
User reading interests: ${prefs.reading_interests.join(", ")}`,
      },
    ],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  const header = JSON.parse(cleaned);

  // Discussion은 주간 브리핑에 포함하지 않음 — 책 완독 후 봇과 실시간 토론
  return { ...header, discussion: null, insights, memory, trends } as WeeklyBriefing;
}
