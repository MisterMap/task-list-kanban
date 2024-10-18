<script lang="ts">
	import { Menu, setIcon } from "obsidian";
	import {
		type ColumnTag,
		type DefaultColumns,
		type ColumnTagTable,
		isColumnTag,
	} from "../columns/columns";
	import type { TaskActions } from "../tasks/actions";
	import type { Task } from "../tasks/task";
	import TaskComponent from "./task.svelte";
	import IconButton from "./icon_button.svelte";
	import { isDraggingStore } from "../dnd/store";
	import type { Readable } from "svelte/store";

	export let column: ColumnTag | DefaultColumns;
	export let hideOnEmpty: boolean = false;
	export let tasks: Task[];
	export let taskActions: TaskActions;
	export let columnTagTableStore: Readable<ColumnTagTable>;
	export let showFilepath: boolean;
	export let consolidateTags: boolean;

	function getColumnTitle(
		column: ColumnTag | DefaultColumns,
		columnTagTable: ColumnTagTable,
	) {
		switch (column) {
			case "done":
				return "Done";
			case "uncategorised":
				return "Uncategorised";
			default:
				return columnTagTable[column]?.name ?? "Undefined";
		}
	}

	$: columnTitle = getColumnTitle(column, $columnTagTableStore);

	function sortTasksByPriorityAndPath(a: Task, b: Task) {
		if (a.priority !== b.priority) {
			return a.priority - b.priority; // Sort by priority descending
		}
		if (a.path === b.path) {
			return a.rowIndex - b.rowIndex; // Sort by rowIndex if paths are the same
		}
		return a.path.localeCompare(b.path); // Sort by path
	}

	$: sortedTasks = tasks.sort(sortTasksByPriorityAndPath);

	function showMenu(e: MouseEvent) {
		const menu = new Menu();

		menu.addItem((i) => {
			i.setTitle(`Archive all`).onClick(() =>
				taskActions.archiveTasks(tasks.map(({ id }) => id)),
			);
		});

		menu.showAtMouseEvent(e);
	}

	let isDraggedOver = false;

	$: draggingData = $isDraggingStore;
	$: canDrop = draggingData && draggingData.fromColumn !== column;

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		if (!canDrop) {
			if (e.dataTransfer) {
				e.dataTransfer.dropEffect = "none";
			}
			return;
		}

		isDraggedOver = true;
		if (e.dataTransfer) {
			e.dataTransfer.dropEffect = "move";
		}
	}

	function handleDragLeave(e: DragEvent) {
		isDraggedOver = false;
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		if (!canDrop) {
			return;
		}

		// Get the id of the target and add the moved element to the target's DOM
		const droppedId = e.dataTransfer?.getData("text/plain");
		if (droppedId) {
			switch (column) {
				case "uncategorised":
					break;
				case "done":
					taskActions.markDone(droppedId);
					break;
				default:
					taskActions.changeColumn(droppedId, column);
					break;
			}
		}
	}

	function getMaxTasks(column: ColumnTag | DefaultColumns) {
		if (!isColumnTag(column, columnTagTableStore)) {
			return -1;
		}
		return $columnTagTableStore[column as ColumnTag]?.maxTasks ?? -1;
	}

	function isMoreThanMaxTasks(column: ColumnTag | DefaultColumns, tasks: Task[], columnTagTableStore: ColumnTagTable) {
		const maxTasks = getMaxTasks(column);
		if (maxTasks === -1) {
			return false;
		}
		return tasks.length > maxTasks;
	}

	function getTaskCountText(column: ColumnTag | DefaultColumns, tasks: Task[], columnTagTableStore: ColumnTagTable) {
		const maxTasks = getMaxTasks(column);
		if (maxTasks === -1) {
			return `${tasks.length}`;
		}
		return `${tasks.length} / ${maxTasks}`;
	}

	let buttonEl: HTMLSpanElement | undefined;

	$: {
		if (buttonEl) {
			setIcon(buttonEl, "lucide-plus");
		}
	}
</script>

{#if !hideOnEmpty || tasks.length}
	<div
		role="group"
		class="column"
		class:drop-active={!!draggingData}
		class:drop-hover={isDraggedOver}
		on:dragover={handleDragOver}
		on:dragleave={handleDragLeave}
		on:drop={handleDrop}
	>
		<div class="header">
			<h2>
				{columnTitle}
				<span class="task-count" class:highlight={isMoreThanMaxTasks(column, tasks, columnTagTableStore)}>
					{getTaskCountText(column, tasks, columnTagTableStore)}
				</span>
			</h2>
			{#if column === "done"}
				<IconButton icon="lucide-more-vertical" on:click={showMenu} />
			{/if}
		</div>
		<div class="tasks-wrapper">
			<div class="tasks">
				{#each sortedTasks as task}
					<TaskComponent
						{task}
						{taskActions}
						{columnTagTableStore}
						{showFilepath}
						{consolidateTags}
					/>
				{/each}
				{#if isColumnTag(column, columnTagTableStore)}
					<button
						on:click={async (e) => {
							if (isColumnTag(column, columnTagTableStore)) {
								await taskActions.addNew(column, e);
							}
						}}
					>
						<span bind:this={buttonEl} />
						Add new
					</button>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style lang="scss">
	.column {
		display: flex;
		flex-direction: column;
		align-self: flex-start;
		width: 240px;
		flex-shrink: 0;
		padding: 0;
		border-radius: var(--radius-m);
		background-color: white;
		border: none;

		&.drop-active {
			.tasks-wrapper {
				.tasks {
					opacity: 0.4;
				}
			}

			&.drop-hover {
				.tasks-wrapper {
					border-color: var(--color-base-70);
				}
			}
		}

		.header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			height: 36px;
			flex-shrink: 0;

			h2 {
				font-size: var(--font-ui-larger);
				font-weight: var(--font-bold);
				margin: 0;

				.task-count {
					background-color: var(--color-accent);
					color: white;
					border-radius: 12px;
					padding: 0 8px;
					font-size: 0.8em;
					margin-left: 8px;
					font-weight: var(--font-normal); // Added this line to make the font less bold

					&.highlight {
						background-color: coral;
						color: white;
					}
				}
			}
		}

		.tasks-wrapper {
			height: 100%;
			min-height: 50px;
			border: var(--border-width) dashed transparent;
			border-radius: var(--radius-m);

			.tasks {
				display: flex;
				flex-direction: column;
				gap: var(--size-4-3);

				button {
					display: flex;
					align-items: center;
					cursor: pointer;
					box-shadow: none; // Add this line to remove the shadow

					span {
						height: 18px;
					}
				}
			}
		}
	}


</style>
