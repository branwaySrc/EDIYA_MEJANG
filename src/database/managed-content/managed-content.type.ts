import type { ManualEntry } from "@/database/manual/manual.type";
import type { Notice } from "@/database/notices/notice.type";
import type { TutorialEntry } from "@/database/tutorial/tutorial.type";

export type ManagedContentType = "manual" | "notice" | "tutorial";
export type ManagedContentStatus = "draft" | "published" | "archived";

export type ManagedContentRow = {
	category_slug: string | null;
	content_type: ManagedContentType;
	created_at: string;
	description: string | null;
	id: string;
	keywords: string[];
	payload: unknown;
	shift_group: string | null;
	sort_order: number;
	status: ManagedContentStatus;
	title: string;
	topic_slug: string | null;
	updated_at: string;
	uploaded_at: string | null;
};

export type ManagedContentSnapshot = {
	manualEntries: ManualEntry[];
	notices: Notice[];
	tutorialEntries: TutorialEntry[];
};
