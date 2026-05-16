# 나만의 AI 독서 에이전트 만들기 — 일주일에 한 권, AI가 추천하다

> Claude Code와 Anthropic SDK로 만드는 개인 지식 성장 시스템 구축기

---

## 들어가며

책을 좋아하지만 다음에 무엇을 읽을지 고민하는 시간이 아깝다고 느낀 적 있으신가요?  
저는 그 고민을 AI에게 넘기기로 했습니다.

단순한 책 추천 앱이 아닙니다. 제 관심사와 독서 이력을 기억하고, 매주 월요일 아침 텔레그램으로 이번 주의 독서 브리핑을 보내주는 **나만의 AI 독서 동반자**를 만들었습니다.

이 글은 그 과정을 처음부터 끝까지 기록한 개발 일지입니다.

---

## 왜 만들었는가

독서는 좋은데, 다음 책을 고르는 일은 의외로 에너지가 많이 드는 결정이었습니다.  
베스트셀러 목록을 뒤적이다 결국 예전에 읽은 것과 비슷한 책을 고르거나,  
아예 선택 피로로 읽기를 미루는 경우도 많았습니다.

그래서 떠올린 아이디어:

> **"내 관심사를 알고, 독서 이력을 기억하며, 매일 아침 최적의 책을 추천해주는 AI가 있다면?"**

단순 추천을 넘어, 책의 아이디어를 실생활과 연결하고, 지적 토론 질문까지 던져주는 시스템. 이것이 이 프로젝트의 출발점이었습니다.

---

## 시스템 설계

처음부터 거대하게 만들려 하지 않았습니다. MVP 원칙 — 가장 작은 단위로 동작하는 것부터.

### 전체 아키텍처

```
Morning Scheduler (cron)
        ↓
  Main Reading Agent        ← 오케스트레이터
        ↓
  Recommender Agent         ← 책 추천 서브 에이전트
        ↓
  Daily Briefing 생성
        ↓
  Telegram 전송
```

### 에이전트 역할 분리

| 에이전트 | 역할 | 모델 |
|---|---|---|
| Main Agent | 오케스트레이션, 브리핑 생성 | claude-sonnet-4-6 |
| Recommender Agent | 관심사 기반 책 추천 | claude-haiku-4-5 |

메인 에이전트는 오케스트레이터로서 서브 에이전트를 호출하고 결과를 종합합니다.  
서브 에이전트는 각자의 역할에 집중하며 JSON으로만 소통합니다.

### 프로젝트 구조

```
my-ai-agent-v1/
├── src/
│   ├── agents/
│   │   ├── main-agent.ts        ← 메인 오케스트레이터
│   │   └── recommender-agent.ts ← 독서 추천 서브 에이전트
│   ├── memory/
│   │   └── memory-manager.ts    ← 독서 이력 관리
│   ├── utils/
│   │   └── telegram.ts          ← 텔레그램 알림
│   ├── types.ts
│   └── index.ts
├── memory/
│   ├── reading-history.json     ← 독서 이력 저장소
│   └── preferences.json         ← 사용자 관심사
└── doc/
    └── reading_blog.md          ← 이 글
```

---

## 기술 스택 선택

- **Language**: TypeScript + Node.js — 타입 안정성과 생태계
- **AI**: Anthropic SDK (`@anthropic-ai/sdk`) — Claude 모델 직접 호출
- **Notification**: Telegram Bot API — 개인용으로 설정이 가장 간단
- **Memory**: JSON 파일 — Phase 1에서는 단순하게, 나중에 DB로 확장
- **Scheduler**: cron (WSL Ubuntu) — 매일 정해진 시간 자동 실행

---

## 구현 과정

### Step 1 — 프로젝트 초기화

TypeScript 프로젝트를 세팅하고 Anthropic SDK를 설치했습니다.

```bash
npm init -y
npm install @anthropic-ai/sdk dotenv
npm install -D typescript ts-node @types/node
```

환경 변수는 `.env` 파일로 관리합니다.

```
ANTHROPIC_API_KEY=sk-ant-...
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...
```

### Step 2 — 에이전트 간 통신 규칙 정의

에이전트끼리는 자연어가 아닌 **JSON으로만 소통**합니다.  
이 원칙은 토큰 낭비를 줄이고, 파싱 오류를 최소화합니다.

```typescript
// types.ts — 공유 데이터 모델
export interface Recommendation {
  title: string;
  author: string;
  reason: string;
  score: number;
}

export interface DailyBriefing {
  date: string;
  daily_briefing: string[];
  today_recommendation: { book: string; author: string; reason: string };
  discussion_prompt: string;
  action_items: string[];
}
```

### Step 3 — Recommender Agent 구현

관심사와 최근 독서 이력을 입력받아 책 3권을 추천합니다.  
Haiku 모델을 사용해 속도와 비용을 최적화했습니다.

```typescript
// recommender-agent.ts (핵심 부분)
const message = await client.messages.create({
  model: "claude-haiku-4-5-20251001",
  max_tokens: 512,
  system: `You are a book recommender. Respond ONLY with valid JSON, no markdown.`,
  messages: [{ role: "user", content: `Recommend books based on: ${JSON.stringify(input)}` }],
});
```

**트러블슈팅**: 모델이 JSON을 마크다운 코드블록으로 감싸서 반환하는 문제가 있었습니다.  
간단한 정규식으로 해결했습니다.

```typescript
const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
return JSON.parse(cleaned);
```

### Step 4 — Main Agent 구현

Recommender Agent 결과를 받아 한국어 일일 브리핑을 생성합니다.  
Sonnet 모델로 더 풍부한 인사이트를 만듭니다.

```typescript
// main-agent.ts (흐름)
const history = loadReadingHistory();       // 1. 메모리 로드
const prefs = loadPreferences();            // 2. 관심사 로드
const recommenderOutput = await runRecommender(client, history, prefs);  // 3. 서브 에이전트 호출
const briefing = await generateBriefing(client, recommenderOutput);      // 4. 브리핑 생성
```

### Step 5 — Telegram 알림

BotFather로 봇을 만들고, Chat ID를 얻어서 메시지를 전송합니다.

```typescript
// telegram.ts (핵심)
await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
});
```

### Step 6 — Discussion Agent 구현

이 에이전트가 이 프로젝트의 핵심입니다. 단순한 추천을 넘어, 책의 아이디어를 여러 관점에서 비판적으로 토론하는 경험을 제공합니다.

**설계 철학**: 6개의 페르소나 풀에서 매주 3개를 랜덤하게 선택해 다양한 시각을 유지합니다.

```typescript
const PERSONAS = [
  "CTO / 시스템 설계자",
  "심리학자",
  "철학자",
  "스타트업 창업자",
  "행동경제학자",
  "Naval Ravikant 스타일 사상가",
];
```

Discussion Agent의 출력 구조:

```json
{
  "discussion_questions": ["...", "..."],
  "debate": [
    { "persona": "철학자", "perspective": "..." },
    { "persona": "심리학자", "perspective": "..." },
    { "persona": "Naval 스타일 사상가", "perspective": "..." }
  ],
  "key_tensions": ["...", "..."]
}
```

**트러블슈팅**: 한국어 토론 텍스트가 풍부해질수록 토큰 한도(1024)를 초과했습니다. Discussion Agent만 `max_tokens: 2048`로 늘려서 해결했습니다.

실제로 생성된 토론 예시 (Thinking in Systems):

```
[철학자]
미도우스의 시스템 사고는 결정론적 세계관을 정교하게 포장한 것에 불과하다.
시스템이 모든 것을 설명한다면, 우리는 윤리적 행위자가 아니라 시스템의 출력물일 뿐이다.

[심리학자]
지식과 행동 사이의 간극을 메우지 못한다면, 시스템 사고는 지적 유희에 그친다.

[Naval 스타일 사상가]
레버리지 포인트를 이해하는 자는 시스템을 개혁하려 하지 않고 그것 밖으로 나간다.
시스템을 고치려는 욕망 자체가 당신이 아직 그 안에 갇혀 있다는 증거다.
```

### Step 7 — Insight Agent 구현

책의 아이디어를 실생활 도메인에 연결합니다. 저의 경우: 골프, 프리다이빙, 강아지 키우기, 데일리 코디.

```typescript
// preferences.json에 life_domains 추가
{
  "life_domains": ["골프", "프리다이빙", "강아지 키우기", "데일리 코디"]
}
```

실제로 생성된 연결 예시 (Thinking, Fast and Slow):
```
[골프] 티샷 전 3초간 의도적으로 멈춰 풍향·거리·클럽을 분석 — System 2 작동
[프리다이빙] 수심 진입 전 '최악의 시나리오 3가지' 심리 시뮬레이션
[데일리 코디] 상황별 기본 코디 3세트 템플릿으로 결정 피로 제거
```

### Step 8 — Memory Agent 구현

독서 이력을 분석해 지적 진화를 추적합니다. 이력이 없을 땐 기본값을 반환해 graceful하게 처리합니다.

```typescript
// 이력이 비어있을 때 API 호출 없이 바로 반환
if (history.length === 0) return DEFAULT_OUTPUT;
```

책이 쌓일수록 이런 분석이 가능해집니다:
```json
{
  "themes": ["AI 설계", "인지심리학", "시스템 사고"],
  "evolution": "기술 중심 독서에서 인간의 사고 구조와 철학으로 관심이 이동하고 있습니다.",
  "recent_shift": "최근 3개월간 AI 에이전트와 인간 인지의 교차점에 집중하는 경향이 강화됩니다."
}
```

### Step 9 — Trend Agent 구현

책을 현재 AI·기술 트렌드와 연결합니다. Haiku 모델로 속도와 비용을 최적화했습니다.

```typescript
// 트렌드 연결 예시
{
  "trend": "AI 의사결정 시스템과 인지편향 완화",
  "relevance": "카너먼의 이중 프로세싱 이론이 LLM 에이전트 신뢰성 향상의 이론적 기초가 됩니다."
}
```

### Step 10 — 병렬 실행 최적화

Recommender가 끝나면 나머지 4개 에이전트를 **동시에** 실행합니다. 순차 실행 대비 약 3배 빠릅니다.

```typescript
// main-agent.ts — 핵심 최적화
const [discussion, insights, memory, trends] = await Promise.all([
  runDiscussion(client, topRec.title, topRec.author, topRec.reason),
  runInsight(client, topRec.title, topRec.author, prefs),
  runMemory(client, history),
  runTrend(client, topRec.title, topRec.author, prefs.interests),
]);
```

### Step 11 — Cron 자동화

매주 월요일 아침 8시에 자동 실행되도록 WSL cron을 설정했습니다.

```bash
0 8 * * 1 /bin/bash -c 'source /home/jooseok/.nvm/nvm.sh && cd /home/jooseok/code/my-ai-agent-v1 && npm start >> /home/jooseok/code/my-ai-agent-v1/logs/cron.log 2>&1'
```

---

## 실제 결과물

매주 월요일 아침 8시, 텔레그램으로 이런 메시지가 도착합니다.

```
📚 이번 주 독서 브리핑 - 2026-05-16

📌 이번 주 요약
• 이번 주 핵심 테마는 '시스템 사고'입니다.
• 심리학과 철학적 관점을 시스템 사고와 연결하면 더 깊은 통찰을 얻을 수 있습니다.

📖 이번 주 추천 책
Thinking in Systems — Donella H. Meadows
→ 피드백 루프와 레버리지 포인트를 이해하면 AI 에이전트 설계에 직접 적용 가능

─────────────────────
🎙 토론 클럽

❓ 토론 질문
1. AI가 복잡한 시스템에 개입할 때, 레버리지 포인트 식별 행위 자체가 시스템을 변형시키지 않는가?
2. '자기 조직화'가 맞다면, AI 시스템을 설계한다는 개념 자체가 근본적 오류인가?

🎭 페르소나 토론
[철학자]
시스템 사고는 결정론을 정교하게 포장한 것. 인간은 행위자가 아니라 출력물일 뿐인가?

[심리학자]
지식과 행동 사이의 간극을 메우지 못한다면 시스템 사고는 지적 유희에 그친다.

[Naval 스타일 사상가]
레버리지 포인트를 이해하는 자는 시스템 밖으로 나간다. 고치려는 욕망 자체가 갇혀 있다는 증거다.

⚡ 핵심 긴장
• 복잡성을 인정하면서도 의도적 개입이 가능하다는 주장 — 이 둘은 양립하는가?
• 설계 목표와 실제 최적화 목표의 분리 — AI 정렬 문제의 공백

─────────────────────
✅ 이번 주 액션 아이템
• 1~3장 읽고 피드백 루프 개념을 현재 프로젝트에 적용해 노트 정리
• 시스템 다이어그램 하나 직접 그려보기
```

---

## 실제 독서 이력으로 첫 분석

84권의 독서 이력을 `reading-history.json`에 입력하자, Memory Agent가 처음으로 실제 데이터 기반 분석을 내놓았습니다.

```
주요 테마
• 심리학과 자기치유를 통한 내면 성장
• 철학적 사유와 실존주의적 인생 탐구
• 기술과 AI에 대한 실용적 이해

지적 진화
초기의 자존감·관계 개선 자기계발 → 영성·철학으로 깊어짐
→ 최근 문학·미스터리·AI 기술로 다각화

최근 변화
2024년 중반 이후 자기계발 중심에서 벗어나 국내외 문학,
미스터리 추리소설, AI·기술 분야로 독서 범위를 크게 확장
```

단 84권의 데이터만으로 3년 간의 지적 여정을 한눈에 정리해준다는 게 인상적이었습니다.  
책이 쌓일수록 이 분석은 점점 더 정밀해집니다.

---

## 토론을 실시간 대화로 — 북클럽 AI 봇

처음엔 Discussion Agent가 주간 브리핑에 포함된 일방적 출력이었습니다.  
하지만 이것은 근본적으로 잘못된 구조였습니다. **토론은 혼자 하는 게 아니니까요.**

그래서 Discussion을 완전히 분리했습니다.

**새로운 플로우:**
```
매주 월요일 08:00          → 주간 브리핑 (추천 + 인사이트 + 트렌드)
책을 다 읽으면 (언제든지)  → 텔레그램에 "다 읽었어" 전송
                           → 북클럽 AI 봇이 실시간 토론 시작
```

**실제 대화 예시:**
```
나: "Thinking in Systems 다 읽었어!"
봇: "완독 축하드려요! 📚
     메도우스는 레버리지 포인트를 '가장 강력한 개입점'이라고 했지만,
     AI 에이전트가 그 지점을 인간보다 더 정확히 찾는다면,
     인간의 시스템 사고는 오히려 장애물이 되는 건 아닐까요?"

나: "저는 그보다 피드백 루프 지연이 더 흥미로웠어요"
봇: "[심리학자 관점] 흥미롭네요. 그런데 지연을 '인식'한다고 해서
     행동이 달라지지 않는다는 게 수십 년 연구의 결론인데,
     당신은 이 책을 읽은 후 실제로 무언가를 바꿨나요?"

나: "토론 끝"
봇: "📝 토론 요약
     핵심 쟁점: 시스템 인식과 행동 변화의 간극...
     다음 추천: The Fifth Discipline — 피터 생게"
```

**구현 핵심:**

봇은 별도 프로세스로 항상 실행 중이며, Telegram Long Polling으로 메시지를 수신합니다.

```typescript
// 완독 감지 → 토론 시작
if (detectFinish(text)) {
  const bookName = extractBook(text);
  const opening = await manager.startSession(bookName);
  await send(opening);
}

// 대화 중이면 Claude에 전달
if (manager.hasActiveSession()) {
  const reply = await manager.reply(text);
  await send(reply);
}
```

대화 히스토리는 메모리에 유지되어, Claude가 이전 맥락을 모두 기억한 채 응답합니다.

**봇 실행:**
```bash
# WSL 터미널에서
cd ~/code/my-ai-agent-v1
npm run bot
```

---

## 배운 점

1. **에이전트 분리의 힘** — 역할이 명확히 나뉘면 디버깅이 쉽고 교체가 자유롭습니다.
2. **JSON 통신 원칙** — 에이전트 간 자연어를 배제하면 토큰과 파싱 오류가 모두 줄어듭니다.
3. **모델 선택의 경제학** — 오케스트레이터·토론은 Sonnet, 단순 추천·인사이트는 Haiku.
4. **작게 시작하라** — MVP로 동작하는 걸 먼저, 전체 스펙은 그 다음.
5. **병렬 실행의 위력** — `Promise.all`로 4개 에이전트를 동시에 돌리면 속도가 3배 빨라집니다.
6. **토론의 힘은 페르소나에 있다** — 같은 책도 철학자·심리학자·CTO가 읽으면 전혀 다른 책이 됩니다.
7. **실생활 연결이 독서를 완성한다** — 책 → 골프 루틴, 책 → 다이빙 심리 훈련으로 이어질 때 지식이 살아납니다.
8. **토론은 대화여야 한다** — 일방적 출력이 아닌 실시간 주고받음. 설계 원칙이 바뀌면 구조를 과감히 뜯어야 합니다.

---

## 다음 단계 (Phase 2)

- [x] **Discussion Agent** — 페르소나 기반 책 토론 시뮬레이션 ✅
- [x] **Insight Agent** — 독서와 실생활(골프, 프리다이빙 등) 연결 ✅
- [x] **Memory Agent** — 장기 독서 트렌드 추적 ✅
- [x] **Trend Agent** — 기술 트렌드와 독서 연결 ✅

---

## 마치며

이 시스템은 완성된 앱이 아닙니다.  
매일 조금씩 더 나를 알아가는, **살아있는 개인 지식 시스템**입니다.

관심사가 바뀌면 `preferences.json`을 수정하고,  
읽은 책이 쌓이면 `reading-history.json`이 두꺼워지고,  
에이전트가 늘어날수록 브리핑은 더 풍부해집니다.

> 결국 이 프로젝트의 목표는 단순한 책 추천이 아닙니다.  
> **나만의 지적 운영체제(Personal Intellectual OS)**를 만드는 것입니다.

---

*마지막 업데이트: 2026-05-16*  
*스택: TypeScript · Anthropic SDK · Telegram Bot API · WSL Ubuntu · cron*
