import * as FileSystem from "expo-file-system/legacy";

import type {
	FindEntry,
	FindMaterialDetailImage,
} from "@/database/find/find.type";
import type {
	RecipeDetail,
	RecipeVisual,
} from "@/database/recipe/recipe-details.type";
import type { Recipe } from "@/database/recipe/recipe.type";
import {
	getFindEntryStoragePaths,
	getPublicContentImageUrl,
	getRecipeDetailStoragePaths,
} from "@/lib/sajang-content/supabase-content-images";

export type RecipeSearchCacheMetadata = {
	appliedAt: string;
	cacheVersion: string;
	findEntryCount: number;
	recipeCount: number;
	schemaVersion: number;
};

export type RecipeSearchCacheContent = {
	findEntries: FindEntry[];
	recipeDetails: Record<string, RecipeDetail>;
	recipes: Recipe[];
};

export type RecipeSearchCacheSnapshot = RecipeSearchCacheContent & {
	metadata: RecipeSearchCacheMetadata;
};

type CachePointer = {
	generationId: string;
};

const cacheSchemaVersion = 1;
const cacheDirectoryName = "recipe-search-cache";
const generationDirectoryName = "generations";
const activePointerFileName = "active.json";
const previousPointerFileName = "previous.json";
const nextPointerFileName = "active.next.json";
const snapshotFileName = "snapshot.json";
const imageDirectoryName = "images";
const downloadConcurrency = 3;

export async function readActiveRecipeSearchCacheAsync(): Promise<RecipeSearchCacheSnapshot | null> {
	const rootUri = getCacheRootUri();

	if (!rootUri) {
		return null;
	}

	await ensureCacheDirectoriesAsync();

	for (const pointerFileName of [activePointerFileName, previousPointerFileName]) {
		try {
			const pointer = await readPointerAsync(`${rootUri}${pointerFileName}`);

			if (!pointer) {
				continue;
			}

			return await readGenerationSnapshotAsync(pointer.generationId);
		} catch (error) {
			console.error(`Failed to read recipe/search cache from ${pointerFileName}.`, error);
		}
	}

	return null;
}

export async function getRecipeSearchCacheMetadataAsync(): Promise<RecipeSearchCacheMetadata | null> {
	return (await readActiveRecipeSearchCacheAsync())?.metadata ?? null;
}

export async function replaceRecipeSearchCacheAsync(
	content: RecipeSearchCacheContent,
): Promise<RecipeSearchCacheSnapshot> {
	const appliedAt = new Date().toISOString();
	const generationId = createGenerationId(appliedAt);
	const metadata: RecipeSearchCacheMetadata = {
		appliedAt,
		cacheVersion: generationId,
		findEntryCount: content.findEntries.length,
		recipeCount: content.recipes.length,
		schemaVersion: cacheSchemaVersion,
	};
	const rootUri = getCacheRootUri();

	if (!rootUri) {
		return { ...content, metadata };
	}

	await ensureCacheDirectoriesAsync();
	const generationUri = getGenerationUri(generationId);
	const imageDirectoryUri = `${generationUri}${imageDirectoryName}/`;

	await FileSystem.deleteAsync(generationUri, { idempotent: true });
	await FileSystem.makeDirectoryAsync(imageDirectoryUri, { intermediates: true });

	try {
		const imagePaths = uniquePaths([
			...Object.values(content.recipeDetails).flatMap(getRecipeDetailStoragePaths),
			...content.findEntries.flatMap(getFindEntryStoragePaths),
		]);
		const localImageUris = await downloadContentImagesAsync(
			imagePaths,
			imageDirectoryUri,
		);
		const snapshot: RecipeSearchCacheSnapshot = {
			findEntries: content.findEntries.map(entry => localizeFindEntryImages(entry, localImageUris)),
			metadata,
			recipeDetails: Object.fromEntries(
				Object.entries(content.recipeDetails).map(([recipeId, detail]) => [
					recipeId,
					localizeRecipeDetailImages(detail, localImageUris),
				]),
			) as Record<string, RecipeDetail>,
			recipes: content.recipes,
		};
		const snapshotUri = `${generationUri}${snapshotFileName}`;

		await FileSystem.writeAsStringAsync(snapshotUri, JSON.stringify(snapshot));
		await validateSnapshotFilesAsync(snapshot, snapshotUri, localImageUris);
		await commitActiveGenerationAsync(generationId);
		await cleanupUnusedGenerationsBestEffortAsync();
		await cleanupDeprecatedSqliteCacheBestEffortAsync();

		return snapshot;
	} catch (error) {
		await FileSystem.deleteAsync(generationUri, { idempotent: true });
		throw error;
	}
}

async function downloadContentImagesAsync(
	storagePaths: string[],
	imageDirectoryUri: string,
): Promise<Map<string, string>> {
	const entries = await mapWithConcurrency(
		storagePaths,
		downloadConcurrency,
		async (storagePath, index) => {
			const publicUrl = getPublicContentImageUrl(storagePath);

			if (!publicUrl) {
				throw new Error(`이미지 URL을 만들지 못했습니다: ${storagePath}`);
			}

			const extension = getImageExtension(storagePath);
			const localUri = `${imageDirectoryUri}${String(index).padStart(4, "0")}.${extension}`;
			const result = await FileSystem.downloadAsync(publicUrl, localUri);

			if (result.status < 200 || result.status >= 300) {
				throw new Error(`이미지 다운로드에 실패했습니다. (${result.status})`);
			}

			return [storagePath, result.uri] as const;
		},
	);

	return new Map(entries);
}

async function validateSnapshotFilesAsync(
	snapshot: RecipeSearchCacheSnapshot,
	snapshotUri: string,
	localImageUris: Map<string, string>,
) {
	const persistedSnapshot = parseSnapshot(await FileSystem.readAsStringAsync(snapshotUri));

	if (
		persistedSnapshot.metadata.cacheVersion !== snapshot.metadata.cacheVersion ||
		persistedSnapshot.recipes.length !== snapshot.recipes.length ||
		persistedSnapshot.findEntries.length !== snapshot.findEntries.length
	) {
		throw new Error("기기 캐시 검증에 실패했습니다.");
	}

	for (const localUri of localImageUris.values()) {
		const fileInfo = await FileSystem.getInfoAsync(localUri);

		if (!fileInfo.exists || fileInfo.isDirectory) {
			throw new Error("다운로드한 이미지 캐시가 존재하지 않습니다.");
		}
	}
}

async function commitActiveGenerationAsync(generationId: string) {
	const rootUri = getRequiredCacheRootUri();
	const activeUri = `${rootUri}${activePointerFileName}`;
	const previousUri = `${rootUri}${previousPointerFileName}`;
	const nextUri = `${rootUri}${nextPointerFileName}`;
	const activeInfo = await FileSystem.getInfoAsync(activeUri);

	await FileSystem.deleteAsync(nextUri, { idempotent: true });
	await FileSystem.writeAsStringAsync(nextUri, JSON.stringify({ generationId } satisfies CachePointer));
	await FileSystem.deleteAsync(previousUri, { idempotent: true });

	if (activeInfo.exists) {
		await FileSystem.moveAsync({ from: activeUri, to: previousUri });
	}

	try {
		await FileSystem.moveAsync({ from: nextUri, to: activeUri });
	} catch (error) {
		const previousInfo = await FileSystem.getInfoAsync(previousUri);

		if (previousInfo.exists) {
			await FileSystem.moveAsync({ from: previousUri, to: activeUri });
		}

		throw error;
	}
}

async function cleanupUnusedGenerationsBestEffortAsync() {
	try {
		const rootUri = getRequiredCacheRootUri();
		const generationsUri = getGenerationsRootUri();
		const [activePointer, previousPointer, generationNames] = await Promise.all([
			readPointerAsync(`${rootUri}${activePointerFileName}`),
			readPointerAsync(`${rootUri}${previousPointerFileName}`),
			FileSystem.readDirectoryAsync(generationsUri),
		]);
		const retainedGenerationIds = new Set([
			activePointer?.generationId,
			previousPointer?.generationId,
		].filter((value): value is string => Boolean(value)));

		await Promise.all(
			generationNames
				.filter(generationName => !retainedGenerationIds.has(generationName))
				.map(generationName =>
					FileSystem.deleteAsync(`${generationsUri}${generationName}/`, { idempotent: true }),
				),
		);
	} catch (error) {
		console.error("Failed to clean up old recipe/search cache generations.", error);
	}
}

async function cleanupDeprecatedSqliteCacheBestEffortAsync() {
	if (!FileSystem.documentDirectory) {
		return;
	}

	try {
		await FileSystem.deleteAsync(`${FileSystem.documentDirectory}content-packs/`, {
			idempotent: true,
		});
	} catch (error) {
		console.error("Failed to clean up the deprecated SQLite content cache.", error);
	}
}

async function readGenerationSnapshotAsync(generationId: string) {
	const snapshotUri = `${getGenerationUri(generationId)}${snapshotFileName}`;
	const snapshotInfo = await FileSystem.getInfoAsync(snapshotUri);

	if (!snapshotInfo.exists || snapshotInfo.isDirectory) {
		throw new Error("활성 레시피 캐시 파일이 없습니다.");
	}

	return parseSnapshot(await FileSystem.readAsStringAsync(snapshotUri));
}

async function readPointerAsync(pointerUri: string): Promise<CachePointer | null> {
	const pointerInfo = await FileSystem.getInfoAsync(pointerUri);

	if (!pointerInfo.exists || pointerInfo.isDirectory) {
		return null;
	}

	const value: unknown = JSON.parse(await FileSystem.readAsStringAsync(pointerUri));

	if (!isRecord(value) || typeof value.generationId !== "string" || !value.generationId) {
		throw new Error("기기 캐시 포인터가 올바르지 않습니다.");
	}

	return { generationId: value.generationId };
}

function parseSnapshot(serializedSnapshot: string): RecipeSearchCacheSnapshot {
	const value: unknown = JSON.parse(serializedSnapshot);

	if (
		!isRecord(value) ||
		!Array.isArray(value.recipes) ||
		!Array.isArray(value.findEntries) ||
		!isRecord(value.recipeDetails) ||
		!isRecord(value.metadata) ||
		typeof value.metadata.appliedAt !== "string" ||
		typeof value.metadata.cacheVersion !== "string" ||
		typeof value.metadata.schemaVersion !== "number" ||
		value.metadata.schemaVersion !== cacheSchemaVersion
	) {
		throw new Error("기기 레시피 캐시 형식이 올바르지 않습니다.");
	}

	return value as RecipeSearchCacheSnapshot;
}

function localizeRecipeDetailImages(
	detail: RecipeDetail,
	localImageUris: Map<string, string>,
): RecipeDetail {
	const localizeVisuals = (visuals: RecipeVisual[]) =>
		visuals.map(visual => {
			const localUri = visual.storagePath
				? localImageUris.get(visual.storagePath)
				: getReusableRemoteImageUri(visual.image ?? visual.imageUri);

			return {
				...visual,
				image: localUri,
				imageUri: undefined,
			};
		});

	return {
		delivery: localizeVisuals(detail.delivery),
		heroVisuals: localizeVisuals(detail.heroVisuals),
		packaging: localizeVisuals(detail.packaging),
		steps: detail.steps.map(step => ({ ...step, visuals: localizeVisuals(step.visuals) })),
		storeServing: localizeVisuals(detail.storeServing),
	};
}

function localizeFindEntryImages(
	entry: FindEntry,
	localImageUris: Map<string, string>,
): FindEntry {
	const localizeImages = (images: FindMaterialDetailImage[] = []) =>
		images.map(image => {
			const localUri = image.storagePath
				? localImageUris.get(image.storagePath)
				: getReusableRemoteImageUri(getFindImageUri(image));

			return {
				...image,
				image: undefined,
				source: localUri ? { uri: localUri } : undefined,
			};
		});

	if (entry.kind === "material") {
		return {
			...entry,
			materialGroups: entry.materialGroups.map(block => ({
				...block,
				images: localizeImages(block.images),
			})),
			storageLocations: entry.storageLocations.map(block => ({
				...block,
				images: localizeImages(block.images),
			})),
		};
	}

	return {
		...entry,
		posImages: localizeImages(entry.posImages),
	};
}

function getFindImageUri(image: FindMaterialDetailImage) {
	const source = image.image ?? image.source;

	if (source && typeof source === "object" && !Array.isArray(source) && "uri" in source) {
		return source.uri;
	}

	return undefined;
}

function getReusableRemoteImageUri(uri?: string) {
	return uri?.startsWith("https://") || uri?.startsWith("http://") ? uri : undefined;
}

function getImageExtension(storagePath: string) {
	const extension = storagePath.match(/\.([a-zA-Z0-9]+)$/)?.[1]?.toLowerCase();

	return extension && ["jpeg", "jpg", "png", "webp"].includes(extension) ? extension : "jpg";
}

async function ensureCacheDirectoriesAsync() {
	const rootUri = getRequiredCacheRootUri();

	await FileSystem.makeDirectoryAsync(rootUri, { intermediates: true });
	await FileSystem.makeDirectoryAsync(getGenerationsRootUri(), { intermediates: true });
}

function getCacheRootUri() {
	return FileSystem.documentDirectory
		? `${FileSystem.documentDirectory}${cacheDirectoryName}/`
		: null;
}

function getRequiredCacheRootUri() {
	const rootUri = getCacheRootUri();

	if (!rootUri) {
		throw new Error("이 플랫폼에서는 기기 레시피 캐시를 사용할 수 없습니다.");
	}

	return rootUri;
}

function getGenerationsRootUri() {
	return `${getRequiredCacheRootUri()}${generationDirectoryName}/`;
}

function getGenerationUri(generationId: string) {
	return `${getGenerationsRootUri()}${generationId}/`;
}

function createGenerationId(appliedAt: string) {
	return `cache-${appliedAt.replace(/\D/g, "").slice(0, 14)}-${Math.random().toString(36).slice(2, 7)}`;
}

function uniquePaths(paths: string[]) {
	return [...new Set(paths)];
}

async function mapWithConcurrency<Item, Result>(
	items: Item[],
	concurrency: number,
	mapper: (item: Item, index: number) => Promise<Result>,
): Promise<Result[]> {
	const results = new Array<Result>(items.length);
	let nextIndex = 0;

	const worker = async () => {
		while (nextIndex < items.length) {
			const currentIndex = nextIndex;

			nextIndex += 1;
			results[currentIndex] = await mapper(items[currentIndex], currentIndex);
		}
	};

	await Promise.all(
		Array.from({ length: Math.min(concurrency, items.length) }, () => worker()),
	);

	return results;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}
