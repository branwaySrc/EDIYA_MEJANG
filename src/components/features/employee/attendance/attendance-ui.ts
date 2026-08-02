import type { AttendanceStatus } from "@/database/employee/attendance.type";
import type { EmployeeShiftGroup } from "@/database/employee/employee.type";

export const attendanceStatusLabels: Record<AttendanceStatus, string> = {
	scheduled: "예정",
	completed: "완료",
	missed: "미등록",
};

export const shiftColors: Record<EmployeeShiftGroup, string> = {
	오픈: "#0B69B7",
	미들: "#0F766E",
	마감: "#475569",
};

export function formatMinutesAsHours(minutes: number) {
	const hours = Math.floor(minutes / 60);
	const remainder = minutes % 60;
	return remainder === 0 ? `${hours}시간` : `${hours}시간 ${remainder}분`;
}

export function formatMinutesAsNumericHours(minutes: number) {
	const hours = minutes / 60;
	return Number.isInteger(hours) ? String(hours) : String(Number(hours.toFixed(2)));
}

export function formatAttendanceRate(rate: number) {
	return `${Math.round(rate * 100)}%`;
}
