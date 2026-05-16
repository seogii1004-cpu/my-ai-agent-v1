import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";
import axios from "axios";
import fs from "fs";
import path from "path";

const TELEGRAM_API = "https://api.telegram.org";
const TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID!;
const LAST_READ_FILE = path.resolve(__dirname, "../memory/last-read.json");

interface LastRead {
  lastCompletedAt: string;
  lastBook: string;
}

async function send(text: string): Promise<void> {
  await axios.post(
    `${TELEGRAM_API}/bot${TOKEN}/sendMessage`,
    { chat_id: CHAT_ID, text, parse_mode: "Markdown" },
    { timeout: 15000 }
  );
}

function readLastRead(): LastRead | null {
  if (!fs.existsSync(LAST_READ_FILE)) return null;
  return JSON.parse(fs.readFileSync(LAST_READ_FILE, "utf-8"));
}

function daysSince(dateStr: string): number {
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

async function generateNudge(days: number, lastBook: string | null): Promise<string> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const ctx = lastBook
    ? `마지막으로 읽은 책: "${lastBook}" (${days}일 전 완독)`
    : `최근 완독 기록 없음 (${days}일 이상)`;

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 200,
    messages: [
      {
        role: "user",
        content: `독서 알림 메시지를 딱 하나만 만들어주세요.

상황: ${ctx}
독자의 관심사: 골프, 프리다이빙, 강아지 키우기, 독서

조건:
- 2-3문장, 짧고 임팩트 있게
- 재치 있고 약간 장난스럽게 독촉하는 톤
- 관심사 중 하나에 비유해서
- 이모지 1-2개
- 인사말 없이 바로 본론`,
      },
    ],
  });

  return response.content[0].type === "text"
    ? response.content[0].text
    : `📚 벌써 ${days}일째 책을 안 읽고 계시네요. 슬슬 다음 책 시작해볼까요?`;
}

async function main(): Promise<void> {
  const lastRead = readLastRead();

  const days = lastRead ? daysSince(lastRead.lastCompletedAt) : 999;
  const lastBook = lastRead?.lastBook ?? null;

  if (days < 7) {
    console.log(`[nudge] 마지막 완독 ${days}일 전 — 알림 불필요`);
    return;
  }

  console.log(`[nudge] ${days}일간 완독 없음 — 독촉 메시지 발송`);
  const message = await generateNudge(days, lastBook);
  await send(message);
  console.log(`[nudge] 발송 완료`);
}

main().catch(console.error);
