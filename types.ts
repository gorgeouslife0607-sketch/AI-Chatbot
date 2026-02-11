
export enum BotType {
  GPTBot = 'GPTBot',
  ClaudeBot = 'ClaudeBot',
  GoogleExtended = 'Google-Extended',
  PerplexityBot = 'PerplexityBot',
  Other = 'Other'
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  botType: BotType;
  path: string;
  raw: string;
}

export interface StatsResult {
  total: number;
  byBot: Record<BotType, number>;
  date: string;
}

export interface ComparisonResult {
  currentPeriod: Record<BotType, number>;
  previousPeriod: Record<BotType, number>;
  diff: Record<BotType, number>;
  percentageChange: Record<BotType, number>;
}
