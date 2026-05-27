import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";
import axios from "axios";
import { ConversationManager } from "./discussion/conversation-manager";
import { saveCurrentlyReading, saveBookRatingWithResult } from "./memory/memory-manager";

const TELEGRAM_API = "https://api.telegram.org";
const TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const ALLOWED_CHAT_ID = process.env.TELEGRAM_CHAT_ID!;

const FINISH_TRIGGERS = ["다 읽었어", "완독했어", "읽었어", "읽었다", "끝냈어", "다 봤어", "완독"];
const END_TRIGGERS = ["토론 끝", "토론끝", "그만할게", "끝낼게", "그만", "/end", "/stop"];
const START_TRIGGERS = ["읽기 시작", "읽는 중", "읽고 있어", "읽고 있는", "시작했어", "시작할게", "/start"];

interface TelegramUpdate {
  update_id: number;
  message?: {
    chat: { id: number };
    text?: string;
  };
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const manager = new ConversationManager(client);
let waitingForStartBook = false;
let waitingForRating: string | null = null; // 별점 대기 중인 책 제목
let currentBookName: string | null = null;

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

function detectStart(text: string): boolean {
  return START_TRIGGERS.some((t) => text.includes(t));
}

function extractBook(text: string): string {
  let cleaned = text;
  for (const trigger of [...FINISH_TRIGGERS].sort((a, b) => b.length - a.length)) {
    cleaned = cleaned.replace(new RegExp(trigger, "g"), "");
  }
  return cleaned.replace(/[!?.,~:]/g, "").trim();
}

function parseRating(text: string): number | null {
  const match = text.match(/[1-5]/);
  return match ? parseInt(match[0]) : null;
}

function extractStartBook(text: string): string {
  let cleaned = text;
  for (const trigger of [...START_TRIGGERS].sort((a, b) => b.length - a.length)) {
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
        if (currentBookName) {
          waitingForRating = currentBookName;
          await send(`⭐ *${currentBookName}* 별점을 남겨주세요\\! (1\\~5점)`);
        }
      } else {
        await send("진행 중인 토론이 없어요.");
      }
      return;
    }

    // 1-1. 별점 입력 대기 중
    if (waitingForRating) {
      const rating = parseRating(text);
      if (rating) {
        const stars = "⭐".repeat(rating);
        const { reading_days } = saveBookRatingWithResult(waitingForRating, rating);
        waitingForRating = null;
        const daysMsg = reading_days ? ` \\(${reading_days}일 동안 읽으셨네요\\)` : "";
        await send(`${stars} *${rating}점* 저장했어요\\!${daysMsg} 다음 책도 기대할게요 📚`);
      } else {
        await send("1\\~5 사이 숫자로 입력해주세요.");
      }
      return;
    }

    // 2. 책 시작 이름 대기 중
    if (waitingForStartBook) {
      const bookName = text.replace(/[!?.,~:]/g, "").trim();
      if (bookName) {
        waitingForStartBook = false;
        saveCurrentlyReading(bookName);
        await send(`📖 *${bookName}* 을\\(를\\) 읽기 시작했습니다\\!\n다 읽으셨으면 _"${bookName} 다 읽었어"_ 라고 알려주세요 😊`);
      }
      return;
    }

    // 3. 책 시작 감지
    if (detectStart(text)) {
      const bookName = extractStartBook(text);
      if (!bookName) {
        waitingForStartBook = true;
        await send("어떤 책 읽기 시작하셨나요? 제목을 알려주세요 📖");
        return;
      }
      saveCurrentlyReading(bookName);
      await send(`📖 *${bookName}* 을\\(를\\) 읽기 시작했습니다\\!\n다 읽으셨으면 _"${bookName} 다 읽었어"_ 라고 알려주세요 😊`);
      return;
    }

    // 4. 책 이름 대기 중 (완독 후 제목을 못 받았을 때)
    if (manager.waitingForBook) {
      const bookName = text.replace(/[!?.,~:]/g, "").trim();
      if (bookName) {
        await send("토론 시작할게요... 🎙");
        currentBookName = bookName;
        const opening = await manager.startSession(bookName);
        await send(opening);
      }
      return;
    }

    // 5. 완독 감지
    if (detectFinish(text)) {
      const bookName = extractBook(text);
      if (!bookName) {
        manager.waitingForBook = true;
        await send("어떤 책을 완독하셨나요? 제목을 알려주세요 📖");
        return;
      }
      await send("토론 시작할게요... 🎙");
      currentBookName = bookName;
      const opening = await manager.startSession(bookName);
      await send(opening);
      return;
    }

    // 6. 토론 진행 중
    if (manager.hasActiveSession()) {
      const reply = await manager.reply(text);
      await send(reply);
      return;
    }

    // 7. 도움말
    await send(
      "📚 *북클럽 AI*\n\n" +
        "책 시작:\n" +
        "→ _\"[책 제목] 읽기 시작했어\"_ 또는 _\"/start\"_\n\n" +
        "책 완독:\n" +
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
