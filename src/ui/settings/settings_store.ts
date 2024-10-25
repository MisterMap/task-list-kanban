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
});

export type SettingValues = z.infer<typeof settingsObject>;

const defaultSettings: SettingValues = {
	columns: [{ name: "Later", maxTasks: 10 }, { name: "Soonish", maxTasks: 10 }, { name: "Next week", maxTasks: 10 }, { name: "This week", maxTasks: 10 }, { name: "Today", maxTasks: 10 }, { name: "Pending", maxTasks: 10 }],
	scope: "folder",
	showFilepath: true,
	consolidateTags: false,
	match_pattern: '',
	no_match_pattern: '',
};

export const createSettingsStore = () =>
	writable<SettingValues>(defaultSettings);

export function parseSettingsString(str: string): SettingValues {
	try {
		return (
			settingsObject.safeParse(JSON.parse(str)).data ?? defaultSettings
		);
	} catch {
		return defaultSettings;
	}
}

export function toSettingsString(settings: SettingValues): string {
	return JSON.stringify(settings);
}
