import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TaskFilter } from "../task_filter";
import type { Task } from "../task";

vi.mock("../date_utils", async (importOriginal) => {
	const actual = await importOriginal<typeof import("../date_utils")>();
	return {
		...actual,
		getCurrentDate: vi.fn(() => new Date("2024-03-20T00:00:00.000Z")),
	};
});

describe("TaskFilter", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2024-03-20T00:00:00.000Z"));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	function createTask({
		isDone = false,
		tags = [],
		priority = 3,
		dueDate = null,
	}: {
		isDone?: boolean;
		tags?: string[];
		priority?: number;
		dueDate?: Date | null;
	}): Task {
		return {
			done: isDone,
			tags: new Set(tags),
			priority,
			dueDate,
		} as unknown as Task;
	}

	it("matches active tasks when the filter is empty", () => {
		const taskFilter = new TaskFilter("");

		expect(taskFilter.matchesTask(createTask({}))).toBe(true);
	});

	it("excludes done tasks", () => {
		const taskFilter = new TaskFilter("");

		expect(taskFilter.matchesTask(createTask({ isDone: true }))).toBe(false);
	});

	it("matches any configured tag", () => {
		const taskFilter = new TaskFilter("tags: #plan, #fix");

		expect(taskFilter.matchesTask(createTask({ tags: ["plan"] }))).toBe(true);
		expect(taskFilter.matchesTask(createTask({ tags: ["other"] }))).toBe(false);
	});

	it("matches any configured priority", () => {
		const taskFilter = new TaskFilter("priority: #p0, #p1");

		expect(taskFilter.matchesTask(createTask({ priority: 0 }))).toBe(true);
		expect(taskFilter.matchesTask(createTask({ priority: 2 }))).toBe(false);
	});

	it("requires tags and priorities when both groups are present", () => {
		const taskFilter = new TaskFilter("tags: #plan priority: #p0, #p1");

		expect(
			taskFilter.matchesTask(createTask({ tags: ["plan"], priority: 1 })),
		).toBe(true);
		expect(
			taskFilter.matchesTask(createTask({ tags: ["plan"], priority: 2 })),
		).toBe(false);
		expect(
			taskFilter.matchesTask(createTask({ tags: ["fix"], priority: 1 })),
		).toBe(false);
	});

	it("ignores malformed values safely", () => {
		const taskFilter = new TaskFilter("tags: #plan, # priority: #p9, nope");

		expect(taskFilter.matchesTask(createTask({ tags: ["plan"], priority: 3 }))).toBe(true);
		expect(taskFilter.matchesTask(createTask({ tags: ["other"], priority: 0 }))).toBe(false);
	});

	it("matches tasks without due dates for due expression filters", () => {
		const taskFilter = new TaskFilter("due: < today() + 7d");

		expect(taskFilter.matchesTask(createTask({ dueDate: null }))).toBe(true);
	});

	it("matches tasks due before the configured today expression boundary", () => {
		const taskFilter = new TaskFilter("due: < today() + 7d");

		expect(
			taskFilter.matchesTask(createTask({ dueDate: new Date("2024-03-26") })),
		).toBe(true);
		expect(
			taskFilter.matchesTask(createTask({ dueDate: new Date("2024-03-28") })),
		).toBe(false);
	});

	it("matches tasks due after the configured today expression boundary", () => {
		const taskFilter = new TaskFilter("due: > today() + 7d");

		expect(
			taskFilter.matchesTask(createTask({ dueDate: new Date("2024-03-28") })),
		).toBe(true);
		expect(
			taskFilter.matchesTask(createTask({ dueDate: new Date("2024-03-26") })),
		).toBe(false);
	});

	it("keeps due expressions without comparison sign compatible", () => {
		const taskFilter = new TaskFilter("due: today() + 7d");

		expect(
			taskFilter.matchesTask(createTask({ dueDate: new Date("2024-03-26") })),
		).toBe(true);
		expect(
			taskFilter.matchesTask(createTask({ dueDate: new Date("2024-03-27") })),
		).toBe(false);
	});

	it("keeps next-week due filter compatibility", () => {
		const taskFilter = new TaskFilter("due: next-week");

		expect(
			taskFilter.matchesTask(createTask({ dueDate: new Date("2024-03-26") })),
		).toBe(true);
		expect(
			taskFilter.matchesTask(createTask({ dueDate: new Date("2024-03-27") })),
		).toBe(false);
	});
});
