import { File } from "expo-file-system";

import { getSupabaseClientOrNull } from "@/lib/supabase/supabase-client";

export const paidReceiptBucketName = "paid-receipts";

const maxStandardUploadBytes = 6 * 1024 * 1024;

type UploadPaidReceiptImageInput = {
	customerId: string;
	imageUri: string;
	ledgerEntryId: string;
	storeId: string;
};

export async function uploadPaidReceiptImageIfConfiguredAsync({
	customerId,
	imageUri,
	ledgerEntryId,
	storeId,
}: UploadPaidReceiptImageInput): Promise<string | null> {
	const supabase = getSupabaseClientOrNull();

	if (!supabase || !imageUri) {
		return null;
	}

	const imageBytes = await readImageBytesAsync(imageUri);

	if (imageBytes.byteLength > maxStandardUploadBytes) {
		throw new Error("영수증 이미지는 6MB 이하만 업로드할 수 있습니다.");
	}

	const extension = getImageExtension(imageUri);
	const storagePath = [
		"stores",
		sanitizePathSegment(storeId),
		"customers",
		sanitizePathSegment(customerId),
		"ledger",
		sanitizePathSegment(ledgerEntryId),
		`${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${extension}`,
	].join("/");
	const { error } = await supabase.storage.from(paidReceiptBucketName).upload(storagePath, imageBytes, {
		cacheControl: "31536000",
		contentType: getImageContentType(extension),
		upsert: false,
	});

	if (error) {
		throw error;
	}

	return storagePath;
}

export async function createPaidReceiptSignedUrlAsync(storagePath: string): Promise<string | null> {
	const supabase = getSupabaseClientOrNull();

	if (!supabase) {
		return null;
	}

	const { data, error } = await supabase.storage.from(paidReceiptBucketName).createSignedUrl(storagePath, 60 * 60);

	if (error) {
		throw error;
	}

	return data.signedUrl;
}

async function readImageBytesAsync(imageUri: string): Promise<ArrayBuffer> {
	if (imageUri.startsWith("https://") || imageUri.startsWith("http://")) {
		const response = await fetch(imageUri);

		if (!response.ok) {
			throw new Error(`영수증 이미지 파일을 읽지 못했습니다. (${response.status})`);
		}

		return await response.arrayBuffer();
	}

	const imageFile = new File(imageUri);

	if (!imageFile.exists) {
		throw new Error("선택한 영수증 이미지 파일이 기기에 존재하지 않습니다. 다시 촬영하거나 선택해 주세요.");
	}

	return await imageFile.arrayBuffer();
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
