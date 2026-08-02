import type { Employee, EmployeeRecord, EmployeeSection, EmployeeShiftGroup } from "@/database/employee/employee.type";

export type EmployeeDirectory = {
	owner: Employee;
	sections: EmployeeSection[];
};

export const employeeShiftGroups: EmployeeShiftGroup[] = ["오픈", "미들", "마감"];

const sampleCreatedAt = "2026-07-01T00:00:00.000Z";

function createSampleEmployeeRecord(
	record: Pick<
		EmployeeRecord,
		"id" | "joined_at" | "name" | "shift_group" | "work_days" | "work_end_minutes" | "work_start_minutes"
	> &
		Partial<EmployeeRecord>,
): EmployeeRecord {
	return {
		address: null,
		bank_account_number: null,
		bank_name: null,
		birth_date: null,
		created_at: sampleCreatedAt,
		email: null,
		hourly_wage: null,
		is_owner: false,
		phone: "010-0000-0000",
		phone_public: false,
		updated_at: sampleCreatedAt,
		workplace_id: "wolpi",
		workplace_name: "이디야 월피동점",
		...record,
	};
}

export const sampleEmployeeRecords: EmployeeRecord[] = [
	createSampleEmployeeRecord({
		id: "owner-001",
		name: "사장",
		phone: "010-4514-7173",
		phone_public: true,
		shift_group: "오픈",
		work_days: ["월", "화", "수", "목", "금", "토", "일"],
		work_start_minutes: 0,
		work_end_minutes: 1439,
		joined_at: "2024-01-01",
		is_owner: true,
	}),
	createSampleEmployeeRecord({
		id: "open-001",
		name: "김하나",
		shift_group: "오픈",
		work_days: ["월", "수", "금"],
		work_start_minutes: 7 * 60,
		work_end_minutes: 12 * 60,
		joined_at: "2026-07-02",
	}),
	createSampleEmployeeRecord({
		id: "open-002",
		name: "이민서",
		shift_group: "오픈",
		work_days: ["화", "목"],
		work_start_minutes: 8 * 60,
		work_end_minutes: 13 * 60,
		joined_at: "2026-05-20",
	}),
	createSampleEmployeeRecord({
		id: "middle-001",
		name: "박유진",
		shift_group: "미들",
		work_days: ["월", "목"],
		work_start_minutes: 12 * 60,
		work_end_minutes: 17 * 60,
		joined_at: "2026-07-04",
	}),
	createSampleEmployeeRecord({
		id: "middle-002",
		name: "최현우",
		shift_group: "미들",
		work_days: ["화", "금"],
		work_start_minutes: 13 * 60,
		work_end_minutes: 18 * 60,
		joined_at: "2026-05-15",
	}),
	createSampleEmployeeRecord({
		id: "close-001",
		name: "정지윤",
		shift_group: "마감",
		work_days: ["수", "금"],
		work_start_minutes: 17 * 60,
		work_end_minutes: 22 * 60,
		joined_at: "2026-07-06",
	}),
	createSampleEmployeeRecord({
		id: "close-002",
		name: "강하준",
		shift_group: "마감",
		work_days: ["토", "일"],
		work_start_minutes: 18 * 60,
		work_end_minutes: 23 * 60,
		joined_at: "2026-05-08",
	}),
];

const runtimeEmployeeRecords: EmployeeRecord[] = [];

export function formatClockMinutes(totalMinutes: number) {
	const normalizedMinutes = ((totalMinutes % 1440) + 1440) % 1440;
	const hours = Math.floor(normalizedMinutes / 60);
	const minutes = normalizedMinutes % 60;

	return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function formatEmployeeWorkTime(employee: Pick<Employee, "owner" | "workEndMinutes" | "workStartMinutes">) {
	if (employee.owner) {
		return "상시";
	}

	return `${formatClockMinutes(employee.workStartMinutes)} - ${formatClockMinutes(employee.workEndMinutes)}`;
}

export function toEmployee(record: EmployeeRecord): Employee {
	const employeeBase = {
		address: record.address ?? "",
		bankAccountNumber: record.bank_account_number ?? "",
		bankName: record.bank_name ?? "",
		birthDate: record.birth_date ?? "",
		createdAt: record.created_at,
		email: record.email ?? "",
		hourlyWage: record.hourly_wage,
		id: record.id,
		joinedAt: record.joined_at,
		name: record.name,
		owner: record.is_owner,
		phone: record.phone,
		phonePublic: record.phone_public,
		shiftGroup: record.shift_group,
		updatedAt: record.updated_at,
		workDays: [...record.work_days],
		workEndMinutes: record.work_end_minutes,
		workplaceId: record.workplace_id,
		workplaceName: record.workplace_name ?? "",
		workStartMinutes: record.work_start_minutes,
	};

	return {
		...employeeBase,
		kakaoName: employeeBase.phonePublic ? employeeBase.phone : "카카오톡",
		workTime: formatEmployeeWorkTime(employeeBase),
	};
}

export function toEmployeeRecord(employee: Employee): EmployeeRecord {
	return {
		address: employee.address || null,
		bank_account_number: employee.bankAccountNumber || null,
		bank_name: employee.bankName || null,
		birth_date: employee.birthDate || null,
		created_at: employee.createdAt,
		email: employee.email || null,
		hourly_wage: employee.hourlyWage,
		id: employee.id,
		is_owner: employee.owner ?? false,
		joined_at: employee.joinedAt,
		name: employee.name,
		phone: employee.phone,
		phone_public: employee.phonePublic,
		shift_group: employee.shiftGroup,
		updated_at: employee.updatedAt,
		work_days: [...employee.workDays],
		work_end_minutes: employee.workEndMinutes,
		workplace_id: employee.workplaceId,
		workplace_name: employee.workplaceName || null,
		work_start_minutes: employee.workStartMinutes,
	};
}

export function registerEmployeeRecord(record: EmployeeRecord) {
	const existingIndex = runtimeEmployeeRecords.findIndex(item => item.id === record.id);

	if (existingIndex >= 0) {
		runtimeEmployeeRecords[existingIndex] = record;
		return;
	}

	runtimeEmployeeRecords.push(record);
}

export function getEmployeeRecordsSnapshot(): EmployeeRecord[] {
	return [...sampleEmployeeRecords, ...runtimeEmployeeRecords].map(record => ({
		...record,
		work_days: [...record.work_days],
	}));
}

export function buildEmployeeSections(employees: Employee[]): EmployeeSection[] {
	return employeeShiftGroups.map(title => ({
		title,
		employees: employees.filter(employee => employee.shiftGroup === title),
	}));
}

export const sampleOwner = toEmployee(sampleEmployeeRecords[0]);
export const sampleEmployees = sampleEmployeeRecords.slice(1).map(toEmployee);

export function buildEmployeeDirectory(records: EmployeeRecord[] = getEmployeeRecordsSnapshot()): EmployeeDirectory {
	const employees = records.map(toEmployee);
	const owner = employees.find(employee => employee.owner) ?? sampleOwner;
	const staff = employees.filter(employee => !employee.owner);

	return {
		owner,
		sections: buildEmployeeSections(staff),
	};
}

export function getEmployeeDirectorySnapshot(): EmployeeDirectory {
	return buildEmployeeDirectory();
}

export async function fetchEmployeeDirectory(): Promise<EmployeeDirectory> {
	return getEmployeeDirectorySnapshot();
}

export const sampleEmployeeSections: EmployeeSection[] = buildEmployeeSections(sampleEmployees);
