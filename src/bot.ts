import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";
import axios from "axios";
import { ConversationManager } from "./discussion/conversation-manager";

const TELEGRAM_API = "https://api.telegram.org";
const TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const ALLOWED_CHAT_ID = process.env.TELEGRAM_CHAT_ID!;

const FINISH_TRIGGERS = ["다 읽었어", "완독했어", "읽었어", "읽었다", "끝냈어", "다 봤어", "완독"];
const END_TRIGGERS = ["토론 끝", "토론끝", "그만할게", "끝낼게", "그만", "/end", "/stop"];

interface TelegramUpdate {
  update_id: number;
  message?: {
    chat: { id: number };
    text?: string;
  };
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const manager = new ConversationManager(client);

async function send(text: string): Promise<void> {
  await axios.post(
    `${TELEGRAM_API}/bot${TOKEN}/sendMessage`,
    { chat_id: ALLOWED_CHAT_ID, text, parse_mode: "Markdown" },
    { timeout: 15000 }
  );
}

function detectFinish(text: string): boolean {
  return FINISH_TRIGGERS.some((t) => text.includes(t));
}

function detectEnd(text: string): boolean {
  const normalized = text.replace(/\s+/g, " ").trim();
  return END_TRIGGERS.some((t) => normalized.includes(t));
}

function extractBook(text: string): string {
  let cleaned = text;
  for (const trigger of [...FINISH_TRIGGERS].sort((a, b) => b.length - a.length)) {
    cleaned = cleaned.replace(new RegExp(trigger, "g"), "");
  }
  return cleaned.replace(/[!?.,~:]/g, "").trim();
}

async function handleMessage(text: string): Promise<void> {
  try {
    // 1. 토론 종료
    if (detectEnd(text)) {
      if (manager.hasActiveSession()) {
        await send("토론을 정리할게요... 잠깐만요 🤔");
        const summary = await manager.endSession();
        await send(summary);
      } else {
        await send("진행 중인 토론이 없어요.");
      }
      return;
    }

    // 2. 책 이름 대기 중 (이전에 책 이름을 못 받았을 때)
    if (manager.waitingForBook) {
      const bookName = text.replace(/[!?.,~:]/g, "").trim();
      if (bookName) {
        await send("토론 시작할게요... 🎙");
        const opening = await manager.startSession(bookName);
        await send(opening);
      }
      return;
    }

    // 3. 완독 감지
    if (detectFinish(text)) {
      const bookName = extractBook(text);
      if (!bookName) {
        manager.waitingForBook = true;
        await send("어떤 책을 완독하셨나요? 제목을 알려주세요 📖");
        return;
      }
      await send("토론 시작할게요... 🎙");
      const opening = await manager.startSession(bookName);
      await send(opening);
      return;
    }

    // 4. 토론 진행 중
    if (manager.hasActiveSession()) {
      const reply = await manager.reply(text);
      await send(reply);
      return;
    }

    // 5. 도움말
    await send(
      "📚 *북클럽 AI*\n\n" +
        "책을 다 읽으면:\n" +
        "→ _\"[책 제목] 읽었어\"_ 또는 _\"다 읽었어 [책 제목]\"_\n\n" +
        "토론 종료:\n" +
        '→ _"토론 끝"_ 또는 _"/end"_'
    );
  } catch (err) {
    console.error("[bot] handleMessage 오류:", err);
    try {
      await send("⚠️ 오류가 발생했어요. 잠시 후 다시 시도해주세요.");
    } catch {
      // ignore send failure
    }
  }
}

async function poll(): Promise<void> {
  let offset = 0;
  console.log("[bot] 북클럽 AI 시작 — 메시지 대기 중 💬");

  while (true) {
    try {
      const url = `${TELEGRAM_API}/bot${TOKEN}/getUpdates?offset=${offset}&timeout=20`;
      const { data } = await axios.get<{ result: TelegramUpdate[] }>(url, { timeout: 30000 });

      for (const update of data.result) {
        offset = update.update_id + 1;
        const msg = update.message;
        if (!msg?.text) continue;
        if (msg.chat.id.toString() !== ALLOWED_CHAT_ID) continue;

        console.log(`[bot] 수신: "${msg.text}"`);
        await handleMessage(msg.text);
      }
    } catch (err) {
      console.error("[bot] 오류:", err);
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
}

poll();
