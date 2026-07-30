import * as FileSystem from "expo-file-system/legacy";
import * as MailComposer from "expo-mail-composer";
import * as Print from "expo-print";

import { createHiringContractHtml } from "@/components/features/sajang/hiring/hiring-contract-template";
import type { HiringContractMetadata, HiringContractResult, HiringDraft } from "@/components/features/sajang/hiring/hiring-types";

function sanitizeFileName(value: string) {
	return value.trim().replace(/[^\w가-힣-]+/g, "_") || "employee";
}

function getTimestamp() {
	return new Date().toISOString().replace(/[:.]/g, "-");
}

function getRecipients(draft: HiringDraft) {
	return [draft.ownerEmail.trim(), draft.employeeEmail.trim()].filter(Boolean);
}

export async function createAndSendHiringContractPdf(draft: HiringDraft, signatureImageDataUrl: string): Promise<HiringContractResult> {
	const signedAt = new Date().toLocaleString("ko-KR");
	const html = createHiringContractHtml(draft, signatureImageDataUrl, signedAt);
	const printed = await Print.printToFileAsync({ html });
	const documentDirectory = FileSystem.documentDirectory;

	if (!documentDirectory) {
		throw new Error("로컬 저장소를 사용할 수 없습니다.");
	}

	const directoryUri = `${documentDirectory}hiring-contracts/`;
	await FileSystem.makeDirectoryAsync(directoryUri, { intermediates: true });

	const fileBaseName = `${sanitizeFileName(draft.employeeName)}_${getTimestamp()}`;
	const fileName = `${fileBaseName}.pdf`;
	const pdfUri = `${directoryUri}${fileName}`;
	const metadataUri = `${directoryUri}${fileBaseName}.json`;

	await FileSystem.copyAsync({
		from: printed.uri,
		to: pdfUri,
	});

	const metadata: HiringContractMetadata = {
		draft,
		fileName,
		pdfUri,
		signedAt,
		signatureImageDataUrl,
		storageBucket: null,
		storagePath: null,
	};

	await FileSystem.writeAsStringAsync(metadataUri, JSON.stringify(metadata, null, 2));

	const mailAvailable = await MailComposer.isAvailableAsync();

	if (mailAvailable) {
		await MailComposer.composeAsync({
			recipients: getRecipients(draft),
			subject: `[${draft.storeName}] ${draft.employeeName} 근로계약서`,
			body: "첨부된 근로계약서 PDF를 확인해 주세요.",
			attachments: [pdfUri],
		});
	}

	return {
		fileName,
		metadataUri,
		pdfUri,
		sentAt: signedAt,
		storageBucket: null,
		storagePath: null,
	};
}
