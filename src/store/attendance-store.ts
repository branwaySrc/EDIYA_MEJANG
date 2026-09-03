import { create } from "zustand";

import { getAttendanceLogsSnapshot, getAttendanceRecordsSnapshot } from "@/database/employee/attendance";
import type {
	AttendanceLogAction,
	AttendanceLogRecord,
	AttendanceRecord,
	AttendanceScheduleEntry,
	AttendanceTemporaryWorker,
} from "@/database/employee/attendance.type";
import {
	attendanceLogPageSize,
	fetchSupabaseAttendanceLogsPageAsync,
	fetchSupabaseAttendanceSnapshotAsync,
	upsertSupabaseAttendanceTemporaryWorkerAsync,
	upsertSupabaseAttendanceMutationAsync,
} from "@/lib/employee/supabase-attendance-repository";
import { getKoreaTodayKey } from "@/lib/korea-date";

type AttendanceStoreState = {
	cancelAttendance: (entry: AttendanceScheduleEntry) => Promise<void>;
	cancelSubstitute: (entry: AttendanceScheduleEntry) => Promise<void>;
	hasMoreRemoteLogs: boolean;
	hydrateFromRemote: () => Promise<void>;
	lastHydratedAt: string | null;
	loadMoreLogs: () => Promise<void>;
	logsLoadingMore: boolean;
	logs: AttendanceLogRecord[];
	records: AttendanceRecord[];
	registerAttendance: (entry: AttendanceScheduleEntry, confirmedWorkMinutes: number) => Promise<void>;
	registerSubstitute: (
		entry: AttendanceScheduleEntry,
		substituteEmployeeId: string,
		confirmedWorkMinutes: number,
		substituteHourlyWageSnapshot: number,
	) => Promise<void>;
	registerTemporaryWorker: (
		entry: AttendanceScheduleEntry,
		worker: { hourlyWage: number; name: string; phone: string },
		confirmedWorkMinutes: number,
	) => Promise<void>;
	syncErrorMessage: string | null;
	syncing: boolean;
};

let mutationSequence = 0;

function createMutationId(prefix: string) {
	mutationSequence += 1;
	return `${prefix}-${Date.now()}-${mutationSequence}`;
}

function createUuid() {
	let timestamp = Date.now();
	let performanceTimestamp = typeof performance === "undefined" ? 0 : performance.now() * 1000;

	return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, character => {
		let random = Math.random() * 16;

		if (timestamp > 0) {
			random = (timestamp + random) % 16;
			timestamp = Math.floor(timestamp / 16);
		} else {
			random = (performanceTimestamp + random) % 16;
			performanceTimestamp = Math.floor(performanceTimestamp / 16);
		}

		const value = character === "x" ? random : (random % 4) + 8;
		return Math.floor(value).toString(16);
	});
}

function toBaseRecord(entry: AttendanceScheduleEntry): AttendanceRecord {
	return {
		id: entry.id,
		employeeId: entry.employeeId,
		isVacantSlot: entry.isVacantSlot,
		workDate: entry.workDate,
		scheduledStart: entry.scheduledStart,
		scheduledEnd: entry.scheduledEnd,
		shiftGroup: entry.shiftGroup,
		status: entry.status,
		checkedInAt: entry.checkedInAt,
		checkedOutAt: entry.checkedOutAt,
		confirmedWorkMinutes: entry.confirmedWorkMinutes,
		substituteEmployeeId: entry.substituteEmployeeId,
		substituteCheckedInAt: entry.substituteCheckedInAt,
		substituteConfirmedWorkMinutes: entry.substituteConfirmedWorkMinutes,
		substituteHourlyWageSnapshot: entry.substituteHourlyWageSnapshot,
		temporaryWorkerId: entry.temporaryWorkerId,
		temporaryWorkerName: entry.temporaryWorkerName,
		temporaryWorkerPhone: entry.temporaryWorkerPhone,
		updatedByEmployeeId: entry.updatedByEmployeeId,
		updatedByTemporaryWorkerId: entry.updatedByTemporaryWorkerId,
		updatedAt: entry.updatedAt,
	};
}

function replaceRecord(records: AttendanceRecord[], nextRecord: AttendanceRecord) {
	const recordExists = records.some(record => record.id === nextRecord.id);

	return recordExists
		? records.map(record => (record.id === nextRecord.id ? nextRecord : record))
		: [...records, nextRecord];
}

function replaceLog(logs: AttendanceLogRecord[], nextLog: AttendanceLogRecord) {
	const logExists = logs.some(log => log.id === nextLog.id);

	return logExists
		? logs.map(log =>
				log.id === nextLog.id
					? {
							...log,
							...nextLog,
							temporaryWorkerName: nextLog.temporaryWorkerName ?? log.temporaryWorkerName,
							temporaryWorkerPhone: nextLog.temporaryWorkerPhone ?? log.temporaryWorkerPhone,
						}
					: log,
			)
		: [nextLog, ...logs];
}

function mergeLogs(logs: AttendanceLogRecord[], nextLogs: AttendanceLogRecord[]) {
	const existingLogIds = new Set(logs.map(log => log.id));

	return [
		...logs,
		...nextLogs.filter(log => !existingLogIds.has(log.id)),
	];
}

function createLog(input: Omit<AttendanceLogRecord, "id">): AttendanceLogRecord {
	return {
		id: createMutationId("attendance-log"),
		...input,
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

async function syncAttendanceMutation(
	record: AttendanceRecord,
	log: AttendanceLogRecord,
	temporaryWorker?: AttendanceTemporaryWorker,
) {
	const remoteMutation = await upsertSupabaseAttendanceMutationAsync(record, log);

	if (!remoteMutation) {
		return;
	}

	useAttendanceStore.setState(state => ({
		logs: remoteMutation.log ? replaceLog(state.logs, remoteMutation.log) : state.logs,
		records: remoteMutation.record
			? replaceRecord(
					state.records,
					temporaryWorker
						? {
								...remoteMutation.record,
								temporaryWorkerName: temporaryWorker.name,
								temporaryWorkerPhone: temporaryWorker.phone,
							}
						: remoteMutation.record,
				)
			: state.records,
	}));
}

export const useAttendanceStore = create<AttendanceStoreState>(set => ({
	records: getAttendanceRecordsSnapshot(),
	logs: getAttendanceLogsSnapshot(),
	hasMoreRemoteLogs: false,
	lastHydratedAt: null,
	logsLoadingMore: false,
	syncErrorMessage: null,
	syncing: false,

	hydrateFromRemote: async () => {
		set({ syncing: true, syncErrorMessage: null });

		try {
			const remoteSnapshot = await fetchSupabaseAttendanceSnapshotAsync();

			if (remoteSnapshot) {
				set({
					hasMoreRemoteLogs: remoteSnapshot.hasMoreLogs,
					lastHydratedAt: new Date().toISOString(),
					logs: remoteSnapshot.logs,
					records: remoteSnapshot.records,
				});
			}
		} catch (error) {
			console.error("Failed to hydrate attendance from Supabase.", error);
			set({ syncErrorMessage: "근무근태 정보를 Supabase에서 불러오지 못했습니다." });
		} finally {
			set({ syncing: false });
		}
	},

	loadMoreLogs: async () => {
		const state = useAttendanceStore.getState();

		if (!state.hasMoreRemoteLogs || state.logsLoadingMore) {
			return;
		}

		set({ logsLoadingMore: true, syncErrorMessage: null });

		try {
			const remotePage = await fetchSupabaseAttendanceLogsPageAsync({
				limit: attendanceLogPageSize,
				offset: state.logs.length,
			});

			if (remotePage) {
				set(current => ({
					hasMoreRemoteLogs: remotePage.hasMore,
					logs: mergeLogs(current.logs, remotePage.logs),
				}));
			}
		} catch (error) {
			console.error("Failed to load more attendance logs from Supabase.", error);
			set({ syncErrorMessage: "근무근태 로그를 추가로 불러오지 못했습니다." });
		} finally {
			set({ logsLoadingMore: false });
		}
	},

	registerAttendance: async (entry, confirmedWorkMinutes) => {
		let mutation: { log: AttendanceLogRecord; record: AttendanceRecord } | null = null;

		set(state => {
			if (entry.isVacantSlot || !entry.employeeId) {
				return state;
			}

			const now = new Date();
			const createdAt = now.toISOString();
			const nextRecord: AttendanceRecord = {
				...toBaseRecord(entry),
				status: "completed",
				checkedInAt: createdAt,
				checkedOutAt: undefined,
				confirmedWorkMinutes,
				substituteEmployeeId: undefined,
				substituteCheckedInAt: undefined,
				substituteConfirmedWorkMinutes: undefined,
				updatedByEmployeeId: entry.employeeId,
				updatedByTemporaryWorkerId: undefined,
				updatedAt: createdAt,
			};
			const action: AttendanceLogAction = "attendance_register";
			const nextLog = createLog({
				action,
				attendanceId: nextRecord.id,
				createdAt,
				employeeId: entry.employeeId,
				message: buildLogMessage(action),
				updatedByEmployeeId: entry.employeeId,
			});

			mutation = {
				log: nextLog,
				record: nextRecord,
			};

			return {
				records: replaceRecord(state.records, nextRecord),
				logs: [nextLog, ...state.logs],
				syncErrorMessage: null,
			};
		});

		const remoteMutation = mutation as { log: AttendanceLogRecord; record: AttendanceRecord } | null;

		if (!remoteMutation) {
			return;
		}

		try {
			await syncAttendanceMutation(remoteMutation.record, remoteMutation.log);
		} catch (error) {
			console.error("Failed to sync attendance registration to Supabase.", error);
			set({ syncErrorMessage: "출근 등록을 Supabase에 저장하지 못했습니다. 화면에는 임시 반영되었습니다." });
		}
	},

	cancelAttendance: async entry => {
		let mutation: { log: AttendanceLogRecord; record: AttendanceRecord } | null = null;

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
				updatedByTemporaryWorkerId: undefined,
				updatedAt: createdAt,
			};
			const action: AttendanceLogAction = "attendance_cancel";
			const nextLog = createLog({
				action,
				attendanceId: nextRecord.id,
				createdAt,
				employeeId: entry.employeeId,
				message: buildLogMessage(action),
				updatedByEmployeeId: entry.employeeId,
			});

			mutation = {
				log: nextLog,
				record: nextRecord,
			};

			return {
				records: replaceRecord(state.records, nextRecord),
				logs: [nextLog, ...state.logs],
				syncErrorMessage: null,
			};
		});

		const remoteMutation = mutation as { log: AttendanceLogRecord; record: AttendanceRecord } | null;

		if (!remoteMutation) {
			return;
		}

		try {
			await syncAttendanceMutation(remoteMutation.record, remoteMutation.log);
		} catch (error) {
			console.error("Failed to sync attendance cancellation to Supabase.", error);
			set({ syncErrorMessage: "출근 취소를 Supabase에 저장하지 못했습니다. 화면에는 임시 반영되었습니다." });
		}
	},

	registerSubstitute: async (entry, substituteEmployeeId, confirmedWorkMinutes, substituteHourlyWageSnapshot) => {
		let mutation: { log: AttendanceLogRecord; record: AttendanceRecord } | null = null;

		if (!Number.isFinite(substituteHourlyWageSnapshot) || substituteHourlyWageSnapshot <= 0) {
			set({ syncErrorMessage: "대타 직원의 시급 정보가 없어 출근을 등록할 수 없습니다." });
			return;
		}

		set(state => {
			if (!entry.isVacantSlot && substituteEmployeeId === entry.employeeId) {
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
				substituteConfirmedWorkMinutes: confirmedWorkMinutes,
				substituteHourlyWageSnapshot,
				temporaryWorkerId: undefined,
				temporaryWorkerName: undefined,
				temporaryWorkerPhone: undefined,
				updatedByEmployeeId: substituteEmployeeId,
				updatedByTemporaryWorkerId: undefined,
				updatedAt: createdAt,
			};
			const action: AttendanceLogAction = "substitute_register";
			const nextLog = createLog({
				action,
				attendanceId: nextRecord.id,
				createdAt,
				employeeId: substituteEmployeeId,
				message: buildLogMessage(action),
				updatedByEmployeeId: substituteEmployeeId,
			});

			mutation = {
				log: nextLog,
				record: nextRecord,
			};

			return {
				records: replaceRecord(state.records, nextRecord),
				logs: [nextLog, ...state.logs],
				syncErrorMessage: null,
			};
		});

		const remoteMutation = mutation as { log: AttendanceLogRecord; record: AttendanceRecord } | null;

		if (!remoteMutation) {
			return;
		}

		try {
			await syncAttendanceMutation(remoteMutation.record, remoteMutation.log);
		} catch (error) {
			console.error("Failed to sync substitute registration to Supabase.", error);
			set({ syncErrorMessage: "대타 등록을 Supabase에 저장하지 못했습니다. 화면에는 임시 반영되었습니다." });
		}
	},

	registerTemporaryWorker: async (entry, workerDraft, confirmedWorkMinutes) => {
		const now = new Date();
		const createdAt = now.toISOString();
		const requestedTemporaryWorker: AttendanceTemporaryWorker = {
			createdAt,
			id: createUuid(),
			name: workerDraft.name.trim(),
			phone: workerDraft.phone,
			updatedAt: createdAt,
		};
		let temporaryWorker = requestedTemporaryWorker;

		try {
			temporaryWorker =
				(await upsertSupabaseAttendanceTemporaryWorkerAsync(requestedTemporaryWorker)) ??
				requestedTemporaryWorker;
		} catch (error) {
			console.error("Failed to resolve temporary worker in Supabase.", error);
			set({ syncErrorMessage: "임시근로자 정보를 Supabase에 저장하지 못했습니다." });
			return;
		}

		const nextRecord: AttendanceRecord = {
			...toBaseRecord(entry),
			status: "completed",
			checkedInAt: undefined,
			checkedOutAt: undefined,
			confirmedWorkMinutes: undefined,
			substituteEmployeeId: undefined,
			substituteCheckedInAt: createdAt,
			substituteConfirmedWorkMinutes: confirmedWorkMinutes,
			substituteHourlyWageSnapshot: workerDraft.hourlyWage,
			temporaryWorkerId: temporaryWorker.id,
			temporaryWorkerName: temporaryWorker.name,
			temporaryWorkerPhone: temporaryWorker.phone,
			updatedByEmployeeId: "",
			updatedByTemporaryWorkerId: temporaryWorker.id,
			updatedAt: createdAt,
		};
		const action: AttendanceLogAction = "substitute_register";
		const nextLog = createLog({
			action,
			attendanceId: nextRecord.id,
			createdAt,
			employeeId: "",
			message: `${temporaryWorker.name} 임시근로를 등록했습니다.`,
			substituteConfirmedWorkMinutesSnapshot: confirmedWorkMinutes,
			substituteHourlyWageSnapshot: workerDraft.hourlyWage,
			temporaryWorkerId: temporaryWorker.id,
			temporaryWorkerName: temporaryWorker.name,
			temporaryWorkerPhone: temporaryWorker.phone,
			updatedByEmployeeId: "",
			updatedByTemporaryWorkerId: temporaryWorker.id,
		});

		set(state => ({
			records: replaceRecord(state.records, nextRecord),
			logs: [nextLog, ...state.logs],
			syncErrorMessage: null,
		}));

		try {
			await syncAttendanceMutation(nextRecord, nextLog, temporaryWorker);
		} catch (error) {
			console.error("Failed to sync temporary worker registration to Supabase.", error);
			set({ syncErrorMessage: "임시근로자 등록을 Supabase에 저장하지 못했습니다. 화면에는 임시 반영되었습니다." });
		}
	},

	cancelSubstitute: async entry => {
		let mutation: { log: AttendanceLogRecord; record: AttendanceRecord } | null = null;

		set(state => {
			if (!entry.substituteEmployeeId && !entry.temporaryWorkerId) {
				return state;
			}

			const now = new Date();
			const createdAt = now.toISOString();
			const substituteEmployeeId = entry.substituteEmployeeId;
			const temporaryWorkerId = entry.temporaryWorkerId;
			const nextRecord: AttendanceRecord = {
				...toBaseRecord(entry),
				status: getCancelledStatus(entry.workDate, now),
				checkedInAt: undefined,
				checkedOutAt: undefined,
				confirmedWorkMinutes: undefined,
				substituteEmployeeId: undefined,
				substituteCheckedInAt: undefined,
				substituteConfirmedWorkMinutes: undefined,
				substituteHourlyWageSnapshot: undefined,
				temporaryWorkerId: undefined,
				temporaryWorkerName: undefined,
				temporaryWorkerPhone: undefined,
				updatedByEmployeeId: temporaryWorkerId ? "" : (substituteEmployeeId ?? entry.updatedByEmployeeId),
				updatedByTemporaryWorkerId: temporaryWorkerId ?? undefined,
				updatedAt: createdAt,
			};
			const action: AttendanceLogAction = "substitute_cancel";
			const nextLog = createLog({
				action,
				attendanceId: nextRecord.id,
				createdAt,
				employeeId: substituteEmployeeId ?? "",
				message: temporaryWorkerId ? `${entry.temporaryWorkerName ?? "임시근로자"} 임시근로를 취소했습니다.` : buildLogMessage(action),
				substituteConfirmedWorkMinutesSnapshot: temporaryWorkerId
					? entry.substituteConfirmedWorkMinutes
					: undefined,
				substituteHourlyWageSnapshot: temporaryWorkerId
					? entry.substituteHourlyWageSnapshot
					: undefined,
				temporaryWorkerId,
				temporaryWorkerName: entry.temporaryWorkerName,
				temporaryWorkerPhone: entry.temporaryWorkerPhone,
				updatedByEmployeeId: nextRecord.updatedByEmployeeId,
				updatedByTemporaryWorkerId: temporaryWorkerId ?? undefined,
			});

			mutation = {
				log: nextLog,
				record: nextRecord,
			};

			return {
				records: replaceRecord(state.records, nextRecord),
				logs: [nextLog, ...state.logs],
				syncErrorMessage: null,
			};
		});

		const remoteMutation = mutation as { log: AttendanceLogRecord; record: AttendanceRecord } | null;

		if (!remoteMutation) {
			return;
		}

		try {
			await syncAttendanceMutation(remoteMutation.record, remoteMutation.log);
		} catch (error) {
			console.error("Failed to sync substitute cancellation to Supabase.", error);
			set({ syncErrorMessage: "대타 취소를 Supabase에 저장하지 못했습니다. 화면에는 임시 반영되었습니다." });
		}
	},
}));
