//

import { App, Modal, Setting } from "obsidian";

import {
	type ColumnSettings,
	type HeaderCounterSettings,
	type SettingValues,
} from "./settings_store";
import {
	columnColorDefinitions,
	columnColors,
	type ColumnColor,
} from "./column_colors";

export class SettingsModal extends Modal {
	constructor(
		app: App,
		private settings: SettingValues,
		private readonly onSubmit: (newSettings: SettingValues) => void
	) {
		super(app);
	}

	private addColumnColorDropdown(
		setting: Setting,
		selectedColor: ColumnColor,
		onChange: (columnColor: ColumnColor) => void,
	) {
		setting.addDropdown((dropdown) => {
			for (const columnColor of columnColors) {
				dropdown.addOption(
					columnColor,
					columnColorDefinitions[columnColor].label,
				);
			}
			dropdown.setValue(selectedColor);
			dropdown.onChange((value) => {
				onChange(value as ColumnColor);
			});
		});
	}

	private addColumnSettings(
		columnsContainer: HTMLElement,
		columnSettings: ColumnSettings,
		columnIndex: number,
	) {
		const columnContainer = columnsContainer.createDiv({
			cls: "kanban-column-settings",
		});

		new Setting(columnContainer)
			.setName(`Column ${columnIndex + 1}`)
			.setDesc("Configure this column or delete it.")
			.addButton((button) => {
				button
					.setIcon("trash")
					.setTooltip("Delete column")
					.onClick(() => {
						this.settings.columns.splice(columnIndex, 1);
						this.renderColumnSettings(columnsContainer);
					});
			});

		new Setting(columnContainer)
			.setName("Name")
			.addText((text) => {
				text.setValue(columnSettings.name);
				text.onChange((value) => {
					columnSettings.name = value;
				});
			});

		new Setting(columnContainer)
			.setName("Max tasks")
			.setDesc("Leave empty for no limit. Existing -1 values are also treated as no limit.")
			.addText((text) => {
				text.setPlaceholder("No limit");
				text.setValue(
					columnSettings.maxTasks === undefined || columnSettings.maxTasks === -1
						? ""
						: String(columnSettings.maxTasks),
				);
				text.onChange((value) => {
					const trimmedValue = value.trim();
					if (!trimmedValue) {
						columnSettings.maxTasks = undefined;
						return;
					}
					const maxTasks = Number.parseInt(trimmedValue, 10);
					if (maxTasks === -1) {
						columnSettings.maxTasks = undefined;
					} else if (!Number.isNaN(maxTasks) && maxTasks >= 0) {
						columnSettings.maxTasks = maxTasks;
					}
				});
			});

		const colorSetting = new Setting(columnContainer).setName("Color");
		this.addColumnColorDropdown(
			colorSetting,
			columnSettings.color,
			(columnColor) => {
				columnSettings.color = columnColor;
			},
		);
	}

	private renderColumnSettings(columnsContainer: HTMLElement) {
		columnsContainer.empty();

		new Setting(columnsContainer)
			.setName("Columns")
			.setDesc("Configure column names, task limits, and colors.")
			.addButton((button) => {
				button
					.setIcon("plus")
					.setTooltip("Add column")
					.onClick(() => {
						this.settings.columns.push({
							name: "New column",
							maxTasks: undefined,
							color: "none",
						});
						this.renderColumnSettings(columnsContainer);
					});
			});

		for (const [columnIndex, columnSettings] of this.settings.columns.entries()) {
			this.addColumnSettings(columnsContainer, columnSettings, columnIndex);
		}
	}

	private addHeaderCounterSettings(
		headerCountersContainer: HTMLElement,
		headerCounterSettings: HeaderCounterSettings,
		headerCounterIndex: number,
	) {
		const headerCounterContainer = headerCountersContainer.createDiv({
			cls: "kanban-header-counter-settings",
		});

		new Setting(headerCounterContainer)
			.setName(`Header counter ${headerCounterIndex + 1}`)
			.setDesc("Adjust this counter or delete it.")
			.addButton((button) => {
				button
					.setIcon("trash")
					.setTooltip("Delete header counter")
					.onClick(() => {
						this.settings.headerCounters.splice(headerCounterIndex, 1);
						this.renderHeaderCounterSettings(headerCountersContainer);
					});
			});

		new Setting(headerCounterContainer)
			.setName("Label")
			.setDesc("Text shown before this header counter.")
			.addText((text) => {
				text.setValue(headerCounterSettings.label);
				text.onChange((value) => {
					headerCounterSettings.label = value;
				});
			});

		new Setting(headerCounterContainer)
			.setName("Filter")
			.setDesc('Examples: "tags: #plan", "priority: #p0, #p1", "due: < today() + 7d tags: #plan"')
			.addText((text) => {
				text.setValue(headerCounterSettings.filter);
				text.onChange((value) => {
					headerCounterSettings.filter = value;
				});
			});

		new Setting(headerCounterContainer)
			.setName("Max")
			.setDesc("Max allowed for this counter. Empty means no max.")
			.addText((text) => {
				text.setPlaceholder("");
				text.setValue(
					headerCounterSettings.maxTasks === undefined
						? ""
						: String(headerCounterSettings.maxTasks)
				);
				text.onChange((value) => {
					const trimmedValue = value.trim();
					if (!trimmedValue) {
						headerCounterSettings.maxTasks = undefined;
						return;
					}
					const parsedMaxTasks = parseInt(trimmedValue, 10);
					headerCounterSettings.maxTasks = Number.isNaN(parsedMaxTasks)
						? undefined
						: Math.max(0, parsedMaxTasks);
				});
			});
	}

	private renderHeaderCounterSettings(headerCountersContainer: HTMLElement) {
		headerCountersContainer.empty();

		new Setting(headerCountersContainer)
			.setName("Header counters")
			.setDesc("Counters shown near the settings gear.")
			.addButton((button) => {
				button
					.setIcon("plus")
					.setTooltip("Add header counter")
					.onClick(() => {
						this.settings.headerCounters.push({
							label: "Counter",
							filter: "",
							maxTasks: undefined,
						});
						this.renderHeaderCounterSettings(headerCountersContainer);
					});
			});

		for (const [
			headerCounterIndex,
			headerCounterSettings,
		] of this.settings.headerCounters.entries()) {
			this.addHeaderCounterSettings(
				headerCountersContainer,
				headerCounterSettings,
				headerCounterIndex,
			);
		}
	}

	onOpen() {
		this.contentEl.addClass("kanban-settings-modal");
		this.contentEl.createEl("h1", { text: "Settings" });
		this.contentEl.createEl("h2", {
			text: "Column settings",
			cls: "kanban-settings-section-heading",
		});

		const columnsContainer = this.contentEl.createDiv({
			cls: "kanban-columns-settings",
		});
		this.renderColumnSettings(columnsContainer);

		const doneColumnSettingsContainer = this.contentEl.createDiv({
			cls: "kanban-setting-card",
		});
		const doneColumnColorSetting = new Setting(doneColumnSettingsContainer)
			.setName("Done column color")
			.setDesc("Color used by the built-in Done column.");
		this.addColumnColorDropdown(
			doneColumnColorSetting,
			this.settings.doneColumnColor,
			(columnColor) => {
				this.settings.doneColumnColor = columnColor;
			},
		);

		this.contentEl.createEl("h2", {
			text: "Header counter settings",
			cls: "kanban-settings-section-heading",
		});
		const headerCountersContainer = this.contentEl.createDiv({
			cls: "kanban-header-counters-settings",
		});
		this.renderHeaderCounterSettings(headerCountersContainer);

		this.contentEl.createEl("h2", {
			text: "Other settings",
			cls: "kanban-settings-section-heading",
		});
		const otherSettingsContainer = this.contentEl.createDiv({
			cls: "kanban-setting-card",
		});

		new Setting(otherSettingsContainer)
			.setName("Folder scope")
			.setDesc("Where should we try to find tasks for this Kanban?")
				.addDropdown((dropdown) => {
					dropdown.addOption("folder", "This folder");
					dropdown.addOption("everywhere", "Every folder");
					dropdown.setValue(this.settings.scope);
					dropdown.onChange((value) => {
						this.settings.scope = value as "folder" | "everywhere";
					});
				});

		new Setting(otherSettingsContainer)
			.setName("Show filepath")
			.setDesc("Show the filepath on each task in Kanban?")
			.addToggle((toggle) => {
				toggle.setValue(this.settings.showFilepath ?? true);
				toggle.onChange((value) => {
					this.settings.showFilepath = value;
				});
			});

		new Setting(otherSettingsContainer)
			.setName("Display tags in footer")
			.setDesc(
				"Display tags as badges in the footer? If off, tags remain in task text."
			)
			.addToggle((toggle) => {
				toggle.setValue(this.settings.displayTagsInFooter ?? true);
				toggle.onChange((value) => {
					this.settings.displayTagsInFooter = value;
				});
			});

		new Setting(otherSettingsContainer)
			.setName("Match Pattern")
			.setDesc("Pattern to match tasks during creation")
			.addText((text) => {
				text.setValue(this.settings.match_pattern ?? '');
				text.onChange((value) => {
					this.settings.match_pattern = value;
					console.log(`Match pattern set to: ${value}`);
				});
			});

		new Setting(otherSettingsContainer)
			.setName("No Match Pattern")
			.setDesc("Pattern to exclude tasks during creation")
			.addText((text) => {
				text.setValue(this.settings.no_match_pattern ?? '');
				text.onChange((value) => {
					this.settings.no_match_pattern = value;
				});
			});

		new Setting(otherSettingsContainer)
			.setName("Sort Order")
			.setDesc('Comma-separated list of sort criteria (e.g., "priority, dueDate, statusChanged"). Available: priority, dueDate, statusChanged, created, path, rowIndex')
			.addText((text) => {
				const sortOrder = this.settings.sortOrder ?? ["priority"];
				text.setValue(sortOrder.join(", "));
				text.onChange((value) => {
					this.settings.sortOrder = (value.split(",")
						.map(sortOrderValue => sortOrderValue.trim())
						.filter(sortOrderValue => ["priority", "dueDate", "statusChanged", "created", "path", "rowIndex"].includes(sortOrderValue))) as Array<"priority" | "dueDate" | "statusChanged" | "created" | "path" | "rowIndex">;
					// Ensure at least one sort order
					if (this.settings.sortOrder.length === 0) {
						this.settings.sortOrder = ["priority"];
					}
				});
			});

		new Setting(this.contentEl).addButton((button) =>
			button.setButtonText("Save").onClick(() => {
				this.close();
				this.onSubmit(this.settings);
			})
		);
	}

	onClose() {
		this.contentEl.empty();
	}
}
