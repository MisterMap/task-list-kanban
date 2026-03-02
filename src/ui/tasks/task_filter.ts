import { getCurrentDate } from "./date_utils";
import type { Task } from "./task";

export type TaskPriority = 0 | 1 | 2 | 3;
export type TaskDateField = "dueDate" | "createdDate" | "statusChangedDate";

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
