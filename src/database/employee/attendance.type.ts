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
	isVacantSlot?: boolean;
	scheduledEnd: string;
	scheduledStart: string;
	shiftGroup?: EmployeeShiftGroup;
	status: AttendanceStatus;
	substituteCheckedInAt?: string;
	substituteConfirmedWorkMinutes?: number;
	substituteEmployeeId?: string;
	substituteHourlyWageSnapshot?: number;
	temporaryWorkerId?: string;
	temporaryWorkerName?: string;
	temporaryWorkerPhone?: string;
	updatedAt: string;
	updatedByEmployeeId: string;
	updatedByTemporaryWorkerId?: string;
	workDate: string;
};

export type AttendanceRecordRow = {
	checked_in_at: string | null;
	checked_out_at: string | null;
	confirmed_work_minutes: number | null;
	employee_id: string | null;
	id: string;
	is_vacant_slot: boolean;
	scheduled_end: string | null;
	scheduled_start: string | null;
	shift_group: EmployeeShiftGroup;
	status: AttendanceStatus;
	store_id: string;
	substitute_checked_in_at: string | null;
	substitute_confirmed_work_minutes: number | null;
	substitute_employee_id: string | null;
	substitute_hourly_wage_snapshot: number | null;
	temporary_worker_id: string | null;
	updated_at: string;
	updated_by_employee_id: string | null;
	updated_by_temporary_worker_id: string | null;
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
	store_id: string;
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
	substituteConfirmedWorkMinutesSnapshot?: number;
	substituteHourlyWageSnapshot?: number;
	temporaryWorkerId?: string;
	temporaryWorkerName?: string;
	temporaryWorkerPhone?: string;
	updatedByEmployeeId: string;
	updatedByTemporaryWorkerId?: string;
};

export type AttendanceLogRow = {
	action: AttendanceLogAction;
	attendance_id: string;
	created_at: string;
	employee_id: string | null;
	id: string;
	message: string;
	store_id: string;
	substitute_confirmed_work_minutes_snapshot: number | null;
	substitute_hourly_wage_snapshot: number | null;
	temporary_worker_id: string | null;
	updated_by_employee_id: string | null;
	updated_by_temporary_worker_id: string | null;
};

export type AttendanceTemporaryWorker = {
	createdAt: string;
	id: string;
	name: string;
	phone: string;
	updatedAt: string;
};

export type AttendanceTemporaryWorkerRow = {
	created_at: string;
	id: string;
	name: string;
	phone: string;
	store_id: string;
	updated_at: string;
};

export type AttendanceScheduleEntry = AttendanceRecord & {
	employeeName: string;
	isVacantSlot: boolean;
	scheduledMinutes: number;
	shiftGroup: EmployeeShiftGroup;
	substituteEmployeeName?: string;
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
