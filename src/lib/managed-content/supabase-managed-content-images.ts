import { File } from "expo-file-system";

import type {
	ManualContentBlock,
	ManualEntry,
	ManagedContentSection,
} from "@/database/manual/manual.type";
import type { Notice } from "@/database/notices/notice.type";
import type {
	TutorialContentBlock,
	TutorialEntry,
} from "@/database/tutorial/tutorial.type";
import { contentImageBucketName, getPublicContentImageUrl } from "@/lib/sajang-content/supabase-content-images";
import { getSupabaseClientOrNull } from "@/lib/supabase/supabase-client";

type ManagedContentImageScope = "manual" | "notice" | "tutorial";

const maxManagedContentImageBytes = 6 * 1024 * 1024;

export async function uploadNoticeImagesAsync(notice: Notice): Promise<Notice> {
	return {
		...notice,
		sections: await uploadSectionsAsync("notice", notice.id, notice.sections),
	};
}

export async function uploadManualEntryImagesAsync(entry: ManualEntry): Promise<ManualEntry> {
	const sections = await uploadSectionsAsync("manual", entry.id, entry.sections);
	const uploadedSections = sections ?? [];

	return {
		...entry,
		blocks: uploadedSections.length ? sectionsToManualBlocks(uploadedSections) : await uploadManualBlocksAsync(entry.id, entry.blocks),
		sections,
	};
}

export async function uploadTutorialEntryImagesAsync(entry: TutorialEntry): Promise<TutorialEntry> {
	const sections = await uploadSectionsAsync("tutorial", entry.id, entry.sections);
	const uploadedSections = sections ?? [];

	return {
		...entry,
		blocks: uploadedSections.length ? sectionsToTutorialBlocks(uploadedSections) : await uploadTutorialBlocksAsync(entry.id, entry.blocks),
		sections,
	};
}

export function withPublicNoticeImageUrls(notice: Notice): Notice {
	return {
		...notice,
		sections: withPublicSectionImageUrls(notice.sections),
	};
}

export function withPublicManualEntryImageUrls(entry: ManualEntry): ManualEntry {
	return {
		...entry,
		blocks: withPublicManualBlockImageUrls(entry.blocks),
		sections: withPublicSectionImageUrls(entry.sections),
	};
}

export function withPublicTutorialEntryImageUrls(entry: TutorialEntry): TutorialEntry {
	return {
		...entry,
		blocks: withPublicTutorialBlockImageUrls(entry.blocks),
		sections: withPublicSectionImageUrls(entry.sections),
	};
}

export function toStoredNotice(notice: Notice): Notice {
	return {
		...notice,
		sections: toStoredSections(notice.sections),
	};
}

export function toStoredManualEntry(entry: ManualEntry): ManualEntry {
	return {
		...entry,
		blocks: toStoredManualBlocks(entry.blocks),
		sections: toStoredSections(entry.sections),
	};
}

export function toStoredTutorialEntry(entry: TutorialEntry): TutorialEntry {
	return {
		...entry,
		blocks: toStoredTutorialBlocks(entry.blocks),
		sections: toStoredSections(entry.sections),
	};
}

async function uploadSectionsAsync(
	scope: ManagedContentImageScope,
	ownerId: string,
	sections: ManagedContentSection[] | undefined,
) {
	if (!sections?.length) {
		return sections;
	}

	return await Promise.all(sections.map(section => uploadSectionImageAsync(scope, ownerId, section)));
}

async function uploadSectionImageAsync(
	scope: ManagedContentImageScope,
	ownerId: string,
	section: ManagedContentSection,
): Promise<ManagedContentSection> {
	const imageUri = getImageSourceUri(section.imageSource);

	if (!imageUri) {
		return stripSectionRuntimeUri(section);
	}

	if (section.storagePath && imageUri === getPublicContentImageUrl(section.storagePath)) {
		return withPublicSectionImageUrl(section);
	}

	const storagePath = await uploadImageAsync(scope, ownerId, section.id, imageUri);

	return withPublicSectionImageUrl({
		...stripSectionRuntimeUri(section),
		storagePath,
	});
}

async function uploadManualBlocksAsync(ownerId: string, blocks: ManualContentBlock[]) {
	return await Promise.all(
		blocks.map(async block => {
			if (block.type !== "image") {
				return block;
			}

			const imageUri = getImageSourceUri(block.source);

			if (!imageUri) {
				return stripManualBlockRuntimeUri(block);
			}

			if (block.storagePath && imageUri === getPublicContentImageUrl(block.storagePath)) {
				return withPublicManualBlockImageUrl(block);
			}

			const storagePath = await uploadImageAsync("manual", ownerId, block.id, imageUri);

			return withPublicManualBlockImageUrl({
				...stripManualBlockRuntimeUri(block),
				storagePath,
			});
		}),
	);
}

async function uploadTutorialBlocksAsync(ownerId: string, blocks: TutorialContentBlock[]) {
	return await Promise.all(
		blocks.map(async block => {
			if (block.type !== "image") {
				return block;
			}

			const imageUri = getImageSourceUri(block.source);

			if (!imageUri) {
				return stripTutorialBlockRuntimeUri(block);
			}

			if (block.storagePath && imageUri === getPublicContentImageUrl(block.storagePath)) {
				return withPublicTutorialBlockImageUrl(block);
			}

			const storagePath = await uploadImageAsync("tutorial", ownerId, block.id, imageUri);

			return withPublicTutorialBlockImageUrl({
				...stripTutorialBlockRuntimeUri(block),
				storagePath,
			});
		}),
	);
}

async function uploadImageAsync(
	scope: ManagedContentImageScope,
	ownerId: string,
	imageId: string,
	imageUri: string,
) {
	const imageBytes = await readImageBytesAsync(imageUri);

	if (imageBytes.byteLength > maxManagedContentImageBytes) {
		throw new Error("이미지는 6MB 이하만 업로드할 수 있습니다.");
	}

	const extension = getImageExtension(imageUri);
	const storagePath = [
		"managed-content",
		scope,
		sanitizePathSegment(ownerId),
		sanitizePathSegment(imageId),
		`${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${extension}`,
	].join("/");
	const supabase = getConfiguredSupabaseClient();
	const { error } = await supabase.storage.from(contentImageBucketName).upload(storagePath, imageBytes, {
		cacheControl: "31536000",
		contentType: getImageContentType(extension),
		upsert: false,
	});

	if (error) {
		throw error;
	}

	return storagePath;
}

async function readImageBytesAsync(imageUri: string): Promise<ArrayBuffer> {
	if (imageUri.startsWith("https://") || imageUri.startsWith("http://")) {
		const response = await fetch(imageUri);

		if (!response.ok) {
			throw new Error(`이미지 파일을 읽지 못했습니다. (${response.status})`);
		}

		return await response.arrayBuffer();
	}

	const imageFile = new File(imageUri);

	if (!imageFile.exists) {
		throw new Error("선택한 이미지 파일이 기기에 존재하지 않습니다. 이미지를 다시 선택해 주세요.");
	}

	return await imageFile.arrayBuffer();
}

function withPublicSectionImageUrls(sections: ManagedContentSection[] | undefined) {
	return sections?.map(withPublicSectionImageUrl);
}

function withPublicSectionImageUrl(section: ManagedContentSection): ManagedContentSection {
	const publicUrl = getPublicContentImageUrl(section.storagePath);

	return publicUrl ? { ...section, imageSource: { uri: publicUrl } } : section;
}

function toStoredSections(sections: ManagedContentSection[] | undefined) {
	return sections?.map(stripSectionRuntimeUri);
}

function stripSectionRuntimeUri(section: ManagedContentSection): ManagedContentSection {
	const { imageSource: _imageSource, ...storedSection } = section;

	return storedSection;
}

function withPublicManualBlockImageUrls(blocks: ManualContentBlock[]) {
	return blocks.map(withPublicManualBlockImageUrl);
}

function withPublicManualBlockImageUrl(block: ManualContentBlock): ManualContentBlock {
	if (block.type !== "image") {
		return block;
	}

	const publicUrl = getPublicContentImageUrl(block.storagePath);

	return publicUrl ? { ...block, source: { uri: publicUrl } } : block;
}

function withPublicTutorialBlockImageUrls(blocks: TutorialContentBlock[]) {
	return blocks.map(withPublicTutorialBlockImageUrl);
}

function withPublicTutorialBlockImageUrl(block: TutorialContentBlock): TutorialContentBlock {
	if (block.type !== "image") {
		return block;
	}

	const publicUrl = getPublicContentImageUrl(block.storagePath);

	return publicUrl ? { ...block, source: { uri: publicUrl } } : block;
}

function toStoredManualBlocks(blocks: ManualContentBlock[]) {
	return blocks.map(block => (block.type === "image" ? stripManualBlockRuntimeUri(block) : block));
}

function stripManualBlockRuntimeUri(block: Extract<ManualContentBlock, { type: "image" }>) {
	const publicUrl = getPublicContentImageUrl(block.storagePath);

	return {
		...block,
		source: publicUrl ? { uri: publicUrl } : block.source,
	};
}

function toStoredTutorialBlocks(blocks: TutorialContentBlock[]) {
	return blocks.map(block => (block.type === "image" ? stripTutorialBlockRuntimeUri(block) : block));
}

function stripTutorialBlockRuntimeUri(block: Extract<TutorialContentBlock, { type: "image" }>) {
	const publicUrl = getPublicContentImageUrl(block.storagePath);

	return {
		...block,
		source: publicUrl ? { uri: publicUrl } : block.source,
	};
}

function sectionsToManualBlocks(sections: ManagedContentSection[]): ManualContentBlock[] {
	return sections.flatMap(section => {
		const blocks: ManualContentBlock[] = [];

		if (section.desc) {
			blocks.push({
				body: section.desc,
				id: `${section.id}-text`,
				type: "text",
			});
		}

		if (section.imageSource || section.storagePath) {
			blocks.push({
				alt: section.imageAlt ?? section.title,
				id: `${section.id}-image`,
				source: section.imageSource ?? { uri: getPublicContentImageUrl(section.storagePath) ?? "" },
				storagePath: section.storagePath,
				type: "image",
			});
		}

		return blocks;
	});
}

function sectionsToTutorialBlocks(sections: ManagedContentSection[]): TutorialContentBlock[] {
	return sections.flatMap(section => {
		const blocks: TutorialContentBlock[] = [];

		if (section.desc) {
			blocks.push({
				body: section.desc,
				id: `${section.id}-text`,
				type: "text",
			});
		}

		if (section.imageSource || section.storagePath) {
			blocks.push({
				alt: section.imageAlt ?? section.title,
				id: `${section.id}-image`,
				source: section.imageSource ?? { uri: getPublicContentImageUrl(section.storagePath) ?? "" },
				storagePath: section.storagePath,
				type: "image",
			});
		}

		return blocks;
	});
}

function getImageSourceUri(source: unknown) {
	if (source && typeof source === "object" && !Array.isArray(source) && "uri" in source) {
		const uri = source.uri;

		return typeof uri === "string" ? uri : undefined;
	}

	return undefined;
}

function getImageExtension(uri: string) {
	const match = uri.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
	const extension = match?.[1]?.toLowerCase();

	return extension && ["jpeg", "jpg", "png", "webp"].includes(extension) ? extension : "jpg";
}

function getImageContentType(extension: string) {
	if (extension === "png") {
		return "image/png";
	}

	if (extension === "webp") {
		return "image/webp";
	}

	return "image/jpeg";
}

function sanitizePathSegment(value: string) {
	return value.replace(/[^a-zA-Z0-9_-]/g, "-");
}

function getConfiguredSupabaseClient() {
	const supabase = getSupabaseClientOrNull();

	if (!supabase) {
		throw new Error("Supabase가 설정되어 있지 않습니다.");
	}

	return supabase;
}
