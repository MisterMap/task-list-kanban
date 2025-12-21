import { beforeEach, describe, expect, it, vi } from "vitest";
import { compareTasks, sortTasks } from "../task_sorter";

import type { Brand } from "src/brand";
import { Task } from "../task";
import { getCurrentDate } from "../date_utils";

type TaskString = Brand<string, "TaskString">;

// Mock the date_utils module
vi.mock("../date_utils", async (importOriginal) => {
    const actual = await importOriginal<typeof import("../date_utils")>();
    return {
        ...actual,
        getCurrentDate: vi.fn(() => new Date("2024-03-20T00:00:00.000Z"))
    };
});

describe("Task Sorter", () => {
    
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // Mock Task class for testing
    function createMockTask(options: {
        priority?: number;
        dueDate?: Date | null;
        statusChangedDate?: Date;
        content?: string;
    }): Task {
        const defaultContent = "- [ ] Test task" as TaskString;
        const mockTask = new Task(
            defaultContent,
            { path: "test.md" },
            1,
            {},
            false
        );

        if (options.priority !== undefined) {
            mockTask.priority = options.priority;
        }
        if (options.dueDate !== undefined) {
            mockTask.dueDate = options.dueDate;
        }
        if (options.statusChangedDate !== undefined) {
            // @ts-ignore - Accessing private property for testing
            mockTask._statusChangedDate = options.statusChangedDate;
        }
        if (options.content !== undefined) {
            mockTask.content = options.content;
        }

        return mockTask;
    }

    describe("compareTasks", () => {
        it("should sort by priority first", () => {
            const highPriority = createMockTask({ priority: 0 });
            const lowPriority = createMockTask({ priority: 3 });
            
            expect(compareTasks(highPriority, lowPriority, ["priority"])).toBeLessThan(0);
            expect(compareTasks(lowPriority, highPriority, ["priority"])).toBeGreaterThan(0);
        });

        it("should sort by due date when priorities are equal", () => {
            const earlier = createMockTask({
                priority: 1,
                dueDate: new Date("2024-03-01")
            });
            const later = createMockTask({
                priority: 1,
                dueDate: new Date("2024-03-02")
            });
            
            expect(compareTasks(earlier, later, ["priority", "dueDate"])).toBeLessThan(0);
            expect(compareTasks(later, earlier, ["priority", "dueDate"])).toBeGreaterThan(0);
        });

        it("should place tasks with due dates before tasks without", () => {
            const withDueDate = createMockTask({
                priority: 1,
                dueDate: new Date("2024-03-01")
            });
            const withoutDueDate = createMockTask({
                priority: 1,
                dueDate: null
            });
            
            expect(compareTasks(withDueDate, withoutDueDate, ["priority", "dueDate"])).toBeLessThan(0);
            expect(compareTasks(withoutDueDate, withDueDate, ["priority", "dueDate"])).toBeGreaterThan(0);
        });

        it("should sort by status changed date when other criteria are equal", () => {
            const earlierStatus = createMockTask({
                priority: 1,
                statusChangedDate: new Date("2024-03-01")
            });
            const laterStatus = createMockTask({
                priority: 1,
                statusChangedDate: new Date("2024-03-02")
            });
            
            expect(compareTasks(earlierStatus, laterStatus, ["priority", "statusChanged"])).toBeLessThan(0);
            expect(compareTasks(laterStatus, earlierStatus, ["priority", "statusChanged"])).toBeGreaterThan(0);
        });

        it("should handle equal tasks correctly", () => {
            const date = new Date("2024-03-01");
            const task1 = createMockTask({
                priority: 1,
                dueDate: date,
                statusChangedDate: date
            });
            const task2 = createMockTask({
                priority: 1,
                dueDate: date,
                statusChangedDate: date
            });
            
            expect(compareTasks(task1, task2, ["priority", "dueDate", "statusChanged"])).toBe(0);
        });
    });

    describe("sortTasks", () => {
        it("should sort an array of tasks correctly", () => {
            const tasks = [
                createMockTask({ priority: 2, dueDate: new Date("2024-03-03") }),
                createMockTask({ priority: 0, dueDate: new Date("2024-03-02") }),
                createMockTask({ priority: 1, dueDate: new Date("2024-03-01") })
            ];

            const sorted = sortTasks(tasks, ["priority"]);
            
            expect(sorted[0]!.priority).toBe(0);
            expect(sorted[1]!.priority).toBe(1);
            expect(sorted[2]!.priority).toBe(2);
        });

        it("should handle empty array", () => {
            const tasks: Task[] = [];
            expect(sortTasks(tasks, ["priority"])).toEqual([]);
        });

        it("should maintain relative order for equal priority tasks", () => {
            const date1 = new Date("2024-03-01");
            const date2 = new Date("2024-03-02");
            const date3 = new Date("2024-03-03");

            const tasks = [
                createMockTask({ priority: 1, dueDate: date3 }),
                createMockTask({ priority: 1, dueDate: date1 }),
                createMockTask({ priority: 1, dueDate: date2 })
            ];

            const sorted = sortTasks(tasks, ["priority", "dueDate"]);
            
            expect(sorted[0]!.dueDate).toEqual(date1);
            expect(sorted[1]!.dueDate).toEqual(date2);
            expect(sorted[2]!.dueDate).toEqual(date3);
        });

        it("should handle tasks with default dates correctly", () => {
            const tasks = [
                createMockTask({ priority: 1 }),
                createMockTask({ priority: 1 })
            ];

            const sorted = sortTasks(tasks, ["priority", "statusChanged"]);
            expect(sorted).toHaveLength(2);
            // Both tasks should have the same statusChangedDate from mock
            expect(sorted[0]!.statusChangedDate.getTime()).toBe(sorted[1]!.statusChangedDate.getTime());
        });
    });

    describe("date utils", () => {
        it("should use mocked getCurrentDate", () => {
            const result = getCurrentDate();
            expect(result).toEqual(new Date("2024-03-20T00:00:00.000Z"));
            expect(getCurrentDate).toHaveBeenCalled();
        });
    });
}); 