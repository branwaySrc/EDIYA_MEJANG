import { create } from "zustand";

import { getAttendanceLogsSnapshot, getAttendanceRecordsSnapshot } from "@/database/employee/attendance";
import type {
	AttendanceLogAction,
	AttendanceLogRecord,
	AttendanceRecord,
	AttendanceScheduleEntry,
} from "@/database/employee/attendance.type";
import { getKoreaTodayKey } from "@/lib/korea-date";

type AttendanceStoreState = {
	cancelAttendance: (entry: AttendanceScheduleEntry) => void;
	cancelSubstitute: (entry: AttendanceScheduleEntry) => void;
	logs: AttendanceLogRecord[];
	records: AttendanceRecord[];
	registerAttendance: (entry: AttendanceScheduleEntry) => void;
	registerSubstitute: (entry: AttendanceScheduleEntry, substituteEmployeeId: string) => void;
};

let mutationSequence = 0;

function createMutationId(prefix: string) {
	mutationSequence += 1;
	return `${prefix}-${Date.now()}-${mutationSequence}`;
}

function toBaseRecord(entry: AttendanceScheduleEntry): AttendanceRecord {
	return {
		id: entry.id,
		employeeId: entry.employeeId,
		workDate: entry.workDate,
		scheduledStart: entry.scheduledStart,
		scheduledEnd: entry.scheduledEnd,
		status: entry.status,
		checkedInAt: entry.checkedInAt,
		checkedOutAt: entry.checkedOutAt,
		confirmedWorkMinutes: entry.confirmedWorkMinutes,
		substituteEmployeeId: entry.substituteEmployeeId,
		substituteCheckedInAt: entry.substituteCheckedInAt,
		substituteConfirmedWorkMinutes: entry.substituteConfirmedWorkMinutes,
		updatedByEmployeeId: entry.updatedByEmployeeId,
		updatedAt: entry.updatedAt,
	};
}

function replaceRecord(records: AttendanceRecord[], nextRecord: AttendanceRecord) {
	const recordExists = records.some(record => record.id === nextRecord.id);

	return recordExists
		? records.map(record => (record.id === nextRecord.id ? nextRecord : record))
		: [...records, nextRecord];
}

function createLog({
	action,
	attendanceId,
	createdAt,
	employeeId,
	message,
	updatedByEmployeeId,
}: Omit<AttendanceLogRecord, "id">): AttendanceLogRecord {
	return {
		id: createMutationId("attendance-log"),
		action,
		attendanceId,
		createdAt,
		employeeId,
		message,
		updatedByEmployeeId,
	};
}

function getCancelledStatus(workDate: string, now: Date) {
	return workDate < getKoreaTodayKey(now) ? "missed" : "scheduled";
}

function buildLogMessage(action: AttendanceLogAction) {
	switch (action) {
		case "attendance_cancel":
			return "출석을 취소했습니다.";
		case "substitute_register":
			return "대타 출석을 등록했습니다.";
		case "substitute_cancel":
			return "대타 출석을 취소했습니다.";
		case "attendance_register":
		default:
			return "출석을 등록했습니다.";
	}
}

export const useAttendanceStore = create<AttendanceStoreState>(set => ({
	records: getAttendanceRecordsSnapshot(),
	logs: getAttendanceLogsSnapshot(),

	registerAttendance: entry =>
		set(state => {
			const now = new Date();
			const createdAt = now.toISOString();
			const nextRecord: AttendanceRecord = {
				...toBaseRecord(entry),
				status: "completed",
				checkedInAt: createdAt,
				checkedOutAt: undefined,
				confirmedWorkMinutes: entry.scheduledMinutes,
				substituteEmployeeId: undefined,
				substituteCheckedInAt: undefined,
				substituteConfirmedWorkMinutes: undefined,
				updatedByEmployeeId: entry.employeeId,
				updatedAt: createdAt,
			};
			const action: AttendanceLogAction = "attendance_register";

			return {
				records: replaceRecord(state.records, nextRecord),
				logs: [
					createLog({
						action,
						attendanceId: nextRecord.id,
						createdAt,
						employeeId: entry.employeeId,
						message: buildLogMessage(action),
						updatedByEmployeeId: entry.employeeId,
					}),
					...state.logs,
				],
			};
		}),

	cancelAttendance: entry =>
		set(state => {
			const now = new Date();
			const createdAt = now.toISOString();
			const nextRecord: AttendanceRecord = {
				...toBaseRecord(entry),
				status: getCancelledStatus(entry.workDate, now),
				checkedInAt: undefined,
				checkedOutAt: undefined,
				confirmedWorkMinutes: undefined,
				substituteEmployeeId: undefined,
				substituteCheckedInAt: undefined,
				substituteConfirmedWorkMinutes: undefined,
				updatedByEmployeeId: entry.employeeId,
				updatedAt: createdAt,
			};
			const action: AttendanceLogAction = "attendance_cancel";

			return {
				records: replaceRecord(state.records, nextRecord),
				logs: [
					createLog({
						action,
						attendanceId: nextRecord.id,
						createdAt,
						employeeId: entry.employeeId,
						message: buildLogMessage(action),
						updatedByEmployeeId: entry.employeeId,
					}),
					...state.logs,
				],
			};
		}),

	registerSubstitute: (entry, substituteEmployeeId) =>
		set(state => {
			if (substituteEmployeeId === entry.employeeId) {
				return state;
			}

			const now = new Date();
			const createdAt = now.toISOString();
			const nextRecord: AttendanceRecord = {
				...toBaseRecord(entry),
				status: "completed",
				checkedInAt: undefined,
				checkedOutAt: undefined,
				confirmedWorkMinutes: undefined,
				substituteEmployeeId,
				substituteCheckedInAt: createdAt,
				substituteConfirmedWorkMinutes: entry.scheduledMinutes,
				updatedByEmployeeId: substituteEmployeeId,
				updatedAt: createdAt,
			};
			const action: AttendanceLogAction = "substitute_register";

			return {
				records: replaceRecord(state.records, nextRecord),
				logs: [
					createLog({
						action,
						attendanceId: nextRecord.id,
						createdAt,
						employeeId: substituteEmployeeId,
						message: buildLogMessage(action),
						updatedByEmployeeId: substituteEmployeeId,
					}),
					...state.logs,
				],
			};
		}),

	cancelSubstitute: entry =>
		set(state => {
			if (!entry.substituteEmployeeId) {
				return state;
			}

			const now = new Date();
			const createdAt = now.toISOString();
			const substituteEmployeeId = entry.substituteEmployeeId;
			const nextRecord: AttendanceRecord = {
				...toBaseRecord(entry),
				status: getCancelledStatus(entry.workDate, now),
				checkedInAt: undefined,
				checkedOutAt: undefined,
				confirmedWorkMinutes: undefined,
				substituteEmployeeId: undefined,
				substituteCheckedInAt: undefined,
				substituteConfirmedWorkMinutes: undefined,
				updatedByEmployeeId: substituteEmployeeId,
				updatedAt: createdAt,
			};
			const action: AttendanceLogAction = "substitute_cancel";

			return {
				records: replaceRecord(state.records, nextRecord),
				logs: [
					createLog({
						action,
						attendanceId: nextRecord.id,
						createdAt,
						employeeId: substituteEmployeeId,
						message: buildLogMessage(action),
						updatedByEmployeeId: substituteEmployeeId,
					}),
					...state.logs,
				],
			};
		}),
}));
