import type {
	AttendanceMonthSummary,
	AttendanceRecord,
	AttendanceScheduleEntry,
	EmployeeAttendanceSummary,
} from "@/database/employee/attendance.type";
import type { Employee } from "@/database/employee/employee.type";
import { employeeShiftGroups } from "@/database/employee/employee";
import {
	buildCalendarMonthDays,
	formatDateKey,
	getKoreaDateKey,
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

function isWithinEmploymentDates(employee: Employee, dateKey: string) {
	if (employee.employmentPeriods && employee.employmentPeriods.length > 0) {
		const currentTerminationDateKey = employee.terminatedAt ? getKoreaDateKey(employee.terminatedAt) : null;

		return employee.employmentPeriods.some(
			period => {
				const effectiveEndDate = period.endedOn ?? currentTerminationDateKey;

				return period.startedOn <= dateKey && (!effectiveEndDate || dateKey <= effectiveEndDate);
			},
		);
	}

	const terminatedDateKey = employee.terminatedAt ? getKoreaDateKey(employee.terminatedAt) : null;

	return employee.joinedAt <= dateKey && (!terminatedDateKey || dateKey <= terminatedDateKey);
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
		isVacantSlot: false,
		shiftGroup: record?.shiftGroup ?? employee.shiftGroup,
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
		substituteCheckedInAt: record?.substituteCheckedInAt,
		substituteConfirmedWorkMinutes: record?.substituteConfirmedWorkMinutes,
		substituteHourlyWageSnapshot: record?.substituteHourlyWageSnapshot,
		temporaryWorkerId: record?.temporaryWorkerId,
		temporaryWorkerName: record?.temporaryWorkerName,
		temporaryWorkerPhone: record?.temporaryWorkerPhone,
		updatedByEmployeeId: record?.updatedByEmployeeId ?? employee.id,
		updatedAt: record?.updatedAt ?? `${workDate}T00:00:00.000Z`,
	};
}

function createVacantScheduleEntry(
	record: AttendanceRecord,
	substituteEmployee?: Employee,
): AttendanceScheduleEntry | null {
	if (!record.shiftGroup) {
		return null;
	}

	const scheduledMinutes = record.scheduledStart && record.scheduledEnd
		? getTimeDurationMinutes(record.scheduledStart, record.scheduledEnd)
		: 0;

	return {
		...record,
		employeeId: "",
		employeeName: "비어있음",
		isVacantSlot: true,
		scheduledMinutes,
		shiftGroup: record.shiftGroup,
		substituteEmployeeName: substituteEmployee?.name,
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
	const recordBySchedule = new Map(
		records
			.filter(record => !record.isVacantSlot && Boolean(record.employeeId))
			.map(record => [createScheduleKey(record.employeeId, record.workDate), record]),
	);
	const requestedDateKeys = new Set(dateKeys);
	const scheduleByKey = new Map<string, AttendanceScheduleEntry>();

	for (const dateKey of requestedDateKeys) {
		const weekday = getWeekday(dateKey);

		for (const employee of staff) {
			if (!isWithinEmploymentDates(employee, dateKey) || !employee.workDays.includes(weekday)) {
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

		if (record.isVacantSlot) {
			const substituteEmployee = record.substituteEmployeeId
				? employeeById.get(record.substituteEmployeeId)
				: undefined;
			const vacantEntry = createVacantScheduleEntry(record, substituteEmployee);

			if (vacantEntry) {
				scheduleByKey.set(`vacant:${record.workDate}:${vacantEntry.shiftGroup}`, vacantEntry);
			}

			continue;
		}

		const key = createScheduleKey(record.employeeId, record.workDate);

		if (scheduleByKey.has(key)) {
			continue;
		}

		const employee = employeeById.get(record.employeeId);

		if (employee && !isWithinEmploymentDates(employee, record.workDate)) {
			continue;
		}

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
			employeeShiftGroups.indexOf(left.shiftGroup) - employeeShiftGroups.indexOf(right.shiftGroup) ||
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
	const regularEntries = entries.filter(entry => !entry.isVacantSlot);
	const elapsedEntries = regularEntries.filter(entry => entry.workDate <= todayKey);
	const completedRegularEntries = elapsedEntries.filter(entry => entry.status === "completed");
	const completedVacantEntries = entries.filter(
		entry => entry.isVacantSlot && entry.status === "completed" && Boolean(entry.substituteEmployeeId || entry.temporaryWorkerId),
	);
	const completedEntries = [...completedRegularEntries, ...completedVacantEntries];
	const missedEntries = elapsedEntries.filter(entry => entry.status === "missed");
	const substituteEntries = entries.filter(
		entry => entry.status === "completed" && Boolean(entry.substituteEmployeeId || entry.temporaryWorkerId),
	);

	return {
		scheduledShiftCount: regularEntries.length,
		elapsedShiftCount: elapsedEntries.length,
		completedShiftCount: completedEntries.length,
		missedShiftCount: missedEntries.length,
		contractedMinutes: regularEntries.reduce((total, entry) => total + entry.scheduledMinutes, 0),
		completedMinutes: completedEntries.reduce(
			(total, entry) =>
				total +
				(entry.substituteEmployeeId || entry.temporaryWorkerId
					? entry.substituteConfirmedWorkMinutes ?? entry.scheduledMinutes
					: entry.confirmedWorkMinutes ?? entry.scheduledMinutes),
			0,
		),
		missedMinutes: missedEntries.reduce((total, entry) => total + entry.scheduledMinutes, 0),
		attendanceRate: elapsedEntries.length === 0 ? 0 : completedRegularEntries.length / elapsedEntries.length,
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
	return isWithinEmploymentDates(employee, dateKey) && employee.workDays.includes(getWeekday(dateKey));
}
