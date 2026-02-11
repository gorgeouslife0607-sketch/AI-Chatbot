
import { BotType, LogEntry } from '../types';

export const parseLogLine = (line: string): LogEntry | null => {
  if (!line.trim()) return null;

  // Typical CLF format: 127.0.0.1 - - [10/Oct/2023:13:55:36 +0000] "GET /path HTTP/1.1" 200 ... "User-Agent"
  // Simple regex to extract common parts
  const dateRegex = /\[(\d{2}\/\w{3}\/\d{4}:\d{2}:\d{2}:\d{2} [+-]\d{4})\]/;
  const pathRegex = /"(\w+) ([^ ]+) HTTP/;
  
  const dateMatch = line.match(dateRegex);
  const pathMatch = line.match(pathRegex);

  if (!dateMatch) return null;

  // Convert "10/Oct/2023:13:55:36 +0000" to JS Date
  // Note: Standard Date doesn't love this format directly, we need a slight transform
  const dateStr = dateMatch[1].replace(':', ' ');
  const timestamp = new Date(dateStr);

  let botType = BotType.Other;
  if (line.includes('GPTBot')) botType = BotType.GPTBot;
  else if (line.includes('ClaudeBot')) botType = BotType.ClaudeBot;
  else if (line.includes('Google-Extended')) botType = BotType.GoogleExtended;
  else if (line.includes('PerplexityBot')) botType = BotType.PerplexityBot;

  // We only care about the specific AI bots requested by the user
  if (botType === BotType.Other) return null;

  return {
    id: Math.random().toString(36).substr(2, 9),
    timestamp,
    botType,
    path: pathMatch ? pathMatch[2] : 'unknown',
    raw: line
  };
};

export const parseBulkLogs = (content: string): LogEntry[] => {
  const lines = content.split('\n');
  return lines
    .map(parseLogLine)
    .filter((entry): entry is LogEntry => entry !== null);
};
