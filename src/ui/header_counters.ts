import { get, type Writable } from "svelte/store";
import type { Task } from "./tasks/task";
import type { HeaderCounterSettings, SettingValues } from "./settings/settings_store";
import { TaskFilter } from "./tasks/task_filter";

class HeaderCounter {
	readonly label: string;
	readonly filterText: string;
	readonly maxTasks: number | undefined;
	private readonly taskFilter: TaskFilter;

	constructor(headerCounterSettings: HeaderCounterSettings) {
		this.label = headerCounterSettings.label;
		this.filterText = headerCounterSettings.filter;
		this.maxTasks = headerCounterSettings.maxTasks;
		this.taskFilter = new TaskFilter(headerCounterSettings.filter);
	}

	countTasks(tasks: Task[]): number {
		return tasks.filter((task) => this.taskFilter.matchesTask(task)).length;
	}

	isExceeded(count: number): boolean {
		return this.maxTasks !== undefined && count > this.maxTasks;
	}
}

export class HeaderCountersController {
	private counterElements: HTMLDivElement[] = [];
	private gearElement: HTMLElement | undefined;
	private unsubscribeTasks: (() => void) | undefined;
	private unsubscribeSettings: (() => void) | undefined;

	constructor(
		private readonly tasksStore: Writable<Task[]>,
		private readonly settingsStore: Writable<SettingValues>,
	) {}

	mount(gearElement: HTMLElement) {
		this.unmount();
		this.gearElement = gearElement;
		this.synchroniseHeaderCounterElements(get(this.settingsStore));

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
		this.gearElement = undefined;
		for (const counterElement of this.counterElements) {
			counterElement.remove();
		}
		this.counterElements = [];
	}

	private synchroniseHeaderCounterElements(settings: SettingValues) {
		if (!this.gearElement) {
			return;
		}

		while (this.counterElements.length < settings.headerCounters.length) {
			const counterElement = createDiv({ cls: "kanban-header-count" });
			this.gearElement.before(counterElement);
			this.counterElements.push(counterElement);
		}

		while (this.counterElements.length > settings.headerCounters.length) {
			const counterElement = this.counterElements.pop();
			counterElement?.remove();
		}
	}

	private renderHeaderCounter(
		element: HTMLElement,
		headerCounter: HeaderCounter,
		tasks: Task[],
	) {
		const count = headerCounter.countTasks(tasks);
		const countText =
			headerCounter.maxTasks !== undefined
				? `${count}/${headerCounter.maxTasks}`
				: `${count}`;

		element.setText(`${headerCounter.label}: ${countText}`);
		element.setAttr("title", headerCounter.filterText);
		element.classList.toggle("highlight", headerCounter.isExceeded(count));
	}

	private render(tasks: Task[], settings: SettingValues) {
		this.synchroniseHeaderCounterElements(settings);

		if (!settings.headerCounters.length) {
			return;
		}

		for (const [
			headerCounterIndex,
			headerCounterSetting,
		] of settings.headerCounters.entries()) {
			const counterElement = this.counterElements[headerCounterIndex];
			if (!counterElement) {
				continue;
			}

			this.renderHeaderCounter(
				counterElement,
				new HeaderCounter(headerCounterSetting),
				tasks,
			);
		}
	}
}
