export interface BookRecord {
  book: string;
  author: string;
  rating: number;
  completed_at: string;
  topics: string[];
  key_insights: string[];
}

export interface Preferences {
  interests: string[];
  favorite_genres: string[];
  reading_goals: string[];
  life_domains: string[];
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
