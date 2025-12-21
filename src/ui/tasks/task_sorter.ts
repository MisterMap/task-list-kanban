import type { Task } from "./task";

export type SortOrder = "priority" | "dueDate" | "statusChanged" | "created" | "path" | "rowIndex";

/**
 * Compares a single field between two tasks
 */
function compareField(a: Task, b: Task, sortOrder: SortOrder): number {
    switch (sortOrder) {
        case "priority":
            return a.priority - b.priority;
        case "dueDate":
            // Tasks with due dates come before those without
            if (a.dueDate && b.dueDate) {
                return a.dueDate.getTime() - b.dueDate.getTime();
            } else if (a.dueDate) {
                return -1;
            } else if (b.dueDate) {
                return 1;
            } else {
                return 0;
            }
        case "statusChanged":
            return a.statusChangedDate.getTime() - b.statusChangedDate.getTime();
        case "created":
            return a.createdDate.getTime() - b.createdDate.getTime();
        case "path":
            return a.path.localeCompare(b.path);
        case "rowIndex":
            return a.rowIndex - b.rowIndex;
    }
}

/**
 * Compares two tasks based on the specified list of sort orders
 * Returns:
 * - negative if a should come before b
 * - positive if a should come after b
 * - 0 if they are equal in sort order
 */
export function compareTasks(a: Task, b: Task, sortOrders: SortOrder[] = ["priority"]): number {
    // Iterate through sort orders until we find a difference
    for (const sortOrder of sortOrders) {
        const result = compareField(a, b, sortOrder);
        if (result !== 0) {
            return result;
        }
    }

    // If all sort orders are equal, use final fallback: path and row index
    if (a.path !== b.path) {
        return a.path.localeCompare(b.path);
    }
    return a.rowIndex - b.rowIndex;
}

/**
 * Sorts an array of tasks based on the specified list of sort orders
 */
export function sortTasks(tasks: Task[], sortOrders: SortOrder[] = ["priority"]): Task[] {
    return tasks.sort((a, b) => compareTasks(a, b, sortOrders));
} 