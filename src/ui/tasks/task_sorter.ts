import type { Task } from "./task";

/**
 * Compares two tasks based on priority, due date, and status changed date
 * Returns:
 * - negative if a should come before b
 * - positive if a should come after b
 * - 0 if they are equal in sort order
 */
export function compareTasks(a: Task, b: Task): number {
    // First compare by priority (lower number = higher priority)
    if (a.priority !== b.priority) {
        return a.priority - b.priority;
    }

    // Then compare by due date if both have one
    if (a.dueDate && b.dueDate) {
        const dueDateDiff = a.dueDate.getTime() - b.dueDate.getTime();
        if (dueDateDiff !== 0) {
            return dueDateDiff;
        }
    } else if (a.dueDate) {
        // Tasks with due dates come before tasks without
        return -1;
    } else if (b.dueDate) {
        return 1;
    }

    // Finally compare by status changed date
    const statusDateDiff = a.statusChangedDate.getTime() - b.statusChangedDate.getTime();
    if (statusDateDiff !== 0) {
        return statusDateDiff;
    }
    
    // If status dates are equal, compare by file name
    return a.path.localeCompare(b.path);
}

/**
 * Sorts an array of tasks in place based on priority, due date, and status changed date
 */
export function sortTasks(tasks: Task[]): Task[] {
    return tasks.sort(compareTasks);
} 