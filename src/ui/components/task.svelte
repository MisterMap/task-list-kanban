<script lang="ts">
	import type { ColumnTagTable } from "../columns/columns";
	import { isDraggingStore } from "../dnd/store";
	import type { TaskActions } from "../tasks/actions";
	import type { Task } from "../tasks/task";
	import TaskMenu from "./task_menu.svelte";
	import { Converter } from "showdown";
	import type { Readable } from "svelte/store";

	export let task: Task;
	export let taskActions: TaskActions;
	export let columnTagTableStore: Readable<ColumnTagTable>;
	export let showFilepath: boolean;
	export let consolidateTags: boolean;

	const mdConverted = new Converter({
		simplifiedAutoLink: true,
		openLinksInNewWindow: true,
		emoji: true,
	});

	function handleContentBlur() {
		isEditing = false;

		const content = textAreaEl?.value;
		if (!content) return;

		const updatedContent = content.replaceAll("\n", "<br />");

		taskActions.updateContent(task.id, updatedContent);
	}

	function handleKeypress(e: KeyboardEvent) {
		if ((e.key === "Enter" && !e.shiftKey) || e.key === "Escape") {
			textAreaEl?.blur();
		}
	}

	function handleOpenKeypress(e: KeyboardEvent) {
		if (e.key === "Enter" || e.key === " ") {
			handleFocus();
		}
	}

	let isDragging = false;
	let isEditing = false;

	function handleDragStart(e: DragEvent) {
		handleContentBlur();
		isDragging = true;
		isDraggingStore.set({ fromColumn: task.column });
		if (e.dataTransfer) {
			e.dataTransfer.setData("text/plain", task.id);
			e.dataTransfer.dropEffect = "move";
		}
	}

	function handleDragEnd() {
		isDragging = false;
		isDraggingStore.set(null);
	}

	let textAreaEl: HTMLTextAreaElement | undefined;
	let mdContent: string;

	function handleFocus(e?: MouseEvent) {
		const target = (e?.target || e?.currentTarget) as
			| HTMLElement
			| undefined;
		if (target?.tagName.toLowerCase() === "a") {
			return;
		}

		isEditing = true;

		setTimeout(() => {
			textAreaEl?.focus();
		}, 100);
	}

	$: {
		mdContent = mdConverted.makeHtml(
			task.content + (task.blockLink ? ` ^${task.blockLink}` : ""),
		);
	}

	$: {
		if (textAreaEl) {
			textAreaEl.style.height = `0px`;
			textAreaEl.style.height = `${textAreaEl.scrollHeight}px`;
		}
	}

	function onInput(e: Event & { currentTarget: HTMLTextAreaElement }) {
		e.currentTarget.style.height = `0px`;
		e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
	}

	$: shouldconsolidateTags = consolidateTags && (task.tags.size > 0 || task.dueDate);

	$: priorityColor = getPriorityColor(task.priority);
	$: borderWidth = getBorderWidth(task.priority);

	const priorityColors = {
		0: 'var(--color-p0)',
		1: 'var(--color-p1)',
		2: 'var(--color-p2)',
		default: 'var(--background-modifier-border)'
	};

	function getPriorityColor(priority: number): string {
		return priorityColors[priority as keyof typeof priorityColors] || priorityColors.default;
	}

	function getBorderWidth(priority: number): string {
		return priority >= 0 && priority <= 2 ? '1.5px' : 'var(--border-width)';
	}

	function getDueDateBackgroundColor(dueDate: Date): string {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const tomorrow = new Date(today);
		tomorrow.setDate(tomorrow.getDate() + 1);

		if (dueDate < today) {
			return 'var(--color-p0)'; // past due
		} else if (dueDate < tomorrow) {
			return 'var(--color-p1)'; // due today
		} else {
			return 'var(--color-p2)'; // due in the future
		}
	}

	function getDueDateHighlightColor(dueDate: Date): string {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const tomorrow = new Date(today);
		tomorrow.setDate(tomorrow.getDate() + 1);

		if (dueDate < today) {
			return 'var(--color-p0)'; // past due - red
		} else if (dueDate < tomorrow) {
			return 'var(--color-p1)'; // due today - orange
		} else {
			return 'var(--color-p2)'; // due in the future - blue
		}
	}
</script>

<div
	class="task"
	class:is-dragging={isDragging}
	role="group"
	draggable={!isEditing}
	on:dragstart={handleDragStart}
	on:dragend={handleDragEnd}
	style="border: {borderWidth} solid {priorityColor};"
>
	<div class="task-body">
		<div class="task-content">
			{#if isEditing}
					<textarea
						class:editing={isEditing}
						bind:this={textAreaEl}
						on:keypress={handleKeypress}
						on:blur={handleContentBlur}
						on:input={onInput}
						value={task.content.replaceAll("<br />", "\n")}
					/>
			{:else}
				<div
					role="button"
					class="content-preview"
					on:mouseup={handleFocus}
					on:keypress={handleOpenKeypress}
					tabindex="0"
				>
					{@html mdContent}
					{#if shouldconsolidateTags}
						<div class="task-meta-line">
							{#if task.dueDate}
								<span 
									class="due-date-text"
									style="border-bottom-color: {getDueDateHighlightColor(task.dueDate)};"
								>
									{task.dueDate.toISOString().split('T')[0]}
								</span>
							{/if}
							{#each task.tags as tag}
								<span class="tag-text">#{tag}</span>
							{/each}
						</div>
					{/if}
				</div>
			{/if}
		</div>
		<TaskMenu {task} {taskActions} {columnTagTableStore} menuColor={priorityColor} />
	</div>
	{#if showFilepath}
		<div class="task-footer">
			<p title={task.path}>{task.fileName}</p>
		</div>
	{/if}
</div>

<style lang="scss">
	.task {
		background-color: white;
		border-radius: var(--radius-m);
		border: var(--border-width) solid var(--background-modifier-border);
		cursor: grab;

		&.is-dragging {
			opacity: 0.15;
		}

		.task-body {
			padding: var(--size-4-2);
			display: grid;
			// gap: var(--size-4-2);
			grid-template-columns: 1fr auto;

			p {
				word-break: break-word;
				margin: 0;
			}

			.task-content {
				display: grid;

				textarea {
					cursor: text;
					background-color: var(--color-base-25);
					width: 100%;
					font-size: var(--font-ui-small);
				}

				.content-preview {
					font-size: var(--font-ui-small);
					&:focus-within {
						box-shadow: 0 0 0 3px
							var(--background-modifier-border-focus);
					}
				}

				.task-meta-line {
					margin-top: var(--size-4-1);
					display: flex;
					flex-wrap: wrap;
					gap: var(--size-4-1) var(--size-2-1);
					align-items: center;

					.due-date-text {
						font-size: var(--font-ui-small);
						color: black;
						border-bottom: 1px solid;
						padding-bottom: 1px;
					}

					.tag-text {
						display: inline;
						color: var(--text-accent);
					}
				}
			}
		}

		.task-footer {
			padding: var(--size-4-2);
			padding-top: 0;

			p {
				margin: 0;
				font-size: var(--font-ui-smaller);
			}
		}

	}

	:global(.task-content *) {
		word-break: break-word;
		margin: 0;
	}
</style>
