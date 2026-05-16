import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";
import { runMainAgent } from "./agents/main-agent";
import { sendMessage, formatBriefing } from "./utils/telegram";

async function main() {
  console.log("[index] Starting weekly reading briefing...");

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const briefing = await runMainAgent(client);
  console.log("[index] Briefing generated:", JSON.stringify(briefing, null, 2));

  const message = formatBriefing(briefing);
  await sendMessage(message);

  console.log("[index] Weekly briefing sent to Telegram.");
}

main().catch((err) => {
  console.error("[index] Fatal error:", err);
  process.exit(1);
});
