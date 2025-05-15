import {
	MarkdownView,
	Menu,
	TFile,
	type Vault,
	type Workspace,
} from "obsidian";
import type { Task } from "./task";
import type { Metadata } from "./tasks";
import type { ColumnTag } from "../columns/columns";
import type { SettingValues } from "../settings/settings_store";
import { get, type Readable } from "svelte/store";

export type TaskActions = {
	changeColumn: (id: string, column: ColumnTag) => Promise<void>;
	markDone: (id: string) => Promise<void>;
	updateContent: (id: string, content: string) => Promise<void>;
	viewFile: (id: string) => Promise<void>;
	archiveTasks: (ids: string[]) => Promise<void>;
	deleteTask: (ids: string) => Promise<void>;
	addNew: (column: ColumnTag, e: MouseEvent) => Promise<void>;
	updatePriority: (id: string, priority: number) => Promise<void>;
	updateDueDate: (id: string, dueDate: Date | null) => Promise<void>;
	changeProject: (id: string, e: MouseEvent) => Promise<void>;
};

export function createTaskActions({
	tasksByTaskId,
	metadataByTaskId,
	vault,
	workspace,
	settingsStore,
}: {
	tasksByTaskId: Map<string, Task>;
	metadataByTaskId: Map<string, Metadata>;
	vault: Vault;
	workspace: Workspace;
	settingsStore: Readable<SettingValues>;
}): TaskActions {
	async function updateRowWithTask(
		id: string,
		updater: (task: Task) => void
	) {
		const metadata = metadataByTaskId.get(id);
		const task = tasksByTaskId.get(id);

		if (!metadata || !task) {
			return;
		}

		updater(task);

		const newTaskString = task.serialise();
		await updateRow(
			vault,
			metadata.fileHandle,
			metadata.rowIndex,
			newTaskString
		);
	}

	interface Folder {
		[label: string]: Folder | TFile;
	}

	function createFolderStructure(): Folder {
		const files = vault
			.getMarkdownFiles()
			.sort((a, b) => a.path.localeCompare(b.path));
		const folder: Folder = {};
	
		for (const file of files) {
			const segments = file.path.split("/");
	
			let currFolder = folder;
			for (const [i, segment] of segments.entries()) {
				if (i === segments.length - 1) {
					currFolder[segment] = file;
				} else {
					const nextFolder = currFolder[segment] || {};
					if (nextFolder instanceof TFile) {
						continue;
					}
					currFolder[segment] = nextFolder;
					currFolder = nextFolder;
				}
			}
		}
	
		return folder;
	}

	function createMenuForFolder(folder: Folder, event: MouseEvent, onFileSelect: (file: TFile) => void) {
		const target = event.target as HTMLButtonElement | undefined;
		console.log('Event target:', target);
		let x = 0;
		let y = 0;
		if (target) {
			const boundingRect = target.getBoundingClientRect();
			y = boundingRect.top + boundingRect.height / 2;
			x = boundingRect.left + boundingRect.width / 2;
		} else {
			console.warn('No target found in event');
		}

		function createMenu(folderItem: Folder | TFile, parentMenu: Menu | undefined) {
			const menu = new Menu();
			const { match_pattern, no_match_pattern } = get(settingsStore);

			// Collect all files first
			const allFiles: TFile[] = [];
			function collectFiles(folderItem: Folder | TFile) {
				if (folderItem instanceof TFile) {
					if (match_pattern && !folderItem.name.match(match_pattern)) return;
					if (no_match_pattern && folderItem.name.match(no_match_pattern)) return;
					allFiles.push(folderItem);
					return;
				}
				for (const item of Object.values(folderItem)) {
					collectFiles(item);
				}
			}
			collectFiles(folderItem);

			// Sort all files by name
			allFiles.sort((a, b) => a.name.localeCompare(b.name));

			// Add sorted files to menu
			for (const file of allFiles) {
				menu.addItem((i) => {
					i.setTitle(file.name)
						.onClick(() => onFileSelect(file));
				});
			}

			menu.showAtPosition({ x, y });
		}
		createMenu(folder, undefined);
	}

	return {
		async changeColumn(id, column) {
			await updateRowWithTask(id, (task) => (task.column = column));
		},

		async markDone(id) {
			await updateRowWithTask(id, (task) => (task.done = true));
		},

		async updateContent(id, content) {
			console.log("Updating task content:", content);
			await updateRowWithTask(id, (task) => (task.content = content));
		},

		async archiveTasks(ids) {
			for (const id of ids) {
				await updateRowWithTask(id, (task) => task.archive());
			}
		},

		async deleteTask(id) {
			await updateRowWithTask(id, (task) => task.delete());
		},

		async viewFile(id) {
			const metadata = metadataByTaskId.get(id);

			if (!metadata) {
				return;
			}

			const { fileHandle, rowIndex } = metadata;

			const leaf = workspace.getLeaf("tab");
			await leaf.openFile(fileHandle);

			const editorView = workspace.getActiveViewOfType(MarkdownView);
			editorView?.editor.setCursor(rowIndex);
		},

		async addNew(column, event) {
			const folder = createFolderStructure();
			createMenuForFolder(folder, event, (file) => {
				updateRow(
					vault,
					file,
					undefined,
					`- [ ]  #${column}`
				);
			});
		},

		async updatePriority(id, priority) {
			await updateRowWithTask(id, (task) => (task.priority = priority));
		},

		async updateDueDate(id, dueDate) {
			await updateRowWithTask(id, (task) => (task.dueDate = dueDate));
		},

		async changeProject(id: string, event: MouseEvent) {
			console.log("Changing project for task:", id);
			console.log("Event: ", event);
			const task = tasksByTaskId.get(id);
			if (!task) {
				console.log("Task not found:", id);
				return;
			}
			const folder = createFolderStructure();
			createMenuForFolder(folder, event, (file) => {
				console.log("Selected new file:", file.path);
				const newTaskString = task?.serialise();
				if (!newTaskString) {
					console.log("Failed to serialise task");
					return;
				}
				console.log("Moving task to new file with content: ", newTaskString);
				updateRow(vault, file, undefined, newTaskString);

				// Delete the old task
				console.log("Deleting task from original location");
				updateRowWithTask(id, (task) => task.delete());
			});
		},
	};
}


async function updateRow(
	vault: Vault,
	fileHandle: TFile,
	row: number | undefined,
	newText: string
) {
	const file = await vault.read(fileHandle);
	const rows = file.split("\n");

	if (row == null) {
		row = rows.length;
	}

	if (rows.length < row) {
		return;
	}

	if (newText === "") {
		rows.splice(row, 1);
	} else {
		rows[row] = newText;
	}
	const newFile = rows.join("\n");
	await vault.modify(fileHandle, newFile);
}
