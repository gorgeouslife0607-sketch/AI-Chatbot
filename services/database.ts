
import { LogEntry, StatsResult, BotType, ComparisonResult } from '../types';

class LogStore {
  private entries: LogEntry[] = [];

  constructor() {
    const saved = localStorage.getItem('log_entries');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.entries = parsed.map((e: any) => ({
          ...e,
          timestamp: new Date(e.timestamp)
        }));
      } catch (e) {
        console.error("Failed to load saved logs", e);
      }
    }
  }

  save(newEntries: LogEntry[]) {
    this.entries = [...this.entries, ...newEntries];
    // Keep last 50,000 logs for performance in this demo
    if (this.entries.length > 50000) {
      this.entries = this.entries.slice(-50000);
    }
    localStorage.setItem('log_entries', JSON.stringify(this.entries));
  }

  clear() {
    this.entries = [];
    localStorage.removeItem('log_entries');
  }

  getStats(start: Date, end: Date): StatsResult[] {
    const filtered = this.entries.filter(e => e.timestamp >= start && e.timestamp <= end);
    
    // Group by date
    const grouped: Record<string, Record<BotType, number>> = {};
    
    filtered.forEach(e => {
      const dateKey = e.timestamp.toISOString().split('T')[0];
      if (!grouped[dateKey]) {
        grouped[dateKey] = {
          [BotType.GPTBot]: 0,
          [BotType.ClaudeBot]: 0,
          [BotType.GoogleExtended]: 0,
          [BotType.PerplexityBot]: 0,
          [BotType.Other]: 0
        };
      }
      grouped[dateKey][e.botType]++;
    });

    return Object.entries(grouped).map(([date, bots]) => ({
      date,
      byBot: bots,
      total: Object.values(bots).reduce((a, b) => a + b, 0)
    })).sort((a, b) => a.date.localeCompare(b.date));
  }

  comparePeriods(p1Start: Date, p1End: Date, p2Start: Date, p2End: Date): ComparisonResult {
    const getBotCounts = (start: Date, end: Date) => {
      const counts: Record<BotType, number> = {
        [BotType.GPTBot]: 0,
        [BotType.ClaudeBot]: 0,
        [BotType.GoogleExtended]: 0,
        [BotType.PerplexityBot]: 0,
        [BotType.Other]: 0
      };
      this.entries.forEach(e => {
        if (e.timestamp >= start && e.timestamp <= end) {
          counts[e.botType]++;
        }
      });
      return counts;
    };

    const current = getBotCounts(p1Start, p1End);
    const previous = getBotCounts(p2Start, p2End);
    
    const diff: Record<BotType, number> = {} as any;
    const percentageChange: Record<BotType, number> = {} as any;

    [BotType.GPTBot, BotType.ClaudeBot, BotType.GoogleExtended, BotType.PerplexityBot].forEach(bot => {
      diff[bot] = current[bot] - previous[bot];
      percentageChange[bot] = previous[bot] === 0 ? (current[bot] > 0 ? 100 : 0) : ((current[bot] - previous[bot]) / previous[bot]) * 100;
    });

    return {
      currentPeriod: current,
      previousPeriod: previous,
      diff,
      percentageChange
    };
  }

  getAll() {
    return this.entries;
  }
}

export const db = new LogStore();
