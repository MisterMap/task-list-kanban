export enum DateType {
  DUE = 'due',
  STATUS_CHANGED = 'statusChanged',
  CREATED = 'created'
}

export interface TaskDate {
  type: DateType;
  date: Date;
}

const DATE_REGEX = /\[(due|statusChanged|created):: (\d{4}-\d{2}-\d{2})\]/g;

export function extractDates(content: string): { content: string; dates: TaskDate[] } {
  const dates: TaskDate[] = [];
  const newContent = content.replace(DATE_REGEX, (match, type, dateStr) => {
    try {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        dates.push({
          type: type as DateType,
          date: date
        });
      }
    } catch (e) {
      console.error(`Failed to parse date: ${dateStr}`);
    }
    return ' '; // Always remove the date string and return a space
  }).replace(/\s+/g, ' ').trim(); // Normalize multiple spaces to single space

  return { content: newContent, dates };
}

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0] ?? '';
}

export function formatTaskDate(type: DateType, date: Date): string {
  return `[${type}:: ${formatDate(date)}]`;
}

export function getCurrentDate(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
} 