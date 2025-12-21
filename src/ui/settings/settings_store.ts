//

import { writable } from "svelte/store";
import { z } from "zod";

const settingsObject = z.object({
	columns: z.array(z.object({ name: z.string(), maxTasks: z.number().default(10) })),
	scope: z.union([z.literal("everywhere"), z.literal("folder")]),
	showFilepath: z.boolean().default(true).optional(),
	consolidateTags: z.boolean().default(false).optional(),
	match_pattern: z.string().optional(),
	no_match_pattern: z.string().optional(),
	sortOrder: z.array(z.union([
		z.literal("priority"),
		z.literal("dueDate"),
		z.literal("statusChanged"),
		z.literal("created"),
		z.literal("path"),
		z.literal("rowIndex"),
	])).default(["priority"]).optional(),
});

export type SettingValues = z.infer<typeof settingsObject>;

const defaultSettings: SettingValues = {
	columns: [{ name: "Later", maxTasks: 10 }, { name: "Soonish", maxTasks: 10 }, { name: "Next week", maxTasks: 10 }, { name: "This week", maxTasks: 10 }, { name: "Today", maxTasks: 10 }, { name: "Pending", maxTasks: 10 }],
	scope: "folder",
	showFilepath: true,
	consolidateTags: false,
	match_pattern: '',
	no_match_pattern: '',
	sortOrder: ["priority"],
};

export const createSettingsStore = () =>
	writable<SettingValues>(defaultSettings);

export function parseSettingsString(str: string): SettingValues {
	try {
		const parsed = JSON.parse(str);
		// Migrate old string sortOrder to array format
		if (parsed.sortOrder && typeof parsed.sortOrder === "string") {
			parsed.sortOrder = [parsed.sortOrder];
		}
		const result = settingsObject.safeParse(parsed);
		return result.data ?? defaultSettings;
	} catch {
		return defaultSettings;
	}
}

export function toSettingsString(settings: SettingValues): string {
	return JSON.stringify(settings);
}
