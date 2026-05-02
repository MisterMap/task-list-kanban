import { getCurrentDate } from "./date_utils";
import type { Task } from "./task";

export type TaskPriority = 0 | 1 | 2 | 3;
export type TaskDateField = "dueDate" | "createdDate" | "statusChangedDate";

type ParsedCounterFilter = {
	tags: Set<string>;
	priorities: Set<number>;
	dueDateBoundary: Date | null;
	dueDateComparison: "<" | ">";
};

export class TaskFilter {
	private readonly parsedCounterFilter: ParsedCounterFilter;

	constructor(filterText: string) {
		this.parsedCounterFilter = this.parseFilterText(filterText);
	}

	matchesTask(task: Task): boolean {
		if (task.done) {
			return false;
		}

		if (
			this.parsedCounterFilter.dueDateBoundary &&
			!this.hasDueDateMatchingBoundary(task)
		) {
			return false;
		}

		if (
			this.parsedCounterFilter.tags.size > 0 &&
			!this.hasAnyTag(task)
		) {
			return false;
		}

		if (
			this.parsedCounterFilter.priorities.size > 0 &&
			!this.parsedCounterFilter.priorities.has(task.priority)
		) {
			return false;
		}

		return true;
	}

	private parseFilterText(filterText: string): ParsedCounterFilter {
		const parsedCounterFilter: ParsedCounterFilter = {
			tags: new Set<string>(),
			priorities: new Set<number>(),
			dueDateBoundary: null,
			dueDateComparison: "<",
		};
		const filterGroupPattern =
			/\b(tags|priority|due)\s*:\s*([\s\S]*?)(?=\b(?:tags|priority|due)\s*:|$)/gi;

		for (const filterGroupMatch of filterText.matchAll(filterGroupPattern)) {
			const filterGroupName = filterGroupMatch[1]?.toLowerCase();
			const filterGroupValue = filterGroupMatch[2] ?? "";
			const filterValues = this.getFilterValues(filterGroupValue);

			if (filterGroupName === "tags") {
				for (const filterValue of filterValues) {
					const tag = this.normaliseTag(filterValue);
					if (tag) {
						parsedCounterFilter.tags.add(tag);
					}
				}
			}

			if (filterGroupName === "priority") {
				for (const filterValue of filterValues) {
					const priority = this.parsePriority(filterValue);
					if (priority !== undefined) {
						parsedCounterFilter.priorities.add(priority);
					}
				}
			}

			if (filterGroupName === "due") {
				const dueDateFilter = this.parseDueDateFilter(filterValues);
				parsedCounterFilter.dueDateBoundary = dueDateFilter.dueDateBoundary;
				parsedCounterFilter.dueDateComparison = dueDateFilter.dueDateComparison;
			}
		}

		return parsedCounterFilter;
	}

	private getFilterValues(filterGroupValue: string): string[] {
		return filterGroupValue
			.split(",")
			.map((filterValue) => filterValue.trim())
			.filter((filterValue) => filterValue.length > 0);
	}

	private normaliseTag(filterValue: string): string | undefined {
		const tag = filterValue.replace(/^#/, "").trim();
		return tag.length > 0 ? tag : undefined;
	}

	private parsePriority(filterValue: string): number | undefined {
		const priorityMatch = filterValue.trim().match(/^#?p([0-3])$/i);
		if (!priorityMatch?.[1]) {
			return undefined;
		}
		return Number(priorityMatch[1]);
	}

	private parseDueDateFilter(filterValues: string[]): {
		dueDateBoundary: Date | null;
		dueDateComparison: "<" | ">";
	} {
		for (const filterValue of filterValues) {
			const dueDateFilter = this.parseDueDateExpression(filterValue);
			if (dueDateFilter.dueDateBoundary) {
				return dueDateFilter;
			}
		}
		return {
			dueDateBoundary: null,
			dueDateComparison: "<",
		};
	}

	private parseDueDateExpression(filterValue: string): {
		dueDateBoundary: Date | null;
		dueDateComparison: "<" | ">";
	} {
		if (this.isNextWeekDueDateValue(filterValue)) {
			return {
				dueDateBoundary: this.getDateRelativeToToday(7),
				dueDateComparison: "<",
			};
		}

		const dueDateExpressionMatch = filterValue
			.trim()
			.match(/^(<|>)?\s*today\(\)\s*([+-])\s*(\d+)d$/i);
		const dueDateComparison = (dueDateExpressionMatch?.[1] ?? "<") as "<" | ">";
		const dueDateOperator = dueDateExpressionMatch?.[2];
		const dueDateDayCountText = dueDateExpressionMatch?.[3];
		if (!dueDateOperator || !dueDateDayCountText) {
			return {
				dueDateBoundary: null,
				dueDateComparison: "<",
			};
		}

		const dueDateDayCount = Number(dueDateDayCountText);
		const dueDateOffset =
			dueDateOperator === "-" ? -dueDateDayCount : dueDateDayCount;

		return {
			dueDateBoundary: this.getDateRelativeToToday(dueDateOffset),
			dueDateComparison,
		};
	}

	private isNextWeekDueDateValue(filterValue: string): boolean {
		const normalisedFilterValue = filterValue.toLowerCase().replaceAll(" ", "-");
		return [
			"next-week",
			"next-7-days",
			"next-seven-days",
			"week",
		].includes(normalisedFilterValue);
	}

	private getDateRelativeToToday(dayOffset: number): Date {
		const today = getCurrentDate();
		today.setHours(0, 0, 0, 0);

		const boundaryDate = new Date(today);
		boundaryDate.setDate(today.getDate() + dayOffset);

		return boundaryDate;
	}

	private hasAnyTag(task: Task): boolean {
		for (const tag of this.parsedCounterFilter.tags) {
			if (task.tags.has(tag)) {
				return true;
			}
		}
		return false;
	}

	private hasDueDateMatchingBoundary(task: Task): boolean {
		if (!task.dueDate) {
			return true;
		}

		const dueDateBoundary = this.parsedCounterFilter.dueDateBoundary;
		if (!dueDateBoundary) {
			return true;
		}

		if (this.parsedCounterFilter.dueDateComparison === ">") {
			return task.dueDate > dueDateBoundary;
		}

		return task.dueDate < dueDateBoundary;
	}
}

function getDateField(task: Task, dateField: TaskDateField): Date | null {
	if (dateField === "dueDate") {
		return task.dueDate;
	}
	return task[dateField];
}

export function filterTasksByPriorities(
	tasks: Task[],
	priorities: TaskPriority[],
): Task[] {
	if (!priorities.length) {
		return tasks;
	}
	const allowed = new Set(priorities);
	return tasks.filter((task) => allowed.has(task.priority as TaskPriority));
}

export function filterTasksByDate(
	tasks: Task[],
	days: number,
	dateField: TaskDateField = "dueDate",
	includeEmpty = true,
): Task[] {
	const today = getCurrentDate();
	today.setHours(0, 0, 0, 0);
	const targetDate = new Date(today);
	targetDate.setDate(today.getDate() + days);

	return tasks.filter((task) => {
		const taskDate = getDateField(task, dateField);
		if (!taskDate) {
			return includeEmpty;
		}
		return taskDate < targetDate;
	});
}
