<script lang="ts">
	import type { ColumnTagTable } from "../columns/columns";
	import { isDraggingStore } from "../dnd/store";
	import type { TaskActions } from "../tasks/actions";
	import type { Task } from "../tasks/task";
	import TaskMenu from "./task_menu.svelte";
	import { Converter } from "showdown";
	import type { Readable } from "svelte/store";
	import { formatDate } from "../tasks/date_utils";

	export let task: Task;
	export let taskActions: TaskActions;
	export let columnTagTableStore: Readable<ColumnTagTable>;
	export let consolidateTags: boolean;
	import sha256 from "crypto-js/sha256";

	const mdConverted = new Converter({
		simplifiedAutoLink: true,
		openLinksInNewWindow: true,
		emoji: true,
	});

	function getEditableContent(task: Task): string {
		let editable = task.content.replaceAll("<br />", "\n");
		
		// Add tags
		if (task.tags.size > 0) {
			editable += " " + Array.from(task.tags).map(tag => `#${tag}`).join(" ");
		}
		
		// Add due date
		if (task.dueDate) {
			editable += " " + formatDate(task.dueDate);
		}
		
		return editable;
	}

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

	const priorityColors = {
		0: 'var(--color-p0)',
		1: 'var(--color-p1)',
		2: 'var(--color-p2)',
		default: 'var(--color-p3)'
	};

	function getPriorityColor(priority: number): string {
		return priorityColors[priority as keyof typeof priorityColors] || priorityColors.default;
	}

	function getDueDateColor(dueDate: Date): string {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const tomorrow = new Date(today);
		tomorrow.setDate(tomorrow.getDate() + 1);
		const next7days = new Date(today);
		next7days.setDate(next7days.getDate() + 7);

		if (dueDate < today) {
			return 'var(--color-p0-background)'; // past due - red
		} else if (dueDate < tomorrow) {
			return 'var(--color-p1-background)'; // due today - orange
		} else if (dueDate < next7days) {
			return 'var(--color-p2-background)'; // due in the future - blue
		} else {
			return 'var(--color-p3-background)'; // due more than 7 days from now - grey
		}
	}

	function getTagColor(tag: string): string {
		const tagIndex = parseInt(sha256(tag).toString().slice(0, 8), 16) % 8 + 1;
		return `var(--color-tag${tagIndex}-background)`;
	}

	function getPriorityBorderWidth(priority: number): string {
		return priority < 3 ? 'var(--priority-task-border-width)' : 'var(--border-width)';
	}
</script>

<div
	class="task"
	class:is-dragging={isDragging}
	role="group"
	draggable={!isEditing}
	on:dragstart={handleDragStart}
	on:dragend={handleDragEnd}
	style="border: {getPriorityBorderWidth(task.priority)} solid {priorityColor};"
>
	<div class="task-body">
		<div>
			<div class="task-content">
				{#if isEditing}
					<textarea
						class:editing={isEditing}
						bind:this={textAreaEl}
						on:keypress={handleKeypress}
						on:blur={handleContentBlur}
						on:input={onInput}
						value={getEditableContent(task)}
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
					</div>
				{/if}
			</div>
			<div class="task-project">
				<p title={task.path}>{task.fileName}</p>
			</div>
			{#if task.dueDate || task.tags.size > 0}
			<div class="task-tags">
				{#if task.dueDate}
					<span>
						<span class="tag-text" style="background-color: {getDueDateColor(task.dueDate)};">
							{formatDate(task.dueDate)}
						</span>
					</span>
				{/if}
				{#each task.tags as tag}
					<span>
						<span class="tag-text"
							style="background-color: {getTagColor(tag)};">
							#{tag}
						</span>
					</span>
				{/each}
			</div>
			{/if}
		</div>
		<TaskMenu {task} {taskActions} {columnTagTableStore} menuColor={priorityColor} />
	</div>
</div>

<style lang="scss">
	.task {
		--border-width: 1px;
		--priority-task-border-width: 2px;
		background-color: white;
		border-radius: var(--radius-m);
		border: var(--border-width) solid var(--background-modifier-border);
		cursor: grab;
		padding: var(--size-4-2);

		&.is-dragging {
			opacity: 0.15;
		}

		.task-body {
			padding: 0;
			display: grid;
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
			}

			.task-project {
				padding-top: var(--size-4-2);

				p {
					margin: 0;
					font-size: var(--font-ui-smaller);
				}
			}

			.task-tags {
				display: flex;
				flex-wrap: wrap;
				gap: var(--size-4-1) var(--size-2-1);
				padding-top: var(--size-4-2);

				.tag-text {
					font-size: var(--font-ui-smaller);
					border-width: 0;
					border-style: solid;
					padding: 0.2em 0.4em;
					border-radius: 1em;
					color: var(--text-normal);
				}
			}	
		}
	}

	:global(.task-content *) {
		word-break: break-word;
		margin: 0;
	}
</style>
