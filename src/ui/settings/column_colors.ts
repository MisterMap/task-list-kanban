import { z } from "zod";

export const columnColorDefinitions = {
	none: {
		label: "No color",
		cssValue: "var(--background-primary)",
	},
	blue: {
		label: "Blue",
		cssValue: "var(--color-p2-background)",
	},
	orange: {
		label: "Orange",
		cssValue: "var(--color-p1-background)",
	},
	green: {
		label: "Green",
		cssValue: "var(--color-done-background)",
	},
} as const;

export type ColumnColor = keyof typeof columnColorDefinitions;

export const columnColors = Object.keys(columnColorDefinitions) as ColumnColor[];

export const columnColorObject = z.enum(
	columnColors as [ColumnColor, ...ColumnColor[]],
);

export function getColumnColorValue(columnColor: ColumnColor): string {
	return columnColorDefinitions[columnColor]?.cssValue
		?? columnColorDefinitions.none.cssValue;
}
