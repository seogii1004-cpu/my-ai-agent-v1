export interface BookRecord {
  book: string;
  author: string;
  rating: number;
  started_at?: string;
  completed_at: string;
  reading_days?: number;
  topics: string[];
  key_insights: string[];
}

export interface CurrentlyReading {
  book: string;
  startedAt: string;
}

export interface Preferences {
  hobbies: string[];
  reading_interests: string[];
  reading_goals: string[];
  favorite_genres: string[];
  profession: string;
  professional_interests: string[];
}

export interface Recommendation {
  title: string;
  author: string;
  reason: string;
  score: number;
}

export interface RecommenderOutput {
  recommendations: Recommendation[];
}

export interface PersonaPerspective {
  persona: string;
  perspective: string;
}

export interface DiscussionOutput {
  book: string;
  discussion_questions: string[];
  debate: PersonaPerspective[];
  key_tensions: string[];
}

export interface InsightItem {
  domain: string;
  application: string;
  action: string;
}

export interface InsightOutput {
  book: string;
  insights: InsightItem[];
}

export interface MemoryOutput {
  themes: string[];
  evolution: string;
  recent_shift: string;
}

export interface TrendConnection {
  trend: string;
  relevance: string;
}

export interface TrendOutput {
  trend_connections: TrendConnection[];
  emerging_idea: string;
}

export interface WeeklyBriefing {
  date: string;
  weekly_summary: string[];
  today_recommendation: {
    book: string;
    author: string;
    reason: string;
  };
  discussion: DiscussionOutput | null;
  insights: InsightOutput;
  memory: MemoryOutput;
  trends: TrendOutput;
  action_items: string[];
}
