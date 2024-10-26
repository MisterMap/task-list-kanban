<script lang="ts">
	import { Menu } from "obsidian";
	import { type ColumnTag, type ColumnTagTable } from "../columns/columns";
	import type { Task } from "../tasks/task";
	import type { TaskActions } from "../tasks/actions";
	import IconButton from "./icon_button.svelte";
	import type { Readable } from "svelte/store";

	export let task: Task;
	export let taskActions: TaskActions;
	export let columnTagTableStore: Readable<ColumnTagTable>;
	export let menuColor: string = "var(--color-base-50)";

	function showMenu(e: MouseEvent) {
		const menu = new Menu();

		const target = e.target as HTMLButtonElement | undefined;
		if (!target) {
			return;
		}

		const boundingRect = target.getBoundingClientRect();
		const y = boundingRect.top + boundingRect.height / 2;
		const x = boundingRect.left + boundingRect.width / 2;

		menu.addItem((i) => {
			i.setTitle(`Go to file`).onClick(() =>
				taskActions.viewFile(task.id),
			);
		});

		menu.addItem((i) => {
			i.setTitle(`Move to Done`).onClick(() =>
				taskActions.markDone(task.id),
			);
			if (task.done) {
				i.setDisabled(true);
			}
		});

		menu.addSeparator();

		for (const [tag, label] of Object.entries($columnTagTableStore)) {
			menu.addItem((i) => {
				i.setTitle(`Move to ${label.name}`).onClick(() =>
					taskActions.changeColumn(task.id, tag as ColumnTag),
				);
				if (task.column === tag) {
					i.setDisabled(true);
				}
			});
		}

		menu.addSeparator();

		// Add priority menu items
		for (let priority = 0; priority <= 3; priority++) {
			menu.addItem((i) => {
				i.setTitle(`p${priority}`).onClick(() =>
					taskActions.updatePriority(task.id, priority),
				);
				if (task.priority === priority) {
					i.setDisabled(true);
				}
			});
		}
		menu.addSeparator();

		menu.addItem((i) => {
			i.setTitle("Today").onClick(() => {
				const today = new Date();
				taskActions.updateDueDate(task.id, today);
			});
		});

		menu.addItem((i) => {
			i.setTitle("Tomorrow").onClick(() => {
				const tomorrow = new Date();
				tomorrow.setDate(tomorrow.getDate() + 1);
				taskActions.updateDueDate(task.id, tomorrow);
			});
		});

		menu.addItem((i) => {
			i.setTitle("Remove due date").onClick(() => {
				taskActions.updateDueDate(task.id, null);
			});
		});

		menu.addSeparator();

		menu.addItem((i) => {
			i.setTitle("Change project").onClick((event) => {
				taskActions.changeProject(task.id, event as MouseEvent);
			});
		});

		menu.addSeparator();

		menu.addItem((i) => {
			i.setTitle(`Archive task`).onClick(() =>
				taskActions.archiveTasks([task.id]),
			);
		});

		menu.addItem((i) => {
			i.setTitle(`Delete task`).onClick(() =>
				taskActions.deleteTask(task.id),
			);
		});

		menu.showAtPosition({ x, y });
	}
</script>

<IconButton icon="lucide-more-vertical" on:click={showMenu} {menuColor} />
