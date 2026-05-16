import { WeeklyBriefing } from "../types";

const TELEGRAM_API = "https://api.telegram.org";
const MAX_LENGTH = 4000;

async function sendSingle(token: string, chatId: string, text: string): Promise<void> {
  const resp = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Telegram API error: ${err}`);
  }
}

export async function sendMessage(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) throw new Error("TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID must be set");

  // Split into chunks if message exceeds Telegram limit
  if (text.length <= MAX_LENGTH) {
    await sendSingle(token, chatId, text);
    return;
  }

  const parts = [];
  let remaining = text;
  while (remaining.length > 0) {
    let chunk = remaining.slice(0, MAX_LENGTH);
    const lastNewline = chunk.lastIndexOf("\n");
    if (lastNewline > MAX_LENGTH * 0.8) chunk = chunk.slice(0, lastNewline);
    parts.push(chunk);
    remaining = remaining.slice(chunk.length);
  }

  for (const part of parts) {
    await sendSingle(token, chatId, part);
    await new Promise((r) => setTimeout(r, 500));
  }
}

export function formatBriefing(b: WeeklyBriefing): string {
  const rec = b.today_recommendation;
  const ins = b.insights;
  const mem = b.memory;
  const trnd = b.trends;

  return [
    `📚 *이번 주 독서 브리핑 — ${b.date}*`,
    "",
    "*📌 이번 주 테마*",
    ...b.weekly_summary.map((s) => `• ${s}`),
    "",
    "*📖 이번 주 추천 책*",
    `_${rec.book}_ — ${rec.author}`,
    `→ ${rec.reason}`,
    "",
    "💬 책을 다 읽으면 _\"[책 제목] 읽었어\"_ 라고 보내주세요 — 실시간 토론을 시작해드립니다!",
    "",
    "━━━━━━━━━━━━━━━━━━━",
    "*💡 실생활 인사이트*",
    ...ins.insights.flatMap((i) => [
      `*${i.domain}*`,
      `${i.application}`,
      `→ ${i.action}`,
      "",
    ]),
    "━━━━━━━━━━━━━━━━━━━",
    "*🧠 지적 진화 추적*",
    `주요 테마: ${mem.themes.join(" · ")}`,
    `흐름: ${mem.evolution}`,
    `최근 변화: ${mem.recent_shift}`,
    "",
    "━━━━━━━━━━━━━━━━━━━",
    "*🌐 트렌드 연결*",
    ...trnd.trend_connections.flatMap((t) => [`*${t.trend}*`, t.relevance, ""]),
    `💭 ${trnd.emerging_idea}`,
    "",
    "━━━━━━━━━━━━━━━━━━━",
    "*✅ 이번 주 액션 아이템*",
    ...b.action_items.map((a) => `• ${a}`),
  ].join("\n");
}
