import { describe, expect, it } from "vitest";
import { parseSettingsString } from "../settings_store";

describe("settings store", () => {
	it("uses adjustable header counter defaults", () => {
		const settings = parseSettingsString("{}");

		expect(settings.headerCounters).toEqual([
			{
				label: "Total",
				filter: "due: < today() + 7d",
				maxTasks: undefined,
			},
			{
				label: "Critical",
				filter: "due: < today() + 7d priority: #p0, #p1, #p2",
				maxTasks: undefined,
			},
		]);
	});

	it("migrates old max settings into header counters", () => {
		const settings = parseSettingsString(
			JSON.stringify({
				totalNextWeekMax: 7,
				criticalNextWeekMax: 3,
			}),
		);

		expect(settings.headerCounters[0]?.maxTasks).toBe(7);
		expect(settings.headerCounters[1]?.maxTasks).toBe(3);
	});

	it("migrates previous fixed header counter settings", () => {
		const settings = parseSettingsString(
			JSON.stringify({
				firstHeaderCounter: {
					label: "Plan",
					filter: "tags: #plan",
					maxTasks: 4,
				},
				secondHeaderCounter: {
					label: "Priority zero",
					filter: "priority: #p0",
					maxTasks: 2,
				},
			}),
		);

		expect(settings.headerCounters).toEqual([
			{
				label: "Plan",
				filter: "tags: #plan",
				maxTasks: 4,
			},
			{
				label: "Priority zero",
				filter: "priority: #p0",
				maxTasks: 2,
			},
		]);
	});

	it("keeps custom header counter arrays", () => {
		const settings = parseSettingsString(
			JSON.stringify({
				headerCounters: [
					{
						label: "Plan",
						filter: "tags: #plan",
						maxTasks: 5,
					},
					{
						label: "Priority zero",
						filter: "priority: #p0",
					},
					{
						label: "Fixes",
						filter: "tags: #fix priority: #p1",
						maxTasks: 2,
					},
				],
			}),
		);

		expect(settings.headerCounters).toHaveLength(3);
		expect(settings.headerCounters[2]?.label).toBe("Fixes");
	});
});
