import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { isTaskString, Task } from "../task";
import { type ColumnTag, type ColumnTagTable } from "src/ui/columns/columns";
import { kebab } from "src/parsing/kebab/kebab";
import { DateType, formatTaskDate, getCurrentDate } from "../date_utils";

// Mock the date_utils module
vi.mock("../date_utils", async (importOriginal) => {
	const actual = await importOriginal<typeof import("../date_utils")>();
	return {
		...actual,
		getCurrentDate: vi.fn(() => new Date("2024-03-20T00:00:00.000Z"))
	};
});

describe("Task", () => {
	const columnTags: ColumnTagTable = {
		[kebab<ColumnTag>("column")]: { name: "column", maxTasks: -1 },
	};

	const mockDate = new Date("2024-03-20T00:00:00.000Z");

	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(mockDate);
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("parses a basic task string", () => {
		let task: Task | undefined;
		const taskString = "- [ ] Something #tag";
		if (isTaskString(taskString)) {
			task = new Task(taskString, { path: "/" }, 0, columnTags, false);
		}

		expect(task).toBeTruthy();
		expect(task?.content).toBe("Something #tag");
		expect(task?.tags.has("tag")).toBeTruthy();
	});

	it("parses a basic task string with a column", () => {
		let task: Task | undefined;
		const taskString = "- [ ] Something #tag #column";
		if (isTaskString(taskString)) {
			task = new Task(taskString, { path: "/" }, 0, columnTags, false);
		}

		expect(task).toBeTruthy();
		expect(task?.content).toBe("Something #tag");
		expect(task?.column).toBe(kebab<ColumnTag>("column"));
	});

	it("serialises a basic task string with a column", () => {
		let task: Task | undefined;
		const taskString = "- [ ] Something #tag #column";
		if (isTaskString(taskString)) {
			task = new Task(taskString, { path: "/" }, 0, columnTags, false);
		}

		const expectedOutput = `- [ ] Something #tag #column ${formatTaskDate(DateType.STATUS_CHANGED, mockDate)} ${formatTaskDate(DateType.CREATED, mockDate)}`;
		const output = task?.serialise();
		expect(output).toBe(expectedOutput);
	});

	it("serialises a basic task string with a column and consolidate tags", () => {
		let task: Task | undefined;
		const taskString = "- [ ] Something #tag #column";
		if (isTaskString(taskString)) {
			task = new Task(taskString, { path: "/" }, 0, columnTags, true);
		}

		const expectedOutput = `- [ ] Something #tag #column ${formatTaskDate(DateType.STATUS_CHANGED, mockDate)} ${formatTaskDate(DateType.CREATED, mockDate)}`;
		const output = task?.serialise();
		expect(output).toBe(expectedOutput);
	});

	it("parses a task string with a block link", () => {
		let task: Task | undefined;
		const taskString = "- [ ] Something #tag #column ^link-link";
		if (isTaskString(taskString)) {
			task = new Task(taskString, { path: "/" }, 0, columnTags, false);
		}

		expect(task).toBeTruthy();
		expect(task?.content).toBe("Something #tag");
		expect(task?.blockLink).toBe("link-link");
	});

	it("serialises a basic task string with a block link", () => {
		let task: Task | undefined;
		const taskString = "- [ ] Something #tag ^link-link";
		if (isTaskString(taskString)) {
			task = new Task(taskString, { path: "/" }, 0, columnTags, false);
			task.column = kebab<ColumnTag>("column");
		}

		const expectedOutput = `- [ ] Something #tag #column ${formatTaskDate(DateType.STATUS_CHANGED, mockDate)} ${formatTaskDate(DateType.CREATED, mockDate)} ^link-link`;
		const output = task?.serialise();
		expect(output).toBe(expectedOutput);
	});

	describe("date handling", () => {
		it("uses mocked getCurrentDate", () => {
			const result = getCurrentDate();
			expect(result).toEqual(mockDate);
			expect(getCurrentDate).toHaveBeenCalled();
		});

		it("sets default dates for new tasks", () => {
			const taskString = "- [ ] New task";
			let task: Task | undefined;
			
			if (isTaskString(taskString)) {
				task = new Task(taskString, { path: "/" }, 0, columnTags, false);
			}

			expect(task).toBeTruthy();
			expect(task?.createdDate.toISOString()).toBe(mockDate.toISOString());
			expect(task?.statusChangedDate.toISOString()).toBe(mockDate.toISOString());
			expect(task?.dueDate).toBeNull();
		});

		it("parses task with dates", () => {
			const taskString = "- [ ] Task with [due:: 2024-03-25] and [statusChanged:: 2024-03-24] and [created:: 2024-03-23]";
			let task: Task | undefined;
			
			if (isTaskString(taskString)) {
				task = new Task(taskString, { path: "/" }, 0, columnTags, false);
			}

			expect(task).toBeTruthy();
			expect(task?.content).toBe("Task with and and");
			expect(task?.dueDate?.toISOString()).toBe("2024-03-25T00:00:00.000Z");
			expect(task?.statusChangedDate.toISOString()).toBe("2024-03-24T00:00:00.000Z");
			expect(task?.createdDate.toISOString()).toBe("2024-03-23T00:00:00.000Z");
		});

		it("updates statusChangedDate when column changes", () => {
			const taskString = "- [ ] Task";
			let task: Task | undefined;
			
			if (isTaskString(taskString)) {
				task = new Task(taskString, { path: "/" }, 0, columnTags, false);
			}

			expect(task).toBeTruthy();
			const initialStatusDate = task?.statusChangedDate;
			
			task!.column = kebab<ColumnTag>("column");
			expect(task?.statusChangedDate.toISOString()).toBe(mockDate.toISOString());
			expect(task?.statusChangedDate).not.toBe(initialStatusDate);
		});

		it("preserves dates when content is updated", () => {
			const taskString = "- [ ] Task with [due:: 2024-03-25] and [statusChanged:: 2024-03-24] and [created:: 2024-03-23]";
			let task: Task | undefined;
			
			if (isTaskString(taskString)) {
				task = new Task(taskString, { path: "/" }, 0, columnTags, false);
			}

			expect(task).toBeTruthy();
			const originalDueDate = task?.dueDate;
			const originalStatusDate = task?.statusChangedDate;
			const originalCreatedDate = task?.createdDate;

			task!.content = "Updated task content";

			expect(task?.dueDate).toBe(originalDueDate);
			expect(task?.statusChangedDate).toBe(originalStatusDate);
			expect(task?.createdDate).toBe(originalCreatedDate);
		});
	});
});
