import Anthropic from "@anthropic-ai/sdk";
import { saveSummary } from "./summary-store";

const SYSTEM_PROMPT = `당신은 '북클럽 AI'입니다 — 지적 긴장을 유지하는 독서 토론 파트너입니다.

핵심 원칙:
- 사용자 의견에 바로 동의하지 마세요. 토론의 긴장감을 유지하세요.
- 매 응답마다 날카로운 후속 질문 하나를 반드시 던지세요.
- 철학자, 심리학자, 엔지니어, 사업가 관점을 자연스럽게 전환하며 토론하세요.
- 소크라테스식으로: 직접 답을 주지 말고 질문으로 사고를 자극하세요.
- 응답은 3-5문장으로 간결하게 (텔레그램 메시지).
- 한국어로 대화하세요.
- 때로는 의도적으로 반대 입장을 취해 사용자를 자극하세요.`;

const SUMMARY_SYSTEM = `당신은 독서 토론 요약 전문가입니다. 주어진 토론 내용을 분석해 한국어로 요약하세요.`;

const SUMMARY_REQUEST = `지금까지의 토론을 다음 형식으로 요약해주세요:

📝 *토론 요약*

📖 *책*: [제목]

⚔️ *핵심 쟁점*
• [쟁점 1]
• [쟁점 2]

💭 *당신의 주요 입장*
[사용자가 표명한 핵심 관점]

💡 *새로운 시각*
[토론을 통해 드러난 통찰]

📚 *다음 추천 책*
[이 토론과 연결되는 책 1권 + 한줄 이유]`;

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Session {
  book: string;
  messages: Message[];
  startedAt: Date;
}

export class ConversationManager {
  private session: Session | null = null;
  public waitingForBook = false;

  constructor(private client: Anthropic) {}

  hasActiveSession(): boolean {
    return this.session !== null;
  }

  async startSession(book: string): Promise<string> {
    this.waitingForBook = false;
    this.session = { book, messages: [], startedAt: new Date() };

    const response = await this.client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `나 방금 "${book}" 다 읽었어. 핵심 주장에 대한 도발적인 질문 하나로 토론을 시작해줘.`,
        },
      ],
    });

    const reply = response.content[0].type === "text" ? response.content[0].text : "";
    this.session.messages.push({ role: "user", content: `"${book}" 다 읽었어.` });
    this.session.messages.push({ role: "assistant", content: reply });

    return `📚 *${book}* 완독 축하드려요\\!\n\n${reply}`;
  }

  async reply(userMessage: string): Promise<string> {
    if (!this.session) throw new Error("No active session");

    this.session.messages.push({ role: "user", content: userMessage });

    const response = await this.client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: this.session.messages,
    });

    const reply = response.content[0].type === "text" ? response.content[0].text : "";
    this.session.messages.push({ role: "assistant", content: reply });
    return reply;
  }

  async endSession(): Promise<string> {
    if (!this.session) return "진행 중인 토론이 없어요.";

    const response = await this.client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: SUMMARY_SYSTEM,
      messages: [
        ...this.session.messages,
        { role: "user", content: SUMMARY_REQUEST },
      ],
    });

    const summary = response.content[0].type === "text" ? response.content[0].text : "";
    const { book, startedAt } = this.session;
    this.session = null;

    saveSummary(book, startedAt, summary);
    return summary;
  }
}
