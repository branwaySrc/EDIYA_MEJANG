import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import { Platform } from "react-native";

import { createHiringContractHtml } from "@/components/features/sajang/hiring/hiring-contract-template";
import { hiringOwnerName, type HiringContractMetadata, type HiringContractRecord, type HiringContractResult, type HiringDraft, type HiringSignatureImages } from "@/components/features/sajang/hiring/hiring-types";
import { getKoreaTodayKey } from "@/lib/korea-date";

const contractsDirectoryName = "hiring-contracts";
const downloadDirectoryName = "Download";
const pdfA4Height = 842;
const pdfA4Width = 595;
const pdfMimeType = "application/pdf";

function sanitizeFileName(value: string) {
	return value.trim().replace(/[^\w가-힣-]+/g, "_") || "employee";
}

function createRecordId(prefix: string) {
	return `${prefix}-${Date.now()}`;
}

function createContractFileBaseName(draft: HiringDraft) {
	return [draft.employeeName, draft.storeName, getKoreaTodayKey()].map(sanitizeFileName).join("_");
}

function normalizeHiringDraft(draft: HiringDraft): HiringDraft {
	return {
		...draft,
		ownerName: hiringOwnerName,
	};
}

async function savePdfToDownloadFolder(fileBaseName: string, pdfBase64: string) {
	if (Platform.OS !== "android") {
		return null;
	}

	const initialUri = FileSystem.StorageAccessFramework.getUriForDirectoryInRoot(downloadDirectoryName);
	const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync(initialUri);

	if (!permissions.granted) {
		throw new Error("다운로드 폴더 권한이 필요합니다. 폴더 선택 화면에서 Download 폴더를 허용해 주세요.");
	}

	const pdfUri = await FileSystem.StorageAccessFramework.createFileAsync(permissions.directoryUri, fileBaseName, pdfMimeType);

	await FileSystem.writeAsStringAsync(pdfUri, pdfBase64, {
		encoding: FileSystem.EncodingType.Base64,
	});

	return {
		pdfUri,
		storagePath: downloadDirectoryName,
	};
}

async function savePdfToAppDirectory(fileName: string, pdfBase64: string) {
	const documentDirectory = FileSystem.documentDirectory;

	if (!documentDirectory) {
		throw new Error("로컬 저장소를 사용할 수 없습니다.");
	}

	const directoryUri = `${documentDirectory}${contractsDirectoryName}/`;
	await FileSystem.makeDirectoryAsync(directoryUri, { intermediates: true });

	const pdfUri = `${directoryUri}${fileName}`;

	await FileSystem.writeAsStringAsync(pdfUri, pdfBase64, {
		encoding: FileSystem.EncodingType.Base64,
	});

	return {
		pdfUri,
		storagePath: "app-document-directory",
	};
}

export function createHiringContractRecord(draft: HiringDraft, result: HiringContractResult): HiringContractRecord {
	return {
		id: result.contractId,
		employeeId: result.employeeId,
		draft: normalizeHiringDraft(draft),
		fileName: result.fileName,
		pdfUri: result.pdfUri,
		metadataUri: result.metadataUri,
		signedAt: result.savedAt,
		createdAt: result.savedAt,
		storageBucket: result.storageBucket,
		storagePath: result.storagePath,
	};
}

export async function deleteHiringContractFilesAsync(record: HiringContractRecord) {
	const uris = [record.pdfUri, record.metadataUri].filter(Boolean);

	await Promise.all(
		uris.map(async uri => {
			try {
				await FileSystem.deleteAsync(uri, { idempotent: true });
			} catch {
				// Storage Access Framework permissions can expire; the app record is still removable.
			}
		}),
	);
}

export async function createAndSaveHiringContractPdf(draft: HiringDraft, signatures: HiringSignatureImages): Promise<HiringContractResult> {
	const savedAt = new Date().toISOString();
	const contractId = createRecordId("contract");
	const employeeId = createRecordId("employee");
	const contractDraft = normalizeHiringDraft(draft);
	const html = createHiringContractHtml(contractDraft, signatures);
	const printed = await Print.printToFileAsync({
		base64: true,
		height: pdfA4Height,
		html,
		width: pdfA4Width,
	});
	const documentDirectory = FileSystem.documentDirectory;

	if (!documentDirectory) {
		throw new Error("로컬 저장소를 사용할 수 없습니다.");
	}

	if (!printed.base64) {
		throw new Error("PDF 데이터를 생성하지 못했습니다.");
	}

	const directoryUri = `${documentDirectory}${contractsDirectoryName}/`;
	await FileSystem.makeDirectoryAsync(directoryUri, { intermediates: true });

	const fileBaseName = createContractFileBaseName(contractDraft);
	const fileName = `${fileBaseName}.pdf`;
	const metadataUri = `${directoryUri}${fileBaseName}_${contractId}.json`;
	const savedPdf = (await savePdfToDownloadFolder(fileBaseName, printed.base64)) ?? (await savePdfToAppDirectory(fileName, printed.base64));

	const result: HiringContractResult = {
		contractId,
		employeeId,
		fileName,
		metadataUri,
		pdfUri: savedPdf.pdfUri,
		savedAt,
		sentAt: savedAt,
		storageBucket: null,
		storagePath: savedPdf.storagePath,
	};
	const metadata: HiringContractMetadata = {
		draft: contractDraft,
		fileName,
		pdfUri: savedPdf.pdfUri,
		signatures,
		signedAt: savedAt,
		contractRecord: createHiringContractRecord(draft, result),
		storageBucket: null,
		storagePath: savedPdf.storagePath,
	};

	await FileSystem.writeAsStringAsync(metadataUri, JSON.stringify(metadata, null, 2));

	return result;
}

export const createAndSendHiringContractPdf = createAndSaveHiringContractPdf;
