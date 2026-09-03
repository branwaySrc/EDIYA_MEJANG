import { File } from "expo-file-system";

import type { EmployeeDocumentRecord, EmployeeEmploymentPeriodRecord, EmployeeRecord } from "@/database/employee/employee.type";
import { getSupabaseClientOrNull } from "@/lib/supabase/supabase-client";

export const defaultEmployeeStoreId = "wolpi";
export const employeeDocumentBucketName = "employee-documents";

const employeeTableName = "employees";
const employeeDocumentTableName = "employee_documents";
const employeeEmploymentPeriodTableName = "employee_employment_periods";
const maxEmployeeDocumentBytes = 20 * 1024 * 1024;

type SupabaseEmployeeRecord = EmployeeRecord & {
	store_id: string;
};

type SupabaseEmployeeDocumentRecord = Omit<EmployeeDocumentRecord, "local_uri"> & {
	local_uri?: string | null;
	store_id: string;
};

type EmployeeManagementRemoteSnapshot = {
	documents: EmployeeDocumentRecord[];
	employmentPeriods: EmployeeEmploymentPeriodRecord[];
	records: EmployeeRecord[];
};

export async function fetchSupabaseEmployeeManagementAsync(storeId = defaultEmployeeStoreId): Promise<EmployeeManagementRemoteSnapshot | null> {
	const supabase = getSupabaseClientOrNull();

	if (!supabase) {
		return null;
	}

	const [employeeResult, employmentPeriodResult, documentResult] = await Promise.all([
		supabase
			.from(employeeTableName)
			.select("*")
			.eq("store_id", storeId)
			.order("is_owner", { ascending: false })
			.order("shift_group", { ascending: true })
			.order("name", { ascending: true }),
		supabase
			.from(employeeEmploymentPeriodTableName)
			.select("*")
			.eq("store_id", storeId)
			.order("started_on", { ascending: true }),
		supabase
			.from(employeeDocumentTableName)
			.select("*")
			.eq("store_id", storeId)
			.order("uploaded_at", { ascending: false }),
	]);

	if (employeeResult.error) {
		throw employeeResult.error;
	}

	if (employmentPeriodResult.error) {
		throw employmentPeriodResult.error;
	}

	if (documentResult.error) {
		throw documentResult.error;
	}

	return {
		documents: ((documentResult.data ?? []) as SupabaseEmployeeDocumentRecord[]).map(document => mapEmployeeDocumentRecord(document)),
		employmentPeriods: (employmentPeriodResult.data ?? []) as EmployeeEmploymentPeriodRecord[],
		records: ((employeeResult.data ?? []) as SupabaseEmployeeRecord[]).map(mapEmployeeRecord),
	};
}

export async function upsertSupabaseEmployeeRecordAsync(record: EmployeeRecord, storeId = defaultEmployeeStoreId): Promise<EmployeeRecord | null> {
	const supabase = getSupabaseClientOrNull();

	if (!supabase) {
		return null;
	}

	const { data, error } = await supabase
		.from(employeeTableName)
		.upsert(toSupabaseEmployeeRow(record, storeId), { onConflict: "id" })
		.select("*")
		.single();

	if (error) {
		throw error;
	}

	return data ? mapEmployeeRecord(data as SupabaseEmployeeRecord) : null;
}

export async function updateSupabaseEmployeeRecordAsync(
	employeeId: string,
	patch: Partial<EmployeeRecord>,
	storeId = defaultEmployeeStoreId,
): Promise<EmployeeRecord | null> {
	const supabase = getSupabaseClientOrNull();

	if (!supabase) {
		return null;
	}

	const { data, error } = await supabase
		.from(employeeTableName)
		.update(toSupabaseEmployeePatch(patch))
		.eq("id", employeeId)
		.eq("store_id", storeId)
		.select("*")
		.single();

	if (error) {
		throw error;
	}

	return data ? mapEmployeeRecord(data as SupabaseEmployeeRecord) : null;
}

export async function deleteSupabaseEmployeeRecordAsync(employeeId: string, storeId = defaultEmployeeStoreId) {
	const supabase = getSupabaseClientOrNull();

	if (!supabase) {
		return;
	}

	const { error } = await supabase.from(employeeTableName).delete().eq("id", employeeId).eq("store_id", storeId);

	if (error) {
		throw error;
	}
}

export async function uploadSupabaseEmployeeDocumentAsync(
	document: EmployeeDocumentRecord,
	storeId = defaultEmployeeStoreId,
): Promise<EmployeeDocumentRecord | null> {
	const supabase = getSupabaseClientOrNull();

	if (!supabase) {
		return null;
	}

	const storagePath =
		document.storage_path ??
		[
			sanitizePathSegment(storeId),
			sanitizePathSegment(document.employee_id),
			sanitizePathSegment(document.id),
			sanitizeFileName(document.file_name),
		].join("/");
	const fileBytes = await readDocumentBytesAsync(document.local_uri);

	if (fileBytes.byteLength > maxEmployeeDocumentBytes) {
		throw new Error("직원 서류는 20MB 이하의 PDF 또는 이미지 파일만 업로드할 수 있습니다.");
	}

	const { error: uploadError } = await supabase.storage.from(employeeDocumentBucketName).upload(storagePath, fileBytes, {
		cacheControl: "31536000",
		contentType: document.mime_type ?? getContentTypeFromFileName(document.file_name),
		upsert: true,
	});

	if (uploadError) {
		throw uploadError;
	}

	const remoteDocument: EmployeeDocumentRecord = {
		...document,
		storage_bucket: employeeDocumentBucketName,
		storage_path: storagePath,
	};

	return await upsertSupabaseEmployeeDocumentRecordAsync(remoteDocument, storeId);
}

export async function upsertSupabaseEmployeeDocumentRecordAsync(
	document: EmployeeDocumentRecord,
	storeId = defaultEmployeeStoreId,
): Promise<EmployeeDocumentRecord | null> {
	const supabase = getSupabaseClientOrNull();

	if (!supabase) {
		return null;
	}

	const { data, error } = await supabase
		.from(employeeDocumentTableName)
		.upsert(toSupabaseEmployeeDocumentRow(document, storeId), { onConflict: "id" })
		.select("*")
		.single();

	if (error) {
		throw error;
	}

	return data ? mapEmployeeDocumentRecord(data as SupabaseEmployeeDocumentRecord, document.local_uri) : null;
}

export async function deleteSupabaseEmployeeDocumentAsync(document: EmployeeDocumentRecord, storeId = defaultEmployeeStoreId) {
	const supabase = getSupabaseClientOrNull();

	if (!supabase) {
		return;
	}

	if (document.storage_path) {
		const storageResult = await supabase.storage.from(document.storage_bucket ?? employeeDocumentBucketName).remove([document.storage_path]);

		if (storageResult.error) {
			throw storageResult.error;
		}
	}

	const { error } = await supabase.from(employeeDocumentTableName).delete().eq("id", document.id).eq("store_id", storeId);

	if (error) {
		throw error;
	}
}

function mapEmployeeRecord(record: SupabaseEmployeeRecord): EmployeeRecord {
	return {
		address: record.address,
		bank_account_number: record.bank_account_number,
		bank_name: record.bank_name,
		birth_date: record.birth_date,
		created_at: record.created_at,
		email: record.email,
		employment_status: record.employment_status,
		hourly_wage: record.hourly_wage,
		id: record.id,
		is_owner: record.is_owner,
		joined_at: record.joined_at,
		name: record.name,
		phone: record.phone,
		phone_public: record.phone_public,
		shift_group: record.shift_group,
		terminated_at: record.terminated_at,
		updated_at: record.updated_at,
		work_days: record.work_days ?? [],
		work_end_minutes: record.work_end_minutes,
		workplace_id: record.workplace_id,
		workplace_name: record.workplace_name,
		work_start_minutes: record.work_start_minutes,
	};
}

function mapEmployeeDocumentRecord(record: SupabaseEmployeeDocumentRecord, localUri = ""): EmployeeDocumentRecord {
	return {
		created_at: record.created_at,
		document_type: record.document_type,
		employee_id: record.employee_id,
		file_name: record.file_name,
		file_size: record.file_size,
		id: record.id,
		local_uri: record.local_uri ?? localUri,
		mime_type: record.mime_type,
		storage_bucket: record.storage_bucket,
		storage_path: record.storage_path,
		updated_at: record.updated_at,
		uploaded_at: record.uploaded_at,
	};
}

function toSupabaseEmployeeRow(record: EmployeeRecord, storeId: string): SupabaseEmployeeRecord {
	return {
		...record,
		store_id: storeId,
	};
}

function toSupabaseEmployeePatch(patch: Partial<EmployeeRecord>): Partial<SupabaseEmployeeRecord> {
	const { created_at, id, ...safePatch } = patch;

	void created_at;
	void id;

	return {
		...safePatch,
		updated_at: new Date().toISOString(),
	};
}

function toSupabaseEmployeeDocumentRow(
	document: EmployeeDocumentRecord,
	storeId: string,
): SupabaseEmployeeDocumentRecord {
	return {
		created_at: document.created_at,
		document_type: document.document_type,
		employee_id: document.employee_id,
		file_name: document.file_name,
		file_size: document.file_size,
		id: document.id,
		mime_type: document.mime_type,
		storage_bucket: document.storage_bucket ?? employeeDocumentBucketName,
		storage_path: document.storage_path ?? "",
		store_id: storeId,
		updated_at: document.updated_at,
		uploaded_at: document.uploaded_at,
	};
}

async function readDocumentBytesAsync(uri: string): Promise<ArrayBuffer> {
	if (uri.startsWith("https://") || uri.startsWith("http://")) {
		const response = await fetch(uri);

		if (!response.ok) {
			throw new Error(`직원 서류 파일을 읽지 못했습니다. (${response.status})`);
		}

		return await response.arrayBuffer();
	}

	const documentFile = new File(uri);

	if (!documentFile.exists) {
		throw new Error("선택한 직원 서류 파일이 기기에 존재하지 않습니다. 다시 선택해 주세요.");
	}

	return await documentFile.arrayBuffer();
}

function sanitizePathSegment(value: string) {
	return value.replace(/[^a-zA-Z0-9_-]/g, "-");
}

function sanitizeFileName(value: string) {
	return value.replace(/[<>:"/\\|?*\u0000-\u001F]/g, "_").trim() || "document";
}

function getContentTypeFromFileName(fileName: string) {
	const extension = fileName.match(/\.([a-zA-Z0-9]+)$/)?.[1]?.toLowerCase();

	switch (extension) {
		case "pdf":
			return "application/pdf";
		case "png":
			return "image/png";
		case "webp":
			return "image/webp";
		case "heic":
			return "image/heic";
		case "heif":
			return "image/heif";
		default:
			return "image/jpeg";
	}
}
