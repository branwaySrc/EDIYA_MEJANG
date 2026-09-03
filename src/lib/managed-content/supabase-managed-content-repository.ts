import type {
	ManagedContentRow,
	ManagedContentSnapshot,
	ManagedContentStatus,
	ManagedContentType,
} from "@/database/managed-content/managed-content.type";
import type {
	ManualCategorySlug,
	ManualEntry,
	ManagedContentShiftGroup,
} from "@/database/manual/manual.type";
import type { Notice } from "@/database/notices/notice.type";
import type {
	TutorialEntry,
	TutorialTopicSlug,
} from "@/database/tutorial/tutorial.type";
import {
	toStoredManualEntry,
	toStoredNotice,
	toStoredTutorialEntry,
	uploadManualEntryImagesAsync,
	uploadNoticeImagesAsync,
	uploadTutorialEntryImagesAsync,
	withPublicManualEntryImageUrls,
	withPublicNoticeImageUrls,
	withPublicTutorialEntryImageUrls,
} from "@/lib/managed-content/supabase-managed-content-images";
import { getSupabaseClientOrNull } from "@/lib/supabase/supabase-client";

const managedContentTableName = "managed_content_documents";
const defaultManagedContentStatus: ManagedContentStatus = "published";

type UpsertManagedContentOptions = {
	status?: ManagedContentStatus;
};

export async function fetchSupabaseManagedContentAsync(): Promise<ManagedContentSnapshot | null> {
	const supabase = getSupabaseClientOrNull();

	if (!supabase) {
		return null;
	}

	const { data, error } = await supabase
		.from(managedContentTableName)
		.select("*")
		.eq("status", "published")
		.order("sort_order", { ascending: true })
		.order("updated_at", { ascending: false });

	if (error) {
		throw error;
	}

	const rows = (data ?? []) as ManagedContentRow[];

	return {
		manualEntries: rows.filter(row => row.content_type === "manual").map(rowToManualEntry),
		notices: rows.filter(row => row.content_type === "notice").map(rowToNotice),
		tutorialEntries: rows.filter(row => row.content_type === "tutorial").map(rowToTutorialEntry),
	};
}

export async function upsertSupabaseNoticeAsync(
	notice: Notice,
	options: UpsertManagedContentOptions = {},
): Promise<Notice | null> {
	const supabase = getSupabaseClientOrNull();

	if (!supabase) {
		return null;
	}

	const uploadedNotice = await uploadNoticeImagesAsync(notice);
	const storedNotice = toStoredNotice(uploadedNotice);
	const { data, error } = await supabase
		.from(managedContentTableName)
		.upsert(noticeToRow(storedNotice, options.status ?? defaultManagedContentStatus), { onConflict: "id" })
		.select("*")
		.single();

	if (error) {
		throw error;
	}

	return data ? rowToNotice(data as ManagedContentRow) : null;
}

export async function upsertSupabaseManualEntryAsync(
	entry: ManualEntry,
	options: UpsertManagedContentOptions = {},
): Promise<ManualEntry | null> {
	const supabase = getSupabaseClientOrNull();

	if (!supabase) {
		return null;
	}

	const uploadedEntry = await uploadManualEntryImagesAsync(entry);
	const storedEntry = toStoredManualEntry(uploadedEntry);
	const { data, error } = await supabase
		.from(managedContentTableName)
		.upsert(manualEntryToRow(storedEntry, options.status ?? defaultManagedContentStatus), { onConflict: "id" })
		.select("*")
		.single();

	if (error) {
		throw error;
	}

	return data ? rowToManualEntry(data as ManagedContentRow) : null;
}

export async function upsertSupabaseTutorialEntryAsync(
	entry: TutorialEntry,
	options: UpsertManagedContentOptions = {},
): Promise<TutorialEntry | null> {
	const supabase = getSupabaseClientOrNull();

	if (!supabase) {
		return null;
	}

	const uploadedEntry = await uploadTutorialEntryImagesAsync(entry);
	const storedEntry = toStoredTutorialEntry(uploadedEntry);
	const { data, error } = await supabase
		.from(managedContentTableName)
		.upsert(tutorialEntryToRow(storedEntry, options.status ?? defaultManagedContentStatus), { onConflict: "id" })
		.select("*")
		.single();

	if (error) {
		throw error;
	}

	return data ? rowToTutorialEntry(data as ManagedContentRow) : null;
}

export async function archiveSupabaseManagedContentAsync(
	contentType: ManagedContentType,
	id: string,
): Promise<void> {
	const supabase = getSupabaseClientOrNull();

	if (!supabase) {
		return;
	}

	const { error } = await supabase
		.from(managedContentTableName)
		.update({
			status: "archived",
			updated_at: new Date().toISOString(),
		})
		.eq("content_type", contentType)
		.eq("id", id);

	if (error) {
		throw error;
	}
}

function noticeToRow(notice: Notice, status: ManagedContentStatus) {
	const now = new Date().toISOString();
	const keywords = normalizeKeywords(notice.keywords);

	return {
		category_slug: null,
		content_type: "notice" satisfies ManagedContentType,
		description: notice.description?.trim() || null,
		id: notice.id,
		keywords,
		payload: {
			...notice,
			keywords,
		},
		shift_group: notice.shiftGroup ?? null,
		sort_order: 0,
		status,
		title: notice.title,
		topic_slug: null,
		updated_at: now,
		uploaded_at: notice.uploadedAt || now.slice(0, 10),
	};
}

function manualEntryToRow(entry: ManualEntry, status: ManagedContentStatus) {
	return {
		category_slug: entry.categorySlug ?? null,
		content_type: "manual" satisfies ManagedContentType,
		description: entry.description?.trim() || null,
		id: entry.id,
		keywords: buildKeywords(entry.title, entry.description, entry.shiftGroup),
		payload: entry,
		shift_group: entry.shiftGroup ?? null,
		sort_order: 0,
		status,
		title: entry.title,
		topic_slug: null,
		updated_at: new Date().toISOString(),
		uploaded_at: null,
	};
}

function tutorialEntryToRow(entry: TutorialEntry, status: ManagedContentStatus) {
	return {
		category_slug: null,
		content_type: "tutorial" satisfies ManagedContentType,
		description: entry.description?.trim() || null,
		id: entry.id,
		keywords: buildKeywords(entry.title, entry.description, entry.shiftGroup),
		payload: entry,
		shift_group: entry.shiftGroup ?? null,
		sort_order: 0,
		status,
		title: entry.title,
		topic_slug: entry.topicSlug ?? null,
		updated_at: new Date().toISOString(),
		uploaded_at: null,
	};
}

function rowToNotice(row: ManagedContentRow): Notice {
	const payload = asPartialNotice(row.payload);
	const notice = withPublicNoticeImageUrls({
		body: payload.body ?? sectionsToBody(payload.sections),
		description: row.description ?? payload.description ?? undefined,
		id: row.id,
		keywords: normalizeKeywords(row.keywords ?? payload.keywords),
		sections: payload.sections,
		shiftGroup: (row.shift_group as ManagedContentShiftGroup | null) ?? payload.shiftGroup,
		title: row.title,
		uploadedAt: payload.uploadedAt ?? row.uploaded_at ?? row.created_at.slice(0, 10),
	});

	return notice;
}

function rowToManualEntry(row: ManagedContentRow): ManualEntry {
	const payload = asPartialManualEntry(row.payload);

	return withPublicManualEntryImageUrls({
		blocks: payload.blocks ?? [],
		categorySlug: (row.category_slug as ManualCategorySlug | null) ?? payload.categorySlug,
		description: row.description ?? payload.description ?? undefined,
		id: row.id,
		sections: payload.sections,
		shiftGroup: (row.shift_group as ManagedContentShiftGroup | null) ?? payload.shiftGroup,
		title: row.title,
	});
}

function rowToTutorialEntry(row: ManagedContentRow): TutorialEntry {
	const payload = asPartialTutorialEntry(row.payload);

	return withPublicTutorialEntryImageUrls({
		blocks: payload.blocks ?? [],
		description: row.description ?? payload.description ?? undefined,
		id: row.id,
		sections: payload.sections,
		shiftGroup: (row.shift_group as ManagedContentShiftGroup | null) ?? payload.shiftGroup,
		title: row.title,
		topicSlug: (row.topic_slug as TutorialTopicSlug | null) ?? payload.topicSlug,
	});
}

function asPartialNotice(payload: unknown): Partial<Notice> {
	return isRecord(payload) ? payload as Partial<Notice> : {};
}

function asPartialManualEntry(payload: unknown): Partial<ManualEntry> {
	return isRecord(payload) ? payload as Partial<ManualEntry> : {};
}

function asPartialTutorialEntry(payload: unknown): Partial<TutorialEntry> {
	return isRecord(payload) ? payload as Partial<TutorialEntry> : {};
}

function sectionsToBody(sections: Notice["sections"]) {
	return sections?.map(section => section.desc).filter(Boolean) ?? [];
}

function buildKeywords(...values: (string | undefined)[]) {
	return values
		.join(" ")
		.split(/\s+/)
		.map(keyword => keyword.trim())
		.filter(Boolean)
		.slice(0, 8);
}

function normalizeKeywords(value: unknown): string[] {
	if (!Array.isArray(value)) {
		return [];
	}

	return value
		.flatMap(keyword => {
			if (typeof keyword === "string") {
				return keyword;
			}

			if (isRecord(keyword)) {
				const nestedValue = keyword.keyword ?? keyword.value ?? keyword.label ?? keyword.title;

				return typeof nestedValue === "string" ? nestedValue : [];
			}

			return [];
		})
		.map(keyword => keyword.trim())
		.filter(Boolean)
		.slice(0, 8);
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
