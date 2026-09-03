import type {
	FindEntry,
	FindMaterialDetailImage,
} from "@/database/find/find.type";
import type {
	RecipeDetail,
	RecipeVisual,
} from "@/database/recipe/recipe-details.type";
import { File } from "expo-file-system";
import { getSupabaseClientOrNull } from "@/lib/supabase/supabase-client";

export const contentImageBucketName = "recipe-content";

const maxStandardUploadBytes = 6 * 1024 * 1024;
const removablePathBatchSize = 100;

type UploadResult<T> = {
	uploadedPaths: string[];
	value: T;
};

type UploadedVisual = {
	uploadedPath?: string;
	visual: RecipeVisual;
};

export async function uploadRecipeDetailImagesAsync(
	recipeId: string,
	detail: RecipeDetail,
): Promise<UploadResult<RecipeDetail>> {
	const uploadedPaths: string[] = [];
	const uploadVisuals = async (visuals: RecipeVisual[]) => {
		const nextVisuals: RecipeVisual[] = [];

		for (const visual of visuals) {
			const result = await uploadVisualAsync("recipes", recipeId, visual);

			if (result.uploadedPath) {
				uploadedPaths.push(result.uploadedPath);
			}

			nextVisuals.push(result.visual);
		}

		return nextVisuals;
	};

	try {
		return {
			uploadedPaths,
			value: {
				delivery: await uploadVisuals(detail.delivery),
				heroVisuals: await uploadVisuals(detail.heroVisuals),
				packaging: await uploadVisuals(detail.packaging),
				steps: await Promise.all(
					detail.steps.map(async step => ({
						...step,
						visuals: await uploadVisuals(step.visuals),
					})),
				),
				storeServing: await uploadVisuals(detail.storeServing),
			},
		};
	} catch (error) {
		await removeContentImagesBestEffortAsync(uploadedPaths);
		throw error;
	}
}

export async function uploadFindEntryImagesAsync(entry: FindEntry): Promise<UploadResult<FindEntry>> {
	const uploadedPaths: string[] = [];
	const uploadImages = async (images: FindMaterialDetailImage[]) => {
		const nextImages: FindMaterialDetailImage[] = [];

		for (const image of images) {
			const visual = findImageToRecipeVisual(image);
			const result = await uploadVisualAsync("find", entry.id, visual);

			if (result.uploadedPath) {
				uploadedPaths.push(result.uploadedPath);
			}

			nextImages.push(recipeVisualToFindImage(result.visual, image));
		}

		return nextImages;
	};

	try {
		if (entry.kind === "material") {
			return {
				uploadedPaths,
				value: {
					...entry,
					materialGroups: await Promise.all(
						entry.materialGroups.map(async block => ({
							...block,
							images: await uploadImages(block.images ?? []),
						})),
					),
					storageLocations: await Promise.all(
						entry.storageLocations.map(async block => ({
							...block,
							images: await uploadImages(block.images ?? []),
						})),
					),
				},
			};
		}

		return {
			uploadedPaths,
			value: {
				...entry,
				posImages: await uploadImages(entry.posImages),
			},
		};
	} catch (error) {
		await removeContentImagesBestEffortAsync(uploadedPaths);
		throw error;
	}
}

export function getRecipeDetailStoragePaths(detail?: RecipeDetail): string[] {
	if (!detail) {
		return [];
	}

	return uniquePaths([
		...detail.delivery,
		...detail.heroVisuals,
		...detail.packaging,
		...detail.storeServing,
		...detail.steps.flatMap(step => step.visuals),
	].map(visual => visual.storagePath));
}

export function getFindEntryStoragePaths(entry?: FindEntry): string[] {
	if (!entry) {
		return [];
	}

	const images = entry.kind === "material"
		? [...entry.materialGroups, ...entry.storageLocations].flatMap(block => block.images ?? [])
		: entry.posImages;

	return uniquePaths(images.map(image => image.storagePath));
}

export function getRemovedStoragePaths(previousPaths: string[], nextPaths: string[]) {
	const retainedPaths = new Set(nextPaths);

	return previousPaths.filter(path => !retainedPaths.has(path));
}

export function withPublicRecipeDetailImageUrls(detail: RecipeDetail): RecipeDetail {
	const resolveVisuals = (visuals: RecipeVisual[]) => visuals.map(withPublicRecipeVisualUrl);

	return {
		delivery: resolveVisuals(detail.delivery),
		heroVisuals: resolveVisuals(detail.heroVisuals),
		packaging: resolveVisuals(detail.packaging),
		steps: detail.steps.map(step => ({ ...step, visuals: resolveVisuals(step.visuals) })),
		storeServing: resolveVisuals(detail.storeServing),
	};
}

export function withPublicFindEntryImageUrls(entry: FindEntry): FindEntry {
	const resolveImages = (images: FindMaterialDetailImage[] = []) =>
		images.map(image => {
			const publicUrl = getPublicContentImageUrl(image.storagePath);

			return publicUrl ? { ...image, source: { uri: publicUrl } } : image;
		});

	if (entry.kind === "material") {
		return {
			...entry,
			materialGroups: entry.materialGroups.map(block => ({
				...block,
				images: resolveImages(block.images),
			})),
			storageLocations: entry.storageLocations.map(block => ({
				...block,
				images: resolveImages(block.images),
			})),
		};
	}

	return {
		...entry,
		posImages: resolveImages(entry.posImages),
	};
}

export function toStoredRecipeDetail(detail: RecipeDetail): RecipeDetail {
	const stripVisuals = (visuals: RecipeVisual[]) => visuals.map(stripRecipeVisualRuntimeUri);

	return {
		delivery: stripVisuals(detail.delivery),
		heroVisuals: stripVisuals(detail.heroVisuals),
		packaging: stripVisuals(detail.packaging),
		steps: detail.steps.map(step => ({ ...step, visuals: stripVisuals(step.visuals) })),
		storeServing: stripVisuals(detail.storeServing),
	};
}

export function toStoredFindEntry(entry: FindEntry): FindEntry {
	const stripImages = (images: FindMaterialDetailImage[] = []) => images.map(stripFindImageRuntimeUri);

	if (entry.kind === "material") {
		return {
			...entry,
			materialGroups: entry.materialGroups.map(block => ({
				...block,
				images: stripImages(block.images),
			})),
			storageLocations: entry.storageLocations.map(block => ({
				...block,
				images: stripImages(block.images),
			})),
		};
	}

	return {
		...entry,
		posImages: stripImages(entry.posImages),
	};
}

export async function removeContentImagesAsync(paths: string[]): Promise<void> {
	const uniqueStoragePaths = uniquePaths(paths);

	if (uniqueStoragePaths.length === 0) {
		return;
	}

	const supabase = getConfiguredSupabaseClient();

	for (let index = 0; index < uniqueStoragePaths.length; index += removablePathBatchSize) {
		const batch = uniqueStoragePaths.slice(index, index + removablePathBatchSize);
		const { error } = await supabase.storage.from(contentImageBucketName).remove(batch);

		if (error) {
			throw error;
		}
	}
}

export async function removeContentImagesBestEffortAsync(paths: string[]): Promise<void> {
	try {
		await removeContentImagesAsync(paths);
	} catch (error) {
		console.error("Failed to clean up Supabase content images.", error);
	}
}

export function getPublicContentImageUrl(storagePath?: string) {
	if (!storagePath) {
		return undefined;
	}

	const supabase = getSupabaseClientOrNull();

	return supabase?.storage.from(contentImageBucketName).getPublicUrl(storagePath).data.publicUrl;
}

async function uploadVisualAsync(
	scope: "find" | "recipes",
	ownerId: string,
	visual: RecipeVisual,
): Promise<UploadedVisual> {
	if (visual.storagePath) {
		return { visual: withPublicRecipeVisualUrl(visual) };
	}

	const imageUri = visual.image ?? visual.imageUri;

	if (!imageUri) {
		return { visual: stripRecipeVisualRuntimeUri(visual) };
	}

	const imageBytes = await readImageBytesAsync(imageUri);

	if (imageBytes.byteLength > maxStandardUploadBytes) {
		throw new Error("이미지는 6MB 이하만 업로드할 수 있습니다.");
	}

	const extension = getImageExtension(imageUri);
	const storagePath = [
		scope,
		sanitizePathSegment(ownerId),
		sanitizePathSegment(visual.id),
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

	const nextVisual = withPublicRecipeVisualUrl({
		...stripRecipeVisualRuntimeUri(visual),
		storagePath,
	});

	return {
		uploadedPath: storagePath,
		visual: nextVisual,
	};
}

async function readImageBytesAsync(imageUri: string): Promise<ArrayBuffer> {
	if (imageUri.startsWith("https://") || imageUri.startsWith("http://")) {
		const response = await fetch(imageUri);

		if (!response.ok) {
			throw new Error(`원격 이미지 파일을 읽지 못했습니다. (${response.status})`);
		}

		return await response.arrayBuffer();
	}

	const imageFile = new File(imageUri);

	if (!imageFile.exists) {
		throw new Error("선택한 이미지 파일이 기기에 존재하지 않습니다. 이미지를 다시 선택해 주세요.");
	}

	if (imageFile.size > maxStandardUploadBytes) {
		throw new Error("이미지는 6MB 이하만 업로드할 수 있습니다.");
	}

	return await imageFile.arrayBuffer();
}

function withPublicRecipeVisualUrl(visual: RecipeVisual): RecipeVisual {
	const publicUrl = getPublicContentImageUrl(visual.storagePath);

	return publicUrl ? { ...visual, image: publicUrl, imageUri: undefined } : visual;
}

function stripRecipeVisualRuntimeUri(visual: RecipeVisual): RecipeVisual {
	const { image: _image, imageUri: _imageUri, ...storedVisual } = visual;

	return storedVisual;
}

function stripFindImageRuntimeUri(image: FindMaterialDetailImage): FindMaterialDetailImage {
	const { image: _image, source: _source, ...storedImage } = image;

	return storedImage;
}

function findImageToRecipeVisual(image: FindMaterialDetailImage): RecipeVisual {
	return {
		desc: image.desc,
		id: image.id,
		image: getImageSourceUri(image),
		storagePath: image.storagePath,
		title: image.title ?? image.alt ?? "등록 이미지",
	};
}

function recipeVisualToFindImage(
	visual: RecipeVisual,
	previousImage: FindMaterialDetailImage,
): FindMaterialDetailImage {
	const imageUri = visual.image ?? visual.imageUri;

	return {
		...previousImage,
		source: imageUri ? { uri: imageUri } : undefined,
		storagePath: visual.storagePath,
	};
}

function getImageSourceUri(image: FindMaterialDetailImage) {
	const source = image.image ?? image.source;

	if (source && typeof source === "object" && !Array.isArray(source) && "uri" in source) {
		return source.uri;
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

function uniquePaths(paths: (string | undefined)[]) {
	return [...new Set(paths.filter((path): path is string => Boolean(path)))];
}

function getConfiguredSupabaseClient() {
	const supabase = getSupabaseClientOrNull();

	if (!supabase) {
		throw new Error("Supabase가 설정되어 있지 않습니다.");
	}

	return supabase;
}
