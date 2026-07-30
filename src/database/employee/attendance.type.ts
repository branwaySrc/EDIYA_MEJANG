import type { EmployeeShiftGroup } from "@/database/employee/employee.type";

export type AttendanceStatus = "scheduled" | "completed" | "missed";
export type AttendanceMonthStatus = "open" | "closed";

export type AttendanceLogAction =
	| "clock_in"
	| "update"
	| "confirm"
	| "attendance_register"
	| "attendance_cancel"
	| "substitute_register"
	| "substitute_cancel";

export type AttendanceRecord = {
	checkedInAt?: string;
	checkedOutAt?: string;
	confirmedWorkMinutes?: number;
	employeeId: string;
	id: string;
	scheduledEnd: string;
	scheduledStart: string;
	status: AttendanceStatus;
	substituteCheckedInAt?: string;
	substituteConfirmedWorkMinutes?: number;
	substituteEmployeeId?: string;
	updatedAt: string;
	updatedByEmployeeId: string;
	workDate: string;
};

export type AttendanceRecordRow = {
	checked_in_at: string | null;
	checked_out_at: string | null;
	confirmed_work_minutes: number | null;
	employee_id: string;
	id: string;
	scheduled_end: string;
	scheduled_start: string;
	status: AttendanceStatus;
	substitute_checked_in_at: string | null;
	substitute_confirmed_work_minutes: number | null;
	substitute_employee_id: string | null;
	updated_at: string;
	updated_by_employee_id: string;
	work_date: string;
};

export type AttendanceMonthCoverage = {
	closedAt?: string;
	monthKey: string;
	status: AttendanceMonthStatus;
};

export type AttendanceMonthCoverageRow = {
	closed_at: string | null;
	month_key: string;
	status: AttendanceMonthStatus;
};

export type AttendanceMonthArchive = {
	coverage: AttendanceMonthCoverage;
	records: AttendanceRecord[];
};

export type AttendanceLogRecord = {
	action: AttendanceLogAction;
	attendanceId: string;
	createdAt: string;
	employeeId: string;
	id: string;
	message: string;
	updatedByEmployeeId: string;
};

export type AttendanceLogRow = {
	action: AttendanceLogAction;
	attendance_id: string;
	created_at: string;
	employee_id: string;
	id: string;
	message: string;
	updated_by_employee_id: string;
};

export type AttendanceScheduleEntry = AttendanceRecord & {
	employeeName: string;
	kakaoName: string;
	scheduledMinutes: number;
	shiftGroup: EmployeeShiftGroup;
	substituteEmployeeName?: string;
	substituteKakaoName?: string;
};

export type EmployeeAttendanceSummary = {
	attendanceRate: number;
	completedDates: string[];
	completedMinutes: number;
	completedShiftCount: number;
	contractedMinutes: number;
	elapsedShiftCount: number;
	employeeId: string;
	employeeName: string;
	missedDates: string[];
	missedMinutes: number;
	scheduledShiftCount: number;
	shiftGroup: EmployeeShiftGroup;
	substituteDates: string[];
	substituteMinutes: number;
	substituteShiftCount: number;
};

export type AttendanceMonthSummary = {
	attendanceRate: number;
	completedMinutes: number;
	completedShiftCount: number;
	contractedMinutes: number;
	elapsedShiftCount: number;
	employeeSummaries: EmployeeAttendanceSummary[];
	missedMinutes: number;
	missedShiftCount: number;
	scheduledShiftCount: number;
	substituteMinutes: number;
	substituteShiftCount: number;
};
