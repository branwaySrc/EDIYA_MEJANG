import {
	defaultAttendanceStoreId,
	toAttendanceLog,
	toAttendanceLogRow,
	toAttendanceRecord,
	toAttendanceRecordRow,
	toAttendanceTemporaryWorker,
	toAttendanceTemporaryWorkerRow,
} from "@/database/employee/attendance";
import type {
	AttendanceLogRecord,
	AttendanceLogRow,
	AttendanceMonthArchive,
	AttendanceMonthCoverage,
	AttendanceMonthCoverageRow,
	AttendanceRecord,
	AttendanceRecordRow,
	AttendanceTemporaryWorker,
	AttendanceTemporaryWorkerRow,
} from "@/database/employee/attendance.type";
import { getSupabaseClientOrNull } from "@/lib/supabase/supabase-client";

const attendanceRecordTableName = "attendance_records";
const attendanceLogTableName = "attendance_logs";
const attendanceMonthCoverageTableName = "attendance_month_coverages";
const attendanceTemporaryWorkerTableName = "attendance_temporary_workers";
export const attendanceLogPageSize = 30;

type AttendanceRemoteSnapshot = {
	hasMoreLogs: boolean;
	logs: AttendanceLogRecord[];
	records: AttendanceRecord[];
};

type AttendanceMutationResult = {
	log: AttendanceLogRecord | null;
	record: AttendanceRecord | null;
};

export async function fetchSupabaseAttendanceSnapshotAsync(
	storeId = defaultAttendanceStoreId,
): Promise<AttendanceRemoteSnapshot | null> {
	const supabase = getSupabaseClientOrNull();

	if (!supabase) {
		return null;
	}

	const [recordResult, temporaryWorkerResult] = await Promise.all([
		supabase
			.from(attendanceRecordTableName)
			.select("*")
			.eq("store_id", storeId)
			.order("work_date", { ascending: false })
			.order("scheduled_start", { ascending: true }),
		supabase
			.from(attendanceTemporaryWorkerTableName)
			.select("*")
			.eq("store_id", storeId),
	]);

	if (recordResult.error) {
		throw recordResult.error;
	}

	if (temporaryWorkerResult.error) {
		throw temporaryWorkerResult.error;
	}

	const temporaryWorkers = ((temporaryWorkerResult.data ?? []) as AttendanceTemporaryWorkerRow[]).map(toAttendanceTemporaryWorker);
	const temporaryWorkerById = new Map(temporaryWorkers.map(worker => [worker.id, worker]));
	const records = ((recordResult.data ?? []) as AttendanceRecordRow[]).map(row =>
		toAttendanceRecord(row, row.temporary_worker_id ? temporaryWorkerById.get(row.temporary_worker_id) : undefined),
	);

	const logPage = await fetchSupabaseAttendanceLogsPageAsync({
		limit: attendanceLogPageSize,
		storeId,
	});

	if (!logPage) {
		return {
			hasMoreLogs: false,
			logs: [],
			records,
		};
	}

	return {
		hasMoreLogs: logPage.hasMore,
		logs: logPage.logs,
		records,
	};
}

export async function upsertSupabaseAttendanceTemporaryWorkerAsync(
	worker: AttendanceTemporaryWorker,
	storeId = defaultAttendanceStoreId,
) {
	const supabase = getSupabaseClientOrNull();

	if (!supabase) {
		return null;
	}

	const workerRow = toAttendanceTemporaryWorkerRow(worker, storeId);
	const { error: upsertError } = await supabase
		.from(attendanceTemporaryWorkerTableName)
		.upsert(workerRow, {
			ignoreDuplicates: true,
			onConflict: "store_id,phone",
		});

	if (upsertError) {
		throw upsertError;
	}

	const { data, error: selectError } = await supabase
		.from(attendanceTemporaryWorkerTableName)
		.select("*")
		.eq("store_id", storeId)
		.eq("phone", worker.phone)
		.single();

	if (selectError) {
		throw selectError;
	}

	return data ? toAttendanceTemporaryWorker(data as AttendanceTemporaryWorkerRow) : null;
}

export async function fetchSupabaseAttendanceLogsPageAsync({
	limit = attendanceLogPageSize,
	offset = 0,
	storeId = defaultAttendanceStoreId,
}: {
	limit?: number;
	offset?: number;
	storeId?: string;
} = {}): Promise<{ hasMore: boolean; logs: AttendanceLogRecord[] } | null> {
	const supabase = getSupabaseClientOrNull();

	if (!supabase) {
		return null;
	}

	const from = Math.max(0, offset);
	const pageSize = Math.max(1, limit);
	const to = from + pageSize;
	const [logResult, temporaryWorkerResult] = await Promise.all([
		supabase
			.from(attendanceLogTableName)
			.select("*")
			.eq("store_id", storeId)
			.order("created_at", { ascending: false })
			.range(from, to),
		supabase
			.from(attendanceTemporaryWorkerTableName)
			.select("*")
			.eq("store_id", storeId),
	]);

	if (logResult.error) {
		throw logResult.error;
	}

	if (temporaryWorkerResult.error) {
		throw temporaryWorkerResult.error;
	}

	const rows = (logResult.data ?? []) as AttendanceLogRow[];
	const temporaryWorkerById = new Map(
		((temporaryWorkerResult.data ?? []) as AttendanceTemporaryWorkerRow[])
			.map(toAttendanceTemporaryWorker)
			.map(worker => [worker.id, worker]),
	);

	return {
		hasMore: rows.length > pageSize,
		logs: rows.slice(0, pageSize).map(row =>
			toAttendanceLog(row, row.temporary_worker_id ? temporaryWorkerById.get(row.temporary_worker_id) : undefined),
		),
	};
}

export async function upsertSupabaseAttendanceMutationAsync(
	record: AttendanceRecord,
	log: AttendanceLogRecord,
	storeId = defaultAttendanceStoreId,
): Promise<AttendanceMutationResult | null> {
	const supabase = getSupabaseClientOrNull();

	if (!supabase) {
		return null;
	}

	const recordResult = await supabase
		.from(attendanceRecordTableName)
		.upsert(toAttendanceRecordRow(record, storeId), { onConflict: "id" })
		.select("*")
		.single();

	if (recordResult.error) {
		throw recordResult.error;
	}

	const logResult = await supabase
		.from(attendanceLogTableName)
		.insert(toAttendanceLogRow(log, storeId))
		.select("*")
		.single();

	if (logResult.error) {
		throw logResult.error;
	}

	return {
		log: logResult.data ? toAttendanceLog(logResult.data as AttendanceLogRow) : null,
		record: recordResult.data ? toAttendanceRecord(recordResult.data as AttendanceRecordRow) : null,
	};
}

export async function fetchSupabaseAttendanceMonthArchiveAsync(
	monthKey: string,
	storeId = defaultAttendanceStoreId,
): Promise<AttendanceMonthArchive | null> {
	const supabase = getSupabaseClientOrNull();

	if (!supabase) {
		return null;
	}

	const coverageResult = await supabase
		.from(attendanceMonthCoverageTableName)
		.select("*")
		.eq("store_id", storeId)
		.eq("month_key", monthKey)
		.maybeSingle();

	if (coverageResult.error) {
		throw coverageResult.error;
	}

	if (!coverageResult.data) {
		return null;
	}

	const range = getMonthDateRange(monthKey);

	if (!range) {
		return null;
	}

	const [recordResult, temporaryWorkerResult] = await Promise.all([
		supabase
			.from(attendanceRecordTableName)
			.select("*")
			.eq("store_id", storeId)
			.gte("work_date", range.startDate)
			.lt("work_date", range.endDate)
			.order("work_date", { ascending: true })
			.order("scheduled_start", { ascending: true }),
		supabase
			.from(attendanceTemporaryWorkerTableName)
			.select("*")
			.eq("store_id", storeId),
	]);

	if (recordResult.error) {
		throw recordResult.error;
	}

	if (temporaryWorkerResult.error) {
		throw temporaryWorkerResult.error;
	}

	const temporaryWorkerById = new Map(
		((temporaryWorkerResult.data ?? []) as AttendanceTemporaryWorkerRow[])
			.map(toAttendanceTemporaryWorker)
			.map(worker => [worker.id, worker]),
	);

	return {
		coverage: toAttendanceMonthCoverage(coverageResult.data as AttendanceMonthCoverageRow),
		records: ((recordResult.data ?? []) as AttendanceRecordRow[]).map(row =>
			toAttendanceRecord(row, row.temporary_worker_id ? temporaryWorkerById.get(row.temporary_worker_id) : undefined),
		),
	};
}

function toAttendanceMonthCoverage(row: AttendanceMonthCoverageRow): AttendanceMonthCoverage {
	return {
		closedAt: row.closed_at ?? undefined,
		monthKey: row.month_key,
		status: row.status,
	};
}

function getMonthDateRange(monthKey: string) {
	const match = /^(\d{4})-(\d{2})$/.exec(monthKey);

	if (!match) {
		return null;
	}

	const year = Number(match[1]);
	const month = Number(match[2]);

	if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
		return null;
	}

	const nextYear = month === 12 ? year + 1 : year;
	const nextMonth = month === 12 ? 1 : month + 1;

	return {
		endDate: `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`,
		startDate: `${year}-${String(month).padStart(2, "0")}-01`,
	};
}
