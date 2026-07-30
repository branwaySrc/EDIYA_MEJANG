export type EmployeeShiftGroup = "오픈" | "미들" | "마감";

export type EmployeeWeekday = "월" | "화" | "수" | "목" | "금" | "토" | "일";

export type Employee = {
	id: string;
	name: string;
	kakaoName: string;
	shiftGroup: EmployeeShiftGroup;
	workDays: EmployeeWeekday[];
	workTime: string;
	joinedAt: string;
	owner?: boolean;
};

export type EmployeeSection = {
	title: EmployeeShiftGroup;
	employees: Employee[];
};

export type EmployeeRecord = {
	id: string;
	name: string;
	kakao_name: string;
	shift_group: EmployeeShiftGroup;
	work_days: EmployeeWeekday[];
	work_time: string;
	joined_at: string;
	is_owner: boolean;
};

export const employeeTable = {
	id: "id",
	name: "name",
	kakaoName: "kakao_name",
	shiftGroup: "shift_group",
	workDays: "work_days",
	workTime: "work_time",
	joinedAt: "joined_at",
	owner: "is_owner",
} as const;
