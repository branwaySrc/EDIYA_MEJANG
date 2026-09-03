import type {
	AttendanceMonthArchive,
	AttendanceMonthCoverage,
	AttendanceMonthCoverageRow,
	AttendanceRecord,
} from "@/database/employee/attendance.type";
import { defaultAttendanceStoreId } from "@/database/employee/attendance";
import { sampleEmployees } from "@/database/employee/employee";
import {
	buildCalendarMonthDays,
	getTimeDurationMinutes,
	getWeekday,
	parseDateKey,
	parseWorkTime,
} from "@/lib/korea-date";
import { fetchSupabaseAttendanceMonthArchiveAsync } from "@/lib/employee/supabase-attendance-repository";

export const attendanceMonthCoverageTable = {
	closedAt: "closed_at",
	monthKey: "month_key",
	status: "status",
	storeId: "store_id",
} as const;

export const sampleAttendanceMonthCoverages: AttendanceMonthCoverage[] = [
	{
		monthKey: "2026-06",
		status: "closed",
		closedAt: "2026-07-03T03:00:00.000Z",
	},
];

const substituteByScheduleKey = new Map([
	["open-002:2026-06-16", "middle-002"],
]);

function toKoreaIsoDateTime(dateKey: string, time: string) {
	const { day, month, year } = parseDateKey(dateKey);
	const [hour, minute] = time.split(":").map(Number);
	return new Date(Date.UTC(year, month - 1, day, hour - 9, minute)).toISOString();
}

function buildJuneAttendanceRecords() {
	const days = buildCalendarMonthDays({ year: 2026, month: 6 })
		.filter(day => day.inCurrentMonth);
	const records: AttendanceRecord[] = [];

	for (const employee of sampleEmployees) {
		const workTime = parseWorkTime(employee.workTime);

		if (!workTime) {
			continue;
		}

		let employeeShiftIndex = 0;

		for (const day of days) {
			if (employee.joinedAt > day.dateKey || !employee.workDays.includes(getWeekday(day.dateKey))) {
				continue;
			}

			employeeShiftIndex += 1;
			const scheduleKey = `${employee.id}:${day.dateKey}`;
			const substituteEmployeeId = substituteByScheduleKey.get(scheduleKey);
			const missed = !substituteEmployeeId && employeeShiftIndex % 7 === 0;
			const scheduledMinutes = getTimeDurationMinutes(workTime.start, workTime.end);
			const checkedInAt = toKoreaIsoDateTime(day.dateKey, workTime.start);
			const checkedOutAt = toKoreaIsoDateTime(day.dateKey, workTime.end);
			const updatedByEmployeeId = substituteEmployeeId ?? employee.id;

			records.push({
				id: `attendance-history-${day.dateKey}-${employee.id}`,
				employeeId: employee.id,
				workDate: day.dateKey,
				scheduledStart: workTime.start,
				scheduledEnd: workTime.end,
				status: missed ? "missed" : "completed",
				checkedInAt: missed || substituteEmployeeId ? undefined : checkedInAt,
				checkedOutAt: missed || substituteEmployeeId ? undefined : checkedOutAt,
				confirmedWorkMinutes: missed || substituteEmployeeId ? undefined : scheduledMinutes,
				substituteEmployeeId,
				substituteCheckedInAt: substituteEmployeeId ? checkedInAt : undefined,
				substituteConfirmedWorkMinutes: substituteEmployeeId ? scheduledMinutes : undefined,
				updatedByEmployeeId,
				updatedAt: checkedOutAt,
			});
		}
	}

	return records;
}

export const sampleArchivedAttendanceRecords: AttendanceRecord[] = buildJuneAttendanceRecords();

export function toAttendanceMonthCoverage(row: AttendanceMonthCoverageRow): AttendanceMonthCoverage {
	return {
		monthKey: row.month_key,
		status: row.status,
		closedAt: row.closed_at ?? undefined,
	};
}

export function toAttendanceMonthCoverageRow(
	coverage: AttendanceMonthCoverage,
	storeId = defaultAttendanceStoreId,
): AttendanceMonthCoverageRow {
	return {
		month_key: coverage.monthKey,
		store_id: storeId,
		status: coverage.status,
		closed_at: coverage.closedAt ?? null,
	};
}

export function getAttendanceMonthArchiveSnapshot(monthKey: string): AttendanceMonthArchive | null {
	const coverage = sampleAttendanceMonthCoverages.find(item => item.monthKey === monthKey);

	if (!coverage) {
		return null;
	}

	return {
		coverage: { ...coverage },
		records: sampleArchivedAttendanceRecords
			.filter(record => record.workDate.startsWith(`${monthKey}-`))
			.map(record => ({ ...record })),
	};
}

export async function fetchAttendanceMonthArchive(monthKey: string): Promise<AttendanceMonthArchive | null> {
	try {
		const remoteArchive = await fetchSupabaseAttendanceMonthArchiveAsync(monthKey);

		if (remoteArchive) {
			return remoteArchive;
		}
	} catch (error) {
		console.error("Failed to fetch attendance month archive from Supabase.", error);
	}

	return getAttendanceMonthArchiveSnapshot(monthKey);
}
