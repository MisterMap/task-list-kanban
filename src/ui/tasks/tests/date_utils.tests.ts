import { DateType, extractDates, formatDate, formatTaskDate, getCurrentDate } from "../date_utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("Date Utils", () => {
  describe("extractDates", () => {
    it("extracts due date from content", () => {
      const content = "Task with [due:: 2024-03-20] date";
      const result = extractDates(content);
      
      expect(result.content).toBe("Task with date");
      expect(result.dates).toHaveLength(1);
      expect(result.dates[0]).toEqual({
        type: DateType.DUE,
        date: new Date("2024-03-20")
      });
    });

    it("extracts multiple dates from content", () => {
      const content = "Task with [due:: 2024-03-20] and [statusChanged:: 2024-03-19] dates";
      const result = extractDates(content);
      
      expect(result.content).toBe("Task with and dates");
      expect(result.dates).toHaveLength(2);
      expect(result.dates).toContainEqual({
        type: DateType.DUE,
        date: new Date("2024-03-20")
      });
      expect(result.dates).toContainEqual({
        type: DateType.STATUS_CHANGED,
        date: new Date("2024-03-19")
      });
    });

    it("handles multiple dates of the same type", () => {
      const content = "Task with [due:: 2024-03-20] and another [due:: 2024-03-21]";
      const result = extractDates(content);
      
      expect(result.content).toBe("Task with and another");
      expect(result.dates).toHaveLength(2);
      expect(result.dates).toContainEqual({
        type: DateType.DUE,
        date: new Date("2024-03-20")
      });
      expect(result.dates).toContainEqual({
        type: DateType.DUE,
        date: new Date("2024-03-21")
      });
    });

    it("handles invalid date format", () => {
      const content = "Task with [due:: invalid-date]";
      const result = extractDates(content);
      
      expect(result.content).toBe("Task with [due:: invalid-date]");
      expect(result.dates).toHaveLength(0);
    });

    it("returns original content when no dates present", () => {
      const content = "Task without dates";
      const result = extractDates(content);
      
      expect(result.content).toBe("Task without dates");
      expect(result.dates).toHaveLength(0);
    });
  });

  describe("formatDate", () => {
    it("formats date to YYYY-MM-DD", () => {
      const date = new Date("2024-03-20T12:00:00Z");
      expect(formatDate(date)).toBe("2024-03-20");
    });

    it("handles date at start of year", () => {
      const date = new Date("2024-01-01T00:00:00Z");
      expect(formatDate(date)).toBe("2024-01-01");
    });

    it("handles date at end of year", () => {
      const date = new Date("2024-12-31T23:59:59Z");
      expect(formatDate(date)).toBe("2024-12-31");
    });
  });

  describe("formatTaskDate", () => {
    it("formats due date", () => {
      const date = new Date("2024-03-20");
      expect(formatTaskDate(DateType.DUE, date)).toBe("[due:: 2024-03-20]");
    });

    it("formats status changed date", () => {
      const date = new Date("2024-03-20");
      expect(formatTaskDate(DateType.STATUS_CHANGED, date))
        .toBe("[statusChanged:: 2024-03-20]");
    });

    it("formats created date", () => {
      const date = new Date("2024-03-20");
      expect(formatTaskDate(DateType.CREATED, date))
        .toBe("[created:: 2024-03-20]");
    });
  });

  describe("getCurrentDate", () => {
    const mockDate = new Date("2024-03-20T00:00:00.000Z");

    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(mockDate);
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("returns current date without time", () => {
      const result = getCurrentDate();
      
      expect(result.getFullYear()).toBe(2024);
      expect(result.getMonth()).toBe(2); // March is 2 (0-based)
      expect(result.getDate()).toBe(20);
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
      expect(result.getMilliseconds()).toBe(0);
    });
  });
}); 