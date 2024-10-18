import { describe, expect, it } from "vitest";
import { isTaskString, Task } from "../task";
import { type ColumnTag, type ColumnTagTable } from "src/ui/columns/columns";
import { kebab } from "src/parsing/kebab/kebab";

describe("Task", () => {
	const columnTags: ColumnTagTable = {
		[kebab<ColumnTag>("column")]: { name: "column", maxTasks: -1 },
	};

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

		const output = task?.serialise();
		expect(output).toBe(taskString);
	});

	it("serialises a basic task string with a column and consolidate tags", () => {
		let task: Task | undefined;
		const taskString = "- [ ] Something #tag #column";
		if (isTaskString(taskString)) {
			task = new Task(taskString, { path: "/" }, 0, columnTags, true);
		}

		const output = task?.serialise();
		expect(output).toBe(taskString);
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

		const output = task?.serialise();
		expect(output).toBe("- [ ] Something #tag #column ^link-link");
	});
});
