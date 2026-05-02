//

import { writable } from "svelte/store";
import { z } from "zod";

const defaultColumns = [{ name: "Later", maxTasks: 10 }, { name: "Soonish", maxTasks: 10 }, { name: "Next week", maxTasks: 10 }, { name: "This week", maxTasks: 10 }, { name: "Today", maxTasks: 10 }, { name: "Pending", maxTasks: 10 }];

const totalHeaderCounterDefaults = {
	label: "Total",
	filter: "due: < today() + 7d",
	maxTasks: undefined as number | undefined,
};

const criticalHeaderCounterDefaults = {
	label: "Critical",
	filter: "due: < today() + 7d priority: #p0, #p1, #p2",
	maxTasks: undefined as number | undefined,
};

const defaultHeaderCounters = [
	totalHeaderCounterDefaults,
	criticalHeaderCounterDefaults,
];

function createDefaultColumns() {
	return defaultColumns.map((column) => ({ ...column }));
}

function createDefaultHeaderCounters() {
	return defaultHeaderCounters.map((headerCounter) => ({ ...headerCounter }));
}

const headerCounterSettingsObject = z.object({
	label: z.string().default(""),
	filter: z.string().default(""),
	maxTasks: z.number().int().nonnegative().optional(),
});

const settingsObject = z.object({
	columns: z.array(z.object({ name: z.string(), maxTasks: z.number().default(10) })).default(createDefaultColumns),
	scope: z.union([z.literal("everywhere"), z.literal("folder")]).default("folder"),
	showFilepath: z.boolean().default(true).optional(),
	displayTagsInFooter: z.boolean().default(false).optional(),
	totalNextWeekMax: z.number().int().nonnegative().optional(),
	criticalNextWeekMax: z.number().int().nonnegative().optional(),
	headerCounters: z.array(headerCounterSettingsObject).default(createDefaultHeaderCounters),
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
export type HeaderCounterSettings = SettingValues["headerCounters"][number];

const defaultSettings: SettingValues = {
	columns: createDefaultColumns(),
	scope: "folder",
	showFilepath: true,
	displayTagsInFooter: false,
	totalNextWeekMax: undefined,
	criticalNextWeekMax: undefined,
	headerCounters: createDefaultHeaderCounters(),
	match_pattern: '',
	no_match_pattern: '',
	sortOrder: ["priority"],
};

function createDefaultSettings(): SettingValues {
	return {
		...defaultSettings,
		columns: createDefaultColumns(),
		headerCounters: createDefaultHeaderCounters(),
	};
}

export const createSettingsStore = () =>
	writable<SettingValues>(createDefaultSettings());

export function parseSettingsString(str: string): SettingValues {
	try {
		const parsed = JSON.parse(str);
		// Migrate old string sortOrder to array format
		if (parsed.sortOrder && typeof parsed.sortOrder === "string") {
			parsed.sortOrder = [parsed.sortOrder];
		}
		if (!parsed.headerCounters) {
			const totalHeaderCounter = parsed.firstHeaderCounter ?? {
				...totalHeaderCounterDefaults,
				maxTasks: parsed.totalNextWeekMax,
			};
			const criticalHeaderCounter = parsed.secondHeaderCounter ?? {
				...criticalHeaderCounterDefaults,
				maxTasks: parsed.criticalNextWeekMax,
			};
			parsed.headerCounters = [totalHeaderCounter, criticalHeaderCounter];
		}
		const result = settingsObject.safeParse(parsed);
		return result.data ?? createDefaultSettings();
	} catch {
		return createDefaultSettings();
	}
}

export function toSettingsString(settings: SettingValues): string {
	return JSON.stringify(settings);
}
