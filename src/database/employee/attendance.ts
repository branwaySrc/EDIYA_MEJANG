import type {
	AttendanceLogRecord,
	AttendanceLogRow,
	AttendanceRecord,
	AttendanceRecordRow,
	AttendanceTemporaryWorker,
	AttendanceTemporaryWorkerRow,
} from "@/database/employee/attendance.type";

export const defaultAttendanceStoreId = "wolpi";

export const attendanceRecordTable = {
	checkedInAt: "checked_in_at",
	checkedOutAt: "checked_out_at",
	confirmedWorkMinutes: "confirmed_work_minutes",
	employeeId: "employee_id",
	id: "id",
	isVacantSlot: "is_vacant_slot",
	scheduledEnd: "scheduled_end",
	scheduledStart: "scheduled_start",
	shiftGroup: "shift_group",
	status: "status",
	storeId: "store_id",
	substituteCheckedInAt: "substitute_checked_in_at",
	substituteConfirmedWorkMinutes: "substitute_confirmed_work_minutes",
	substituteEmployeeId: "substitute_employee_id",
	substituteHourlyWageSnapshot: "substitute_hourly_wage_snapshot",
	temporaryWorkerId: "temporary_worker_id",
	updatedAt: "updated_at",
	updatedByEmployeeId: "updated_by_employee_id",
	updatedByTemporaryWorkerId: "updated_by_temporary_worker_id",
	workDate: "work_date",
} as const;

export const attendanceLogTable = {
	action: "action",
	attendanceId: "attendance_id",
	createdAt: "created_at",
	employeeId: "employee_id",
	id: "id",
	message: "message",
	storeId: "store_id",
	updatedByEmployeeId: "updated_by_employee_id",
} as const;

export const sampleAttendanceRecords: AttendanceRecord[] = [
	{
		id: "attendance-20260720-open-001",
		employeeId: "open-001",
		workDate: "2026-07-20",
		scheduledStart: "07:00",
		scheduledEnd: "12:00",
		status: "completed",
		checkedInAt: "2026-07-19T22:04:00.000Z",
		checkedOutAt: "2026-07-20T03:02:00.000Z",
		confirmedWorkMinutes: 300,
		updatedByEmployeeId: "open-001",
		updatedAt: "2026-07-19T22:04:00.000Z",
	},
	{
		id: "attendance-20260720-middle-001",
		employeeId: "middle-001",
		workDate: "2026-07-20",
		scheduledStart: "12:00",
		scheduledEnd: "17:00",
		status: "completed",
		checkedInAt: "2026-07-20T03:01:00.000Z",
		checkedOutAt: "2026-07-20T08:03:00.000Z",
		confirmedWorkMinutes: 300,
		updatedByEmployeeId: "middle-001",
		updatedAt: "2026-07-20T03:01:00.000Z",
	},
	{
		id: "attendance-20260720-close-001",
		employeeId: "close-001",
		workDate: "2026-07-20",
		scheduledStart: "17:00",
		scheduledEnd: "22:00",
		status: "completed",
		checkedInAt: "2026-07-20T08:06:00.000Z",
		checkedOutAt: "2026-07-20T13:00:00.000Z",
		confirmedWorkMinutes: 300,
		updatedByEmployeeId: "owner-001",
		updatedAt: "2026-07-20T13:02:00.000Z",
	},
	{
		id: "attendance-20260721-open-002",
		employeeId: "open-002",
		workDate: "2026-07-21",
		scheduledStart: "08:00",
		scheduledEnd: "13:00",
		status: "completed",
		checkedInAt: "2026-07-20T23:00:00.000Z",
		checkedOutAt: "2026-07-21T04:01:00.000Z",
		confirmedWorkMinutes: 300,
		updatedByEmployeeId: "open-002",
		updatedAt: "2026-07-20T23:00:00.000Z",
	},
	{
		id: "attendance-20260721-middle-002",
		employeeId: "middle-002",
		workDate: "2026-07-21",
		scheduledStart: "13:00",
		scheduledEnd: "18:00",
		status: "completed",
		checkedInAt: "2026-07-21T04:09:00.000Z",
		checkedOutAt: "2026-07-21T09:02:00.000Z",
		confirmedWorkMinutes: 300,
		updatedByEmployeeId: "owner-001",
		updatedAt: "2026-07-21T04:10:00.000Z",
	},
	{
		id: "attendance-20260722-open-001",
		employeeId: "open-001",
		workDate: "2026-07-22",
		scheduledStart: "07:00",
		scheduledEnd: "12:00",
		status: "completed",
		checkedInAt: "2026-07-21T22:02:00.000Z",
		checkedOutAt: "2026-07-22T03:00:00.000Z",
		confirmedWorkMinutes: 300,
		updatedByEmployeeId: "open-001",
		updatedAt: "2026-07-21T22:02:00.000Z",
	},
	{
		id: "attendance-20260722-middle-003",
		employeeId: "middle-003",
		workDate: "2026-07-22",
		scheduledStart: "14:00",
		scheduledEnd: "19:00",
		status: "completed",
		checkedInAt: "2026-07-22T05:00:00.000Z",
		checkedOutAt: "2026-07-22T10:04:00.000Z",
		confirmedWorkMinutes: 300,
		updatedByEmployeeId: "middle-003",
		updatedAt: "2026-07-22T05:00:00.000Z",
	},
	{
		id: "attendance-20260722-close-003",
		employeeId: "close-003",
		workDate: "2026-07-22",
		scheduledStart: "19:00",
		scheduledEnd: "24:00",
		status: "completed",
		checkedInAt: "2026-07-22T10:07:00.000Z",
		checkedOutAt: "2026-07-22T15:00:00.000Z",
		confirmedWorkMinutes: 300,
		updatedByEmployeeId: "owner-001",
		updatedAt: "2026-07-22T15:03:00.000Z",
	},
	{
		id: "attendance-20260724-open-003",
		employeeId: "open-003",
		workDate: "2026-07-24",
		scheduledStart: "09:00",
		scheduledEnd: "14:00",
		status: "completed",
		checkedInAt: "2026-07-24T00:03:00.000Z",
		checkedOutAt: "2026-07-24T05:02:00.000Z",
		confirmedWorkMinutes: 300,
		updatedByEmployeeId: "open-003",
		updatedAt: "2026-07-24T00:03:00.000Z",
	},
	{
		id: "attendance-20260724-middle-002",
		employeeId: "middle-002",
		workDate: "2026-07-24",
		scheduledStart: "13:00",
		scheduledEnd: "18:00",
		status: "completed",
		checkedInAt: "2026-07-24T04:05:00.000Z",
		checkedOutAt: "2026-07-24T09:00:00.000Z",
		confirmedWorkMinutes: 300,
		updatedByEmployeeId: "middle-002",
		updatedAt: "2026-07-24T04:05:00.000Z",
	},
	{
		id: "attendance-20260725-close-002",
		employeeId: "close-002",
		workDate: "2026-07-25",
		scheduledStart: "18:00",
		scheduledEnd: "23:00",
		status: "completed",
		checkedInAt: "2026-07-25T09:12:00.000Z",
		checkedOutAt: "2026-07-25T14:00:00.000Z",
		confirmedWorkMinutes: 300,
		updatedByEmployeeId: "owner-001",
		updatedAt: "2026-07-25T09:14:00.000Z",
	},
	{
		id: "attendance-20260726-middle-004",
		employeeId: "middle-004",
		workDate: "2026-07-26",
		scheduledStart: "12:00",
		scheduledEnd: "20:00",
		status: "completed",
		checkedInAt: "2026-07-26T03:01:00.000Z",
		checkedOutAt: "2026-07-26T11:03:00.000Z",
		confirmedWorkMinutes: 480,
		updatedByEmployeeId: "middle-004",
		updatedAt: "2026-07-26T03:01:00.000Z",
	},
	{
		id: "attendance-20260727-open-001",
		employeeId: "open-001",
		workDate: "2026-07-27",
		scheduledStart: "07:00",
		scheduledEnd: "12:00",
		status: "completed",
		checkedInAt: "2026-07-26T22:03:00.000Z",
		confirmedWorkMinutes: 300,
		updatedByEmployeeId: "open-001",
		updatedAt: "2026-07-26T22:03:00.000Z",
	},
	{
		id: "attendance-20260727-open-003",
		employeeId: "open-003",
		workDate: "2026-07-27",
		scheduledStart: "09:00",
		scheduledEnd: "14:00",
		status: "completed",
		checkedInAt: "2026-07-27T00:01:00.000Z",
		confirmedWorkMinutes: 300,
		updatedByEmployeeId: "owner-001",
		updatedAt: "2026-07-27T00:04:00.000Z",
	},
];

export const sampleAttendanceLogs: AttendanceLogRecord[] = [
	{
		id: "attendance-log-20260727-open-003-update",
		attendanceId: "attendance-20260727-open-003",
		employeeId: "open-003",
		action: "update",
		updatedByEmployeeId: "owner-001",
		createdAt: "2026-07-27T00:04:00.000Z",
		message: "출근 시간을 확인하고 완료 상태로 변경했습니다.",
	},
	{
		id: "attendance-log-20260727-open-003-clock-in",
		attendanceId: "attendance-20260727-open-003",
		employeeId: "open-003",
		action: "clock_in",
		updatedByEmployeeId: "open-003",
		createdAt: "2026-07-27T00:01:00.000Z",
		message: "출근 등록을 완료했습니다.",
	},
	{
		id: "attendance-log-20260727-open-001-clock-in",
		attendanceId: "attendance-20260727-open-001",
		employeeId: "open-001",
		action: "clock_in",
		updatedByEmployeeId: "open-001",
		createdAt: "2026-07-26T22:03:00.000Z",
		message: "출근 등록을 완료했습니다.",
	},
	{
		id: "attendance-log-20260726-middle-004-confirm",
		attendanceId: "attendance-20260726-middle-004",
		employeeId: "middle-004",
		action: "confirm",
		updatedByEmployeeId: "owner-001",
		createdAt: "2026-07-26T11:05:00.000Z",
		message: "근무 시간을 확인했습니다.",
	},
	{
		id: "attendance-log-20260725-close-002-update",
		attendanceId: "attendance-20260725-close-002",
		employeeId: "close-002",
		action: "update",
		updatedByEmployeeId: "owner-001",
		createdAt: "2026-07-25T09:14:00.000Z",
		message: "지각 출근 시간을 반영했습니다.",
	},
	{
		id: "attendance-log-20260724-middle-002-clock-in",
		attendanceId: "attendance-20260724-middle-002",
		employeeId: "middle-002",
		action: "clock_in",
		updatedByEmployeeId: "middle-002",
		createdAt: "2026-07-24T04:05:00.000Z",
		message: "출근 등록을 완료했습니다.",
	},
];

export function toAttendanceRecord(row: AttendanceRecordRow, temporaryWorker?: AttendanceTemporaryWorker): AttendanceRecord {
	return {
		id: row.id,
		employeeId: row.employee_id ?? "",
		isVacantSlot: row.is_vacant_slot ?? false,
		workDate: row.work_date,
		scheduledStart: row.scheduled_start ?? "",
		scheduledEnd: row.scheduled_end ?? "",
		shiftGroup: row.shift_group,
		status: row.status,
		checkedInAt: row.checked_in_at ?? undefined,
		checkedOutAt: row.checked_out_at ?? undefined,
		confirmedWorkMinutes: row.confirmed_work_minutes ?? undefined,
		substituteEmployeeId: row.substitute_employee_id ?? undefined,
		substituteCheckedInAt: row.substitute_checked_in_at ?? undefined,
		substituteConfirmedWorkMinutes: row.substitute_confirmed_work_minutes ?? undefined,
		substituteHourlyWageSnapshot: row.substitute_hourly_wage_snapshot ?? undefined,
		temporaryWorkerId: row.temporary_worker_id ?? undefined,
		temporaryWorkerName: temporaryWorker?.name,
		temporaryWorkerPhone: temporaryWorker?.phone,
		updatedByEmployeeId: row.updated_by_employee_id ?? "",
		updatedByTemporaryWorkerId: row.updated_by_temporary_worker_id ?? undefined,
		updatedAt: row.updated_at,
	};
}

export function toAttendanceRecordRow(record: AttendanceRecord, storeId = defaultAttendanceStoreId): AttendanceRecordRow {
	if (!record.shiftGroup) {
		throw new Error("Attendance record shift group is required for Supabase sync.");
	}

	return {
		id: record.id,
		store_id: storeId,
		employee_id: record.isVacantSlot ? null : record.employeeId,
		is_vacant_slot: record.isVacantSlot ?? false,
		work_date: record.workDate,
		scheduled_start: record.scheduledStart || null,
		scheduled_end: record.scheduledEnd || null,
		shift_group: record.shiftGroup,
		status: record.status,
		checked_in_at: record.checkedInAt ?? null,
		checked_out_at: record.checkedOutAt ?? null,
		confirmed_work_minutes: record.confirmedWorkMinutes ?? null,
		substitute_employee_id: record.substituteEmployeeId ?? null,
		substitute_checked_in_at: record.substituteCheckedInAt ?? null,
		substitute_confirmed_work_minutes: record.substituteConfirmedWorkMinutes ?? null,
		substitute_hourly_wage_snapshot: record.substituteHourlyWageSnapshot ?? null,
		temporary_worker_id: record.temporaryWorkerId ?? null,
		updated_by_employee_id: record.updatedByEmployeeId || null,
		updated_by_temporary_worker_id: record.updatedByTemporaryWorkerId ?? null,
		updated_at: record.updatedAt,
	};
}

export function toAttendanceLog(row: AttendanceLogRow, temporaryWorker?: AttendanceTemporaryWorker): AttendanceLogRecord {
	return {
		id: row.id,
		attendanceId: row.attendance_id,
		employeeId: row.employee_id ?? "",
		action: row.action,
		updatedByEmployeeId: row.updated_by_employee_id ?? "",
		updatedByTemporaryWorkerId: row.updated_by_temporary_worker_id ?? undefined,
		createdAt: row.created_at,
		message: row.message,
		substituteConfirmedWorkMinutesSnapshot: row.substitute_confirmed_work_minutes_snapshot ?? undefined,
		substituteHourlyWageSnapshot: row.substitute_hourly_wage_snapshot ?? undefined,
		temporaryWorkerId: row.temporary_worker_id ?? undefined,
		temporaryWorkerName: temporaryWorker?.name,
		temporaryWorkerPhone: temporaryWorker?.phone,
	};
}

export function toAttendanceLogRow(log: AttendanceLogRecord, storeId = defaultAttendanceStoreId): AttendanceLogRow {
	return {
		id: log.id,
		store_id: storeId,
		attendance_id: log.attendanceId,
		employee_id: log.employeeId || null,
		action: log.action,
		updated_by_employee_id: log.updatedByEmployeeId || null,
		updated_by_temporary_worker_id: log.updatedByTemporaryWorkerId ?? null,
		created_at: log.createdAt,
		message: log.message,
		substitute_confirmed_work_minutes_snapshot: log.substituteConfirmedWorkMinutesSnapshot ?? null,
		substitute_hourly_wage_snapshot: log.substituteHourlyWageSnapshot ?? null,
		temporary_worker_id: log.temporaryWorkerId ?? null,
	};
}

export function toAttendanceTemporaryWorker(row: AttendanceTemporaryWorkerRow): AttendanceTemporaryWorker {
	return {
		createdAt: row.created_at,
		id: row.id,
		name: row.name,
		phone: row.phone,
		updatedAt: row.updated_at,
	};
}

export function toAttendanceTemporaryWorkerRow(
	worker: AttendanceTemporaryWorker,
	storeId = defaultAttendanceStoreId,
): AttendanceTemporaryWorkerRow {
	return {
		created_at: worker.createdAt,
		id: worker.id,
		name: worker.name,
		phone: worker.phone,
		store_id: storeId,
		updated_at: worker.updatedAt,
	};
}

export function getAttendanceRecordsSnapshot(): AttendanceRecord[] {
	return sampleAttendanceRecords.map(record => ({ ...record }));
}

export function getAttendanceLogsSnapshot(): AttendanceLogRecord[] {
	return sampleAttendanceLogs.map(log => ({ ...log }));
}

export async function fetchAttendanceRecords(): Promise<AttendanceRecord[]> {
	return getAttendanceRecordsSnapshot();
}

export async function fetchAttendanceLogs(): Promise<AttendanceLogRecord[]> {
	return getAttendanceLogsSnapshot();
}
