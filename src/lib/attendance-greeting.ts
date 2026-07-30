import type { AttendanceScheduleEntry } from "@/database/employee/attendance.type";
import { parseDateKey } from "@/lib/korea-date";

export type AttendanceGreetingPayload =
	| {
			employeeName: string;
			kind: "attendance";
			month: number;
			ordinal: number;
			totalScheduledShiftCount: number;
	  }
	| {
			employeeName: string;
			kind: "substitute";
			month: number;
			ordinal: number;
	  };

export type AttendanceFeedbackPayload =
	| AttendanceGreetingPayload
	| {
			employeeName: string;
			kind: "future-blocked";
	  };

type BuildAttendanceGreetingOptions = {
	entry: AttendanceScheduleEntry;
	monthEntries: AttendanceScheduleEntry[];
	substituteEmployee?: {
		id: string;
		name: string;
	};
};

function compareScheduleEntry(left: AttendanceScheduleEntry, right: AttendanceScheduleEntry) {
	return (
		left.workDate.localeCompare(right.workDate) ||
		left.scheduledStart.localeCompare(right.scheduledStart) ||
		left.id.localeCompare(right.id)
	);
}

export function buildAttendanceGreeting({
	entry,
	monthEntries,
	substituteEmployee,
}: BuildAttendanceGreetingOptions): AttendanceGreetingPayload {
	const { month, year } = parseDateKey(entry.workDate);
	const monthPrefix = `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-`;
	const currentMonthEntries = monthEntries.filter(monthEntry =>
		monthEntry.workDate.startsWith(monthPrefix),
	);

	if (substituteEmployee) {
		const completedSubstituteEntries = currentMonthEntries
			.filter(
				monthEntry =>
					monthEntry.status === "completed" &&
					monthEntry.substituteEmployeeId === substituteEmployee.id,
			)
			.sort(compareScheduleEntry);
		const existingEntryIndex = completedSubstituteEntries.findIndex(
			monthEntry => monthEntry.id === entry.id,
		);

		return {
			employeeName: substituteEmployee.name,
			kind: "substitute",
			month,
			ordinal:
				existingEntryIndex >= 0 ? existingEntryIndex + 1 : completedSubstituteEntries.length + 1,
		};
	}

	const employeeEntries = currentMonthEntries
		.filter(monthEntry => monthEntry.employeeId === entry.employeeId)
		.sort(compareScheduleEntry);
	const entryIndex = employeeEntries.findIndex(monthEntry => monthEntry.id === entry.id);
	const precedingEntryCount = employeeEntries.filter(
		monthEntry => compareScheduleEntry(monthEntry, entry) <= 0,
	).length;

	return {
		employeeName: entry.employeeName,
		kind: "attendance",
		month,
		ordinal: entryIndex >= 0 ? entryIndex + 1 : Math.max(precedingEntryCount, 1),
		totalScheduledShiftCount: employeeEntries.length,
	};
}
