import type {
	AttendanceMonthSummary,
	AttendanceRecord,
	AttendanceScheduleEntry,
	EmployeeAttendanceSummary,
} from "@/database/employee/attendance.type";
import type { Employee } from "@/database/employee/employee.type";
import {
	buildCalendarMonthDays,
	formatDateKey,
	getTimeDurationMinutes,
	getWeekday,
	parseWorkTime,
	type CalendarMonth,
} from "@/lib/korea-date";

export type BuildAttendanceScheduleOptions = CalendarMonth & {
	employees: Employee[];
	records: AttendanceRecord[];
	todayKey: string;
};

export type BuildAttendanceScheduleForDatesOptions = {
	dateKeys: string[];
	employees: Employee[];
	records: AttendanceRecord[];
	todayKey: string;
};

export type BuildEmployeeAttendanceMonthSummaryOptions = BuildAttendanceScheduleOptions & {
	employeeId: string;
};

function createScheduleKey(employeeId: string, workDate: string) {
	return `${employeeId}:${workDate}`;
}

function createScheduleEntry(
	employee: Employee,
	workDate: string,
	todayKey: string,
	record?: AttendanceRecord,
	substituteEmployee?: Employee,
): AttendanceScheduleEntry | null {
	const scheduleTime = parseWorkTime(employee.workTime);

	if (!scheduleTime) {
		return null;
	}

	const scheduledStart = record?.scheduledStart ?? scheduleTime.start;
	const scheduledEnd = record?.scheduledEnd ?? scheduleTime.end;
	const defaultStatus = workDate < todayKey ? "missed" : "scheduled";

	return {
		id: record?.id ?? `schedule-${workDate}-${employee.id}`,
		employeeId: employee.id,
		employeeName: employee.name,
		kakaoName: employee.kakaoName,
		shiftGroup: employee.shiftGroup,
		workDate,
		scheduledStart,
		scheduledEnd,
		scheduledMinutes: getTimeDurationMinutes(scheduledStart, scheduledEnd),
		status: record?.status ?? defaultStatus,
		checkedInAt: record?.checkedInAt,
		checkedOutAt: record?.checkedOutAt,
		confirmedWorkMinutes: record?.confirmedWorkMinutes,
		substituteEmployeeId: record?.substituteEmployeeId,
		substituteEmployeeName: substituteEmployee?.name,
		substituteKakaoName: substituteEmployee?.kakaoName,
		substituteCheckedInAt: record?.substituteCheckedInAt,
		substituteConfirmedWorkMinutes: record?.substituteConfirmedWorkMinutes,
		updatedByEmployeeId: record?.updatedByEmployeeId ?? employee.id,
		updatedAt: record?.updatedAt ?? `${workDate}T00:00:00.000Z`,
	};
}

export function buildAttendanceSchedule({
	employees,
	month,
	records,
	todayKey,
	year,
}: BuildAttendanceScheduleOptions): AttendanceScheduleEntry[] {
	const dateKeys = buildCalendarMonthDays({ year, month })
		.filter(day => day.inCurrentMonth)
		.map(day => day.dateKey);

	return buildAttendanceScheduleForDates({
		dateKeys,
		employees,
		records,
		todayKey,
	});
}

export function buildAttendanceScheduleForDates({
	dateKeys,
	employees,
	records,
	todayKey,
}: BuildAttendanceScheduleForDatesOptions): AttendanceScheduleEntry[] {
	const staff = employees.filter(employee => !employee.owner);
	const employeeById = new Map(staff.map(employee => [employee.id, employee]));
	const recordBySchedule = new Map(records.map(record => [createScheduleKey(record.employeeId, record.workDate), record]));
	const requestedDateKeys = new Set(dateKeys);
	const scheduleByKey = new Map<string, AttendanceScheduleEntry>();

	for (const dateKey of requestedDateKeys) {
		const weekday = getWeekday(dateKey);

		for (const employee of staff) {
			if (employee.joinedAt > dateKey || !employee.workDays.includes(weekday)) {
				continue;
			}

			const key = createScheduleKey(employee.id, dateKey);
			const record = recordBySchedule.get(key);
			const substituteEmployee = record?.substituteEmployeeId
				? employeeById.get(record.substituteEmployeeId)
				: undefined;
			const entry = createScheduleEntry(employee, dateKey, todayKey, record, substituteEmployee);

			if (entry) {
				scheduleByKey.set(key, entry);
			}
		}
	}

	for (const record of records) {
		if (!requestedDateKeys.has(record.workDate)) {
			continue;
		}

		const key = createScheduleKey(record.employeeId, record.workDate);

		if (scheduleByKey.has(key)) {
			continue;
		}

		const employee = employeeById.get(record.employeeId);
		const substituteEmployee = record.substituteEmployeeId
			? employeeById.get(record.substituteEmployeeId)
			: undefined;
		const entry = employee
			? createScheduleEntry(employee, record.workDate, todayKey, record, substituteEmployee)
			: null;

		if (entry) {
			scheduleByKey.set(key, entry);
		}
	}

	return [...scheduleByKey.values()].sort(
		(left, right) =>
			left.workDate.localeCompare(right.workDate) ||
			left.scheduledStart.localeCompare(right.scheduledStart) ||
			left.employeeName.localeCompare(right.employeeName, "ko"),
	);
}

export function groupAttendanceByDate(entries: AttendanceScheduleEntry[]) {
	const grouped = new Map<string, AttendanceScheduleEntry[]>();

	for (const entry of entries) {
		const dateEntries = grouped.get(entry.workDate) ?? [];
		dateEntries.push(entry);
		grouped.set(entry.workDate, dateEntries);
	}

	return grouped;
}

function buildEmployeeSummary(
	employee: Employee,
	entries: AttendanceScheduleEntry[],
	todayKey: string,
): EmployeeAttendanceSummary {
	const employeeEntries = entries.filter(entry => entry.employeeId === employee.id);
	const elapsedEntries = employeeEntries.filter(entry => entry.workDate <= todayKey);
	const completedEntries = elapsedEntries.filter(
		entry => entry.status === "completed" && !entry.substituteEmployeeId,
	);
	const missedEntries = elapsedEntries.filter(
		entry => entry.status === "missed" || (entry.status === "completed" && Boolean(entry.substituteEmployeeId)),
	);
	const substituteEntries = entries.filter(
		entry => entry.substituteEmployeeId === employee.id && entry.status === "completed",
	);
	const completedMinutes = completedEntries.reduce(
		(total, entry) => total + (entry.confirmedWorkMinutes ?? entry.scheduledMinutes),
		0,
	);

	return {
		employeeId: employee.id,
		employeeName: employee.name,
		shiftGroup: employee.shiftGroup,
		scheduledShiftCount: employeeEntries.length,
		elapsedShiftCount: elapsedEntries.length,
		completedShiftCount: completedEntries.length,
		contractedMinutes: employeeEntries.reduce((total, entry) => total + entry.scheduledMinutes, 0),
		completedMinutes,
		missedMinutes: missedEntries.reduce((total, entry) => total + entry.scheduledMinutes, 0),
		attendanceRate: elapsedEntries.length === 0 ? 0 : completedEntries.length / elapsedEntries.length,
		completedDates: completedEntries.map(entry => entry.workDate),
		missedDates: missedEntries.map(entry => entry.workDate),
		substituteShiftCount: substituteEntries.length,
		substituteMinutes: substituteEntries.reduce(
			(total, entry) => total + (entry.substituteConfirmedWorkMinutes ?? entry.scheduledMinutes),
			0,
		),
		substituteDates: substituteEntries.map(entry => entry.workDate),
	};
}

export function buildAttendanceMonthSummary(
	entries: AttendanceScheduleEntry[],
	employees: Employee[],
	todayKey: string,
): AttendanceMonthSummary {
	const employeeSummaries = employees
		.filter(employee => !employee.owner)
		.map(employee => buildEmployeeSummary(employee, entries, todayKey))
		.filter(summary => summary.scheduledShiftCount > 0);
	const elapsedEntries = entries.filter(entry => entry.workDate <= todayKey);
	const completedEntries = elapsedEntries.filter(entry => entry.status === "completed");
	const missedEntries = elapsedEntries.filter(entry => entry.status === "missed");
	const substituteEntries = entries.filter(
		entry => entry.status === "completed" && Boolean(entry.substituteEmployeeId),
	);

	return {
		scheduledShiftCount: entries.length,
		elapsedShiftCount: elapsedEntries.length,
		completedShiftCount: completedEntries.length,
		missedShiftCount: missedEntries.length,
		contractedMinutes: entries.reduce((total, entry) => total + entry.scheduledMinutes, 0),
		completedMinutes: completedEntries.reduce(
			(total, entry) => total + (entry.confirmedWorkMinutes ?? entry.scheduledMinutes),
			0,
		),
		missedMinutes: missedEntries.reduce((total, entry) => total + entry.scheduledMinutes, 0),
		attendanceRate: elapsedEntries.length === 0 ? 0 : completedEntries.length / elapsedEntries.length,
		substituteShiftCount: substituteEntries.length,
		substituteMinutes: substituteEntries.reduce(
			(total, entry) => total + (entry.substituteConfirmedWorkMinutes ?? entry.scheduledMinutes),
			0,
		),
		employeeSummaries,
	};
}

export function buildEmployeeAttendanceMonthSummary({
	employeeId,
	employees,
	month,
	records,
	todayKey,
	year,
}: BuildEmployeeAttendanceMonthSummaryOptions) {
	const schedule = buildAttendanceSchedule({
		employees,
		month,
		records,
		todayKey,
		year,
	});

	return buildAttendanceMonthSummary(schedule, employees, todayKey).employeeSummaries
		.find(summary => summary.employeeId === employeeId) ?? null;
}

export function getTodayAttendanceEntries(entries: AttendanceScheduleEntry[], todayKey: string) {
	return entries.filter(entry => entry.workDate === todayKey);
}

export function getMonthDateKey({ month, year }: CalendarMonth, day: number) {
	return formatDateKey(year, month, day);
}

export function isEmployeeScheduledOnDate(employee: Employee, dateKey: string) {
	return employee.joinedAt <= dateKey && employee.workDays.includes(getWeekday(dateKey));
}
