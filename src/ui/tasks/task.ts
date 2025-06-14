import type { ColumnTag, ColumnTagTable } from "../columns/columns";
import { DateType, extractDates, formatTaskDate, getCurrentDate } from "./date_utils";

import type { Brand } from "src/brand";
import { getTagsFromContent } from "src/parsing/tags/tags";
import sha256 from "crypto-js/sha256";

export class Task {
	constructor(
		rawContent: TaskString,
		fileHandle: { path: string },
		readonly rowIndex: number,
		columnTagTable: ColumnTagTable,
		private readonly consolidateTags: boolean
	) {
		const [, blockLink] = rawContent.match(blockLinkRegexp) ?? [];
		this.blockLink = blockLink;

		const match = (
			blockLink ? rawContent.replace(blockLinkRegexp, "") : rawContent
		).match(taskStringRegex);

		if (!match) {
			throw new Error(
				"Attempted to create a task from invalid raw content"
			);
		}

		const [, status, content] = match;
		if (!content) {
			throw new Error("Content not found in raw content");
		}

		const { content: parsedContent, dates } = extractDates(content);
		
		this._id = sha256(content + fileHandle.path + rowIndex).toString();
		this._content = parsedContent;
		this._done = status === "x";
		this._path = fileHandle.path;

		// Handle dates
		for (const { type, date } of dates) {
			switch (type) {
				case DateType.DUE:
					this._dueDate = date;
					break;
				case DateType.STATUS_CHANGED:
					this._statusChangedDate = date;
					break;
				case DateType.CREATED:
					this._createdDate = date;
					break;
			}
		}

		// Set default dates if not present
		const now = getCurrentDate();
		if (!this._createdDate) {
			this._createdDate = now;
		}
		if (!this._statusChangedDate) {
			this._statusChangedDate = now;
		}

		const tags = getTagsFromContent(this._content);
		
		this._priority = (() => {
			let priority = 3;
			for (let i = 3; i >= 0; i--) {
				if (tags.has(`p${i}`)) {
					tags.delete(`p${i}`);
					// Remove priority tag from content
					this._content = this._content.replace(`#p${i}`, "").trim();
					priority = i;
				}
			}
			return priority;
		})();

		for (const tag of tags) {
			if (tag in columnTagTable || tag === "done") {
				if (!this._column) {
					this._column = tag as ColumnTag;
				}
				tags.delete(tag);
				if (!consolidateTags) {
					this._content = this._content
						.replaceAll(`#${tag}`, "")
						.trim();
				}
			}
			if (consolidateTags) {
				this._content = this._content.replaceAll(`#${tag}`, "").trim();
			}
		}

		this.tags = tags;
	}

	private _id: string;
	get id() {
		return this._id;
	}

	private _content: string;
	get content(): string {
		return this._content;
	}
	set content(value: string) {
		// Update priority and remove it from content
		const priorityMatch = value.match(/#p([0-3])/);
		if (priorityMatch && priorityMatch[1] !== undefined) {
			this._priority = parseInt(priorityMatch[1]);
			value = value.replace(/#p[0-3]/, '').trim();
		}
		const { content: contentWithoutDate, date } = this.extractDueDate(value);
		this._content = contentWithoutDate;
		this._dueDate = date ?? this._dueDate;
	}

	private _done: boolean;
	get done(): boolean {
		return this._done;
	}
	set done(done: true) {
		this._done = done;
		this._column = undefined;
		this._statusChangedDate = getCurrentDate();
	}

	private _deleted: boolean = false;

	private readonly _path: string;
	get path() {
		return this._path;
	}

	get fileName() {
		return this._path.split('/').pop() || this._path;
	}

	private _column: ColumnTag | "archived" | undefined;
	get column(): ColumnTag | "archived" | undefined {
		return this._column;
	}
	set column(column: ColumnTag) {
		if (this._column !== column) {
			this._statusChangedDate = getCurrentDate();
		}
		this._column = column;
		this._done = false;
	}

	private _priority: number = 0;
	get priority(): number {
		return this._priority;
	}
	set priority(value: number) {
		this._priority = Math.max(0, Math.min(3, value));
	}

	private _dueDate: Date | null = null;
	get dueDate(): Date | null {
		return this._dueDate;
	}
	set dueDate(value: Date | null) {
		this._dueDate = value;
	}

	private _statusChangedDate: Date = getCurrentDate();
	get statusChangedDate(): Date {
		return this._statusChangedDate;
	}

	private _createdDate: Date = getCurrentDate();
	get createdDate(): Date {
		return this._createdDate;
	}

	readonly blockLink: string | undefined;
	readonly tags: ReadonlySet<string>;

	serialise(): string {
		if (this._deleted) {
			return "";
		}

		return [
			`- [${this.done ? "x" : " "}] `,
			this.content.trim(),
			this.consolidateTags && this.tags.size > 0
				? ` ${Array.from(this.tags)
						.map((tag) => `#${tag}`)
						.join(" ")}`
				: "",
			this.column ? ` #${this.column}` : "",
			this._priority < 3 ? ` #p${this._priority}` : "",
			this._dueDate ? ` ${formatTaskDate(DateType.DUE, this._dueDate)}` : "",
			` ${formatTaskDate(DateType.STATUS_CHANGED, this._statusChangedDate)}`,
			` ${formatTaskDate(DateType.CREATED, this._createdDate)}`,
			this.blockLink ? ` ^${this.blockLink}` : "",
		]
			.join("")
			.trimEnd();
	}

	archive() {
		this._done = true;
		this._column = "archived";
	}

	delete() {
		this._deleted = true;
	}

	private extractDueDate(content: string): { content: string; date: Date | null } {
		const dueDateMatch = content.match(/\s*(\d{4}-\d{2}-\d{2})/);
		if (!dueDateMatch || !dueDateMatch[1]) {
			return { content, date: null };
		}
		const date = new Date(dueDateMatch[1]);
		if (isNaN(date.getTime())) {
			return { content, date: null };
		}
		const newContent = content.replace(dueDateMatch[0], '').trim();
		return { content: newContent, date };
	}
}

type TaskString = Brand<string, "TaskString">;

export function isTaskString(input: string): input is TaskString {
	if (input.includes("#archived")) {
		return false;
	}
	return taskStringRegex.test(input);
}

// begins with 0 or more whitespace chars
// then follows the pattern "- [ ]" OR "- [x]"
// then contains an additional whitespace before any trailing content
const taskStringRegex = /^\s*-\s\[([xX\s])\]\s(.+)/;
const blockLinkRegexp = /\s\^([a-zA-Z0-9-]+)$/;
