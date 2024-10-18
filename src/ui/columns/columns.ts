import type { Brand } from "src/brand";
import { kebab } from "src/parsing/kebab/kebab";
import { derived, get, type Readable, type Writable } from "svelte/store";
import type { SettingValues } from "../settings/settings_store";

export type DefaultColumns = "uncategorised" | "done";
export type ColumnTag = Brand<string, "ColumnTag">;

export type ColumnTagTable = Record<ColumnTag, { name: string; maxTasks: number }>;

export const createColumnTagTableStore = (
	settingsStore: Writable<SettingValues>
): Readable<ColumnTagTable> => {
	return derived([settingsStore], ([settings]) => {
		const output: ColumnTagTable = {};

		for (const column of settings.columns ?? []) {
			output[kebab<ColumnTag>(column.name)] = column;
		}

		return output;
	});
};

export function isColumnTag(
	input: ColumnTag | DefaultColumns,
	columnTagTableStore: Readable<ColumnTagTable>
): input is ColumnTag {
	return input in get(columnTagTableStore);
}
