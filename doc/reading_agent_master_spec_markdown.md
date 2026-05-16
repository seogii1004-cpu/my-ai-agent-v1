# AI Reading Companion Agent

## Overview

AI Reading Companion is a multi-agent reading system designed to:

- recommend books
- discuss ideas
- connect books to real life
- track intellectual growth
- simulate book club discussions
- evolve with the user over time

The goal is not simply book recommendation.

The goal is:
- intellectual growth
- deeper thinking
- long-term memory
- idea expansion
- practical application

---

# System Architecture

```text
reading-agent/
 ├─ main-reading-agent/
 │   ├─ AGENTS.md
 │   ├─ claude.md
 │   ├─ workflows/
 │   └─ prompts/
 │
 ├─ recommender-agent/
 ├─ discussion-agent/
 ├─ insight-agent/
 ├─ memory-agent/
 ├─ trend-agent/
 │
 ├─ memory/
 ├─ outputs/
 ├─ prompts/
 └─ shared/
```

---

# Project Goals

## Core Objectives

- Build a personal AI reading companion
- Create an AI-based intellectual growth system
- Simulate real-world book discussions
- Connect books to real-life actions
- Track long-term thinking evolution
- Provide personalized recommendations
- Generate actionable insights from reading

---

# Main Reading Agent

## Responsibilities

- orchestrate sub-agents
- aggregate outputs
- generate daily reading briefing
- maintain concise summaries
- prioritize actionable insights
- manage memory summaries
- schedule agent execution

## Main Agent Rules

- Keep outputs concise
- Prefer JSON outputs
- Avoid verbose explanations
- Summarize aggressively
- Avoid duplicate reasoning
- Max output length: 300 words
- Store summaries only

## Output Example

```json
{
  "date": "2026-05-16",
  "daily_briefing": [
    "최근 시스템 사고 관련 관심 증가",
    "AI Agent 설계와 연결되는 독서 흐름 발견"
  ],
  "recommended_actions": [
    "Thinking in Systems 재독 추천",
    "독서 토론 질문 1개 작성"
  ]
}
```

---

# Sub Agents

---

# 1. Recommender Agent

## Purpose

Recommend books based on:

- reading history
- current interests
- emotional state
- projects
- long-term trends
- unfinished topics
- intellectual goals

## Responsibilities

- recommend next books
- identify topic gaps
- avoid repetitive recommendations
- rank recommendations
- generate concise recommendation reasoning

## Inputs

```json
{
  "interests": [
    "AI agents",
    "system design",
    "psychology"
  ],
  "recent_books": [
    "Deep Work",
    "Atomic Habits"
  ]
}
```

## Output

```json
{
  "recommendations": [
    {
      "title": "Thinking in Systems",
      "reason": "최근 agent orchestration 관심 증가",
      "score": 0.94
    }
  ]
}
```

## Rules

- max 3 recommendations
- concise reasoning only
- avoid generic bestsellers
- prioritize intellectual continuity
- connect recommendations to current interests

---

# 2. Discussion Agent

## Purpose

Simulate an offline book club experience.

The agent should:
- debate ideas
- ask critical questions
- challenge assumptions
- provide alternative viewpoints
- encourage deeper thinking

## Responsibilities

- generate discussion questions
- simulate debates
- challenge confirmation bias
- create intellectual tension
- provide multiple perspectives

## Discussion Examples

- 왜 저자는 이렇게 주장했는가?
- 반대 입장은 무엇인가?
- 삼성전자 조직 문화에 적용 가능할까?
- AI 시대에도 유효한 개념일까?
- 현실에서는 왜 실패할 수 있을까?

---

## Persona-Based Debate

The agent may simulate perspectives such as:

- CTO
- psychologist
- investor
- philosopher
- startup founder
- Naval Ravikant style thinker
- systems engineer
- behavioral scientist

## Example

```text
[CTO Perspective]
The core idea is scalability and system optimization.

[Psychologist Perspective]
The author underestimates emotional motivation.
```

## Rules

- avoid shallow agreement
- prioritize critical thinking
- provide counterarguments
- avoid repetitive perspectives
- keep debates concise

---

# 3. Insight Agent

## Purpose

Connect books to real-life applications.

The goal:
- transform reading into action
- connect ideas across domains
- personalize learning
- improve daily life

## Responsibilities

- generate actionable insights
- connect books to hobbies
- connect books to work
- connect books to current projects
- generate implementation ideas

## Examples

```text
Atomic Habits
→ improve golf practice routines

Deep Work
→ optimize AI development focus time

Thinking in Systems
→ improve multi-agent architecture design
```

## Rules

- prioritize practical insights
- avoid generic self-help advice
- personalize aggressively
- generate action-oriented outputs

---

# 4. Memory Agent

## Purpose

Track long-term intellectual evolution.

The agent stores:
- reading history
- topic evolution
- recurring themes
- idea relationships
- preference changes
- intellectual shifts

## Responsibilities

- compress memories
- generate summaries
- track topic evolution
- identify recurring interests
- detect intellectual transitions

## Example Memory

```json
{
  "2024": [
    "productivity",
    "self-improvement"
  ],
  "2025": [
    "AI",
    "agents",
    "system design"
  ],
  "2026": [
    "philosophy",
    "systems thinking"
  ]
}
```

## Example Insight

```text
최근에는 기술 중심 독서에서
인간 사고와 시스템 철학 중심으로 관심이 이동하고 있습니다.
```

## Rules

- store summaries only
- avoid raw conversation storage
- compress aggressively
- preserve long-term trends only
- avoid redundant memory

---

# 5. Trend Agent

## Purpose

Connect reading activity with:

- AI trends
- developer communities
- research papers
- Hacker News
- Reddit
- technology movements
- startup trends

## Responsibilities

- identify trend overlap
- connect books with current events
- explain relevance
- surface emerging ideas

## Example

```text
Thinking in Systems is becoming increasingly relevant
in modern AI agent orchestration design.
```

## Rules

- prioritize emerging trends
- avoid noisy news summaries
- connect trends to user interests
- keep outputs concise

---

# Shared Data Models

## Reading History Schema

```json
{
  "book": "",
  "author": "",
  "rating": 0,
  "completed_at": "",
  "topics": [],
  "key_insights": [],
  "discussion_notes": []
}
```

---

## Daily Briefing Schema

```json
{
  "summary": [],
  "today_recommendation": {
    "book": "",
    "reason": ""
  },
  "discussion_prompt": "",
  "action_items": []
}
```

---

# Memory Structure

```text
memory/
 ├─ reading-history.json
 ├─ preferences.json
 ├─ idea-map.json
 ├─ discussion-history.json
 ├─ summaries/
 └─ trends/
```

---

# Daily Workflow

```text
Morning Scheduler
  ↓
Main Reading Agent
  ↓
Memory Agent
  ↓
Recommendation Agent
  ↓
Discussion Agent
  ↓
Insight Agent
  ↓
Trend Agent
  ↓
Daily Reading Briefing
```

---

# Example Daily Briefing

```json
{
  "summary": [
    "최근 시스템 사고 중심 독서 증가",
    "AI orchestration 관련 사고 흐름 강화"
  ],
  "today_recommendation": {
    "book": "Thinking in Systems",
    "reason": "현재 multi-agent 설계 관심사와 강하게 연결"
  },
  "discussion_prompt": "AI Agent 역시 복잡계 시스템으로 볼 수 있을까?",
  "action_items": [
    "시스템 사고 기반 agent architecture 검토",
    "독서 토론 노트 작성"
  ]
}
```

---

# Suggested Tech Stack

## Core

- Claude Code
- TypeScript
- Node.js

## Optional

- FastAPI
- SQLite
- ChromaDB
- pgvector
- LangGraph
- Temporal

---

# Token Optimization Strategy

## Rules

- keep outputs concise
- avoid verbose reasoning
- store summaries only
- avoid full conversation history
- prefer structured JSON
- compress memory aggressively
- avoid unnecessary tool calls
- avoid repeated context

---

# Agent Communication Rules

## Main Principles

- All agents communicate using JSON
- Avoid natural language between agents
- Use deterministic schemas
- Keep payloads compact
- Avoid redundant metadata

## Example

```json
{
  "agent": "discussion-agent",
  "status": "success",
  "output": {
    "discussion_prompt": "What assumptions does the author make about human behavior?"
  }
}
```

---

# MVP Recommendation

## Phase 1

- reading history
- recommendation
- simple discussion
- concise summaries

---

## Phase 2

- memory tracking
- intellectual trend analysis
- persona debate
- practical insight generation

---

## Phase 3

- voice interaction
- multi-agent integration
- cross-domain insights
- proactive recommendations

Example:

```text
Reading Agent
  ↓
Fashion Agent
  ↓
“오늘은 Deep Work 스타일의 미니멀 코디 추천”
```

---

# Future Expansion Ideas

## Possible Integrations

- daily life dashboard
- calendar integration
- Notion integration
- Obsidian integration
- Kindle highlights sync
- voice discussion mode
- podcast summarization
- AI mentor mode

---

# Long-Term Vision

The final goal is not a reading app.

The final goal is:

# Personal Intellectual Operating System

A system that helps the user:
- think deeper
- connect ideas
- grow continuously
- understand themselves better
- evolve intellectually over time
- generate original thinking
- build long-term intellectual assets

---

# Claude Code Implementation Notes

## Recommended Project Setup

```text
reading-agent/
 ├─ claude.md
 ├─ AGENTS.md
 ├─ package.json
 ├─ src/
 ├─ memory/
 ├─ prompts/
 ├─ workflows/
 └─ outputs/
```

## Recommended Development Order

1. main-reading-agent
2. memory-agent
3. recommender-agent
4. discussion-agent
5. insight-agent
6. trend-agent

## Important Design Principles

- keep agents independent
- avoid giant prompts
- prefer composable workflows
- minimize token usage
- prefer memory summaries
- prefer deterministic outputs
- use compact JSON communication

