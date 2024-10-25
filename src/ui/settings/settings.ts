//

import { App, Modal, Setting } from "obsidian";

import type { SettingValues } from "./settings_store";

export class SettingsModal extends Modal {
	constructor(
		app: App,
		private settings: SettingValues,
		private readonly onSubmit: (newSettings: SettingValues) => void
	) {
		super(app);
	}
	onOpen() {
		this.contentEl.createEl("h1", { text: "Settings" });

		new Setting(this.contentEl)
			.setName("Columns")
			.setDesc('The column names and max tasks separated by a comma "," and colon ":" for max tasks')
			.setClass("column")
			.addText((text) => {
				text.setValue(this.settings.columns.map(c => `${c.name}:${c.maxTasks}`).join(", "));
				text.onChange((value) => {
					this.settings.columns = value.split(",").map((column) => {
						const [name, maxTasks] = column.split(":");
						return { name: name?.trim() ?? "", maxTasks: parseInt(maxTasks ?? "10", 10) || 10 };
					});
				});
			});

		new Setting(this.contentEl)
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

		new Setting(this.contentEl)
			.setName("Show filepath")
			.setDesc("Show the filepath on each task in Kanban?")
			.addToggle((toggle) => {
				toggle.setValue(this.settings.showFilepath ?? true);
				toggle.onChange((value) => {
					this.settings.showFilepath = value;
				});
			});

		new Setting(this.contentEl)
			.setName("Consolidate tags")
			.setDesc(
				"Consolidate the tags on each task in Kanban into the footer?"
			)
			.addToggle((toggle) => {
				toggle.setValue(this.settings.consolidateTags ?? false);
				toggle.onChange((value) => {
					this.settings.consolidateTags = value;
				});
			});

		new Setting(this.contentEl)
			.setName("Match Pattern")
			.setDesc("Pattern to match tasks during creation")
			.addText((text) => {
				text.setValue(this.settings.match_pattern ?? '');
				text.onChange((value) => {
					this.settings.match_pattern = value;
					console.log(`Match pattern set to: ${value}`);
				});
			});

		new Setting(this.contentEl)
			.setName("No Match Pattern")
			.setDesc("Pattern to exclude tasks during creation")
			.addText((text) => {
				text.setValue(this.settings.no_match_pattern ?? '');
				text.onChange((value) => {
					this.settings.no_match_pattern = value;
				});
			});

		new Setting(this.contentEl).addButton((btn) =>
			btn.setButtonText("Save").onClick(() => {
				this.close();
				this.onSubmit(this.settings);
			})
		);
	}

	onClose() {
		this.contentEl.empty();
	}
}
