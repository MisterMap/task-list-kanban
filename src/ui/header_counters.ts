import { get, type Writable } from "svelte/store";
import type { Task } from "./tasks/task";
import type { SettingValues } from "./settings/settings_store";
import { filterTasksByDate, filterTasksByPriorities } from "./tasks/task_filter";

type CounterElements = {
	totalNextWeekEl: HTMLDivElement;
	criticalNextWeekEl: HTMLDivElement;
};

export class HeaderCountersController {
	private elements: CounterElements | undefined;
	private unsubscribeTasks: (() => void) | undefined;
	private unsubscribeSettings: (() => void) | undefined;
	private readonly criticalPriorities = [0, 1, 2] as const;

	constructor(
		private readonly tasksStore: Writable<Task[]>,
		private readonly settingsStore: Writable<SettingValues>,
	) {}

	mount(gearEl: HTMLElement) {
		this.unmount();
		this.elements = this.createHeaderCounters(gearEl);

		this.unsubscribeTasks = this.tasksStore.subscribe((tasks) => {
			this.render(tasks, get(this.settingsStore));
		});

		this.unsubscribeSettings = this.settingsStore.subscribe((settings) => {
			this.render(get(this.tasksStore), settings);
		});
	}

	unmount() {
		this.unsubscribeTasks?.();
		this.unsubscribeSettings?.();
		this.unsubscribeTasks = undefined;
		this.unsubscribeSettings = undefined;
		this.elements = undefined;
	}

	private createHeaderCounters(gearEl: HTMLElement): CounterElements {
		const totalNextWeekEl = createDiv({ cls: "kanban-header-count" });
		totalNextWeekEl.setAttr(
			"title",
			"All tasks without dueDate or due in next 7 days",
		);
		gearEl.before(totalNextWeekEl);

		const criticalNextWeekEl = createDiv({ cls: "kanban-header-count" });
		criticalNextWeekEl.setAttr(
			"title",
			"All tasks without dueDate or due in next 7 days with priority p0/p1/p2",
		);
		gearEl.before(criticalNextWeekEl);

		return { totalNextWeekEl, criticalNextWeekEl };
	}

	private renderHeaderCounter(
		el: HTMLElement,
		label: string,
		count: number,
		max: number | undefined,
	) {
		const color =
			max !== undefined && count > max ? "var(--color-p0)" : "var(--color-p2)";
		const countText = max !== undefined ? `${count}/${max}` : `${count}`;

		el.setText(`${label}: ${countText}`);
		el.style.setProperty("--kanban-header-count-color", color);
	}

	private render(tasks: Task[], settings: SettingValues) {
		if (!this.elements) {
			return;
		}

		const activeTasks = tasks.filter((task) => !task.done);
		const totalNextWeek = filterTasksByDate(activeTasks, 7, "dueDate", true);
		const criticalNextWeek = filterTasksByPriorities(totalNextWeek, [
			...this.criticalPriorities,
		]);

		this.renderHeaderCounter(
			this.elements.totalNextWeekEl,
			"Total",
			totalNextWeek.length,
			settings.totalNextWeekMax,
		);
		this.renderHeaderCounter(
			this.elements.criticalNextWeekEl,
			"Critical",
			criticalNextWeek.length,
			settings.criticalNextWeekMax,
		);
	}
}
