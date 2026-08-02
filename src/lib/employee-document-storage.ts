import * as FileSystem from "expo-file-system/legacy";

import type { EmployeeDocumentRecord, EmployeeDocumentType } from "@/database/employee/employee.type";

const employeeDocumentRoot = FileSystem.documentDirectory ? `${FileSystem.documentDirectory}employee-documents/` : null;

function createDocumentId() {
	return `employee-document-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function sanitizeFileName(fileName: string) {
	const sanitized = fileName.replace(/[<>:"/\\|?*\u0000-\u001F]/g, "_").trim();

	return sanitized || "document";
}

async function ensureEmployeeDirectory(employeeId: string) {
	if (!employeeDocumentRoot) {
		return null;
	}

	const directory = `${employeeDocumentRoot}${encodeURIComponent(employeeId)}/`;
	await FileSystem.makeDirectoryAsync(directory, { intermediates: true });

	return directory;
}

export async function pickEmployeeDocumentAsync(
	employeeId: string,
	documentType: EmployeeDocumentType,
): Promise<EmployeeDocumentRecord | null> {
	const DocumentPicker = await import("expo-document-picker");
	const result = await DocumentPicker.getDocumentAsync({
		copyToCacheDirectory: true,
		multiple: false,
		type: ["application/pdf", "image/*"],
	});

	if (result.canceled) {
		return null;
	}

	const asset = result.assets[0];
	const id = createDocumentId();
	const uploadedAt = new Date().toISOString();
	const directory = await ensureEmployeeDirectory(employeeId);
	let localUri = asset.uri;

	if (directory) {
		const destination = `${directory}${id}-${encodeURIComponent(sanitizeFileName(asset.name))}`;
		await FileSystem.copyAsync({ from: asset.uri, to: destination });
		localUri = destination;
	}

	return {
		created_at: uploadedAt,
		document_type: documentType,
		employee_id: employeeId,
		file_name: asset.name,
		file_size: asset.size ?? null,
		id,
		local_uri: localUri,
		mime_type: asset.mimeType ?? null,
		storage_bucket: null,
		storage_path: null,
		updated_at: uploadedAt,
		uploaded_at: uploadedAt,
	};
}

export async function deleteEmployeeDocumentFileAsync(localUri: string) {
	if (!employeeDocumentRoot || !localUri.startsWith(employeeDocumentRoot)) {
		return;
	}

	await FileSystem.deleteAsync(localUri, { idempotent: true });
}
