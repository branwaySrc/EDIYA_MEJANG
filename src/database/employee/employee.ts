import type { Employee, EmployeeRecord, EmployeeSection, EmployeeShiftGroup } from "@/database/employee/employee.type";

export type EmployeeDirectory = {
	owner: Employee;
	sections: EmployeeSection[];
};

export const employeeShiftGroups: EmployeeShiftGroup[] = ["오픈", "미들", "마감"];

export const sampleOwner: Employee = {
	id: "owner-001",
	name: "사장",
	kakaoName: "월피동점 사장",
	shiftGroup: "오픈",
	workDays: ["월", "화", "수", "목", "금", "토", "일"],
	workTime: "24/7",
	joinedAt: "2024-01-01",
	owner: true,
};

export const sampleEmployees: Employee[] = [
	{
		id: "open-001",
		name: "윤하나",
		kakaoName: "하나",
		shiftGroup: "오픈",
		workDays: ["월", "수", "금"],
		workTime: "07:00 - 12:00",
		joinedAt: "2026-07-02",
	},
	{
		id: "open-002",
		name: "민서준",
		kakaoName: "서준",
		shiftGroup: "오픈",
		workDays: ["화", "목"],
		workTime: "08:00 - 13:00",
		joinedAt: "2026-05-20",
	},
	{
		id: "open-003",
		name: "고다은",
		kakaoName: "다은",
		shiftGroup: "오픈",
		workDays: ["월", "화", "수"],
		workTime: "09:00 - 14:00",
		joinedAt: "2026-03-20",
	},
	{
		id: "open-004",
		name: "한지호",
		kakaoName: "지호",
		shiftGroup: "오픈",
		workDays: ["목", "금", "토"],
		workTime: "07:00 - 15:00",
		joinedAt: "2025-11-10",
	},
	{
		id: "middle-001",
		name: "백유진",
		kakaoName: "유진",
		shiftGroup: "미들",
		workDays: ["월", "목"],
		workTime: "12:00 - 17:00",
		joinedAt: "2026-07-04",
	},
	{
		id: "middle-002",
		name: "이도현",
		kakaoName: "도현",
		shiftGroup: "미들",
		workDays: ["화", "금"],
		workTime: "13:00 - 18:00",
		joinedAt: "2026-05-15",
	},
	{
		id: "middle-003",
		name: "정아린",
		kakaoName: "아린",
		shiftGroup: "미들",
		workDays: ["수", "토"],
		workTime: "14:00 - 19:00",
		joinedAt: "2026-03-12",
	},
	{
		id: "middle-004",
		name: "최현우",
		kakaoName: "현우",
		shiftGroup: "미들",
		workDays: ["월", "수", "일"],
		workTime: "12:00 - 20:00",
		joinedAt: "2025-10-25",
	},
	{
		id: "close-001",
		name: "서지안",
		kakaoName: "지안",
		shiftGroup: "마감",
		workDays: ["월", "금"],
		workTime: "17:00 - 22:00",
		joinedAt: "2026-07-06",
	},
	{
		id: "close-002",
		name: "문태오",
		kakaoName: "태오",
		shiftGroup: "마감",
		workDays: ["화", "목", "토"],
		workTime: "18:00 - 23:00",
		joinedAt: "2026-05-08",
	},
	{
		id: "close-003",
		name: "오나래",
		kakaoName: "나래",
		shiftGroup: "마감",
		workDays: ["수", "금", "일"],
		workTime: "19:00 - 24:00",
		joinedAt: "2026-02-18",
	},
	{
		id: "close-004",
		name: "강하준",
		kakaoName: "하준",
		shiftGroup: "마감",
		workDays: ["토", "일"],
		workTime: "17:00 - 24:00",
		joinedAt: "2025-08-21",
	},
];

export function toEmployee(record: EmployeeRecord): Employee {
	return {
		id: record.id,
		name: record.name,
		kakaoName: record.kakao_name,
		shiftGroup: record.shift_group,
		workDays: [...record.work_days],
		workTime: record.work_time,
		joinedAt: record.joined_at,
		owner: record.is_owner,
	};
}

export function toEmployeeRecord(employee: Employee): EmployeeRecord {
	return {
		id: employee.id,
		name: employee.name,
		kakao_name: employee.kakaoName,
		shift_group: employee.shiftGroup,
		work_days: [...employee.workDays],
		work_time: employee.workTime,
		joined_at: employee.joinedAt,
		is_owner: employee.owner ?? false,
	};
}

export function buildEmployeeSections(employees: Employee[]): EmployeeSection[] {
	return employeeShiftGroups.map(title => ({
		title,
		employees: employees.filter(employee => employee.shiftGroup === title),
	}));
}

export const sampleEmployeeRecords: EmployeeRecord[] = [sampleOwner, ...sampleEmployees].map(toEmployeeRecord);

export function buildEmployeeDirectory(records: EmployeeRecord[] = sampleEmployeeRecords): EmployeeDirectory {
	const employees = records.map(toEmployee);
	const owner = employees.find(employee => employee.owner) ?? toEmployee(toEmployeeRecord(sampleOwner));
	const staff = employees.filter(employee => !employee.owner);

	return {
		owner,
		sections: buildEmployeeSections(staff),
	};
}

export function getEmployeeDirectorySnapshot(): EmployeeDirectory {
	return buildEmployeeDirectory(sampleEmployeeRecords);
}

export async function fetchEmployeeDirectory(): Promise<EmployeeDirectory> {
	return getEmployeeDirectorySnapshot();
}

export const sampleEmployeeSections: EmployeeSection[] = buildEmployeeSections(sampleEmployees);
