export type EmployeeShiftGroup = "마감" | "미들" | "오픈";

export type EmployeeWeekday = "금" | "목" | "수" | "월" | "일" | "토" | "화";

export type EmployeeDocumentType = "bankbook_copy" | "contract" | "health_certificate" | "id_card_copy" | "other";

export type Employee = {
	address: string;
	bankAccountNumber: string;
	bankName: string;
	birthDate: string;
	createdAt: string;
	email: string;
	hourlyWage: number | null;
	id: string;
	joinedAt: string;
	kakaoName: string;
	name: string;
	owner?: boolean;
	phone: string;
	phonePublic: boolean;
	shiftGroup: EmployeeShiftGroup;
	updatedAt: string;
	workEndMinutes: number;
	workDays: EmployeeWeekday[];
	workplaceId: string | null;
	workplaceName: string;
	workStartMinutes: number;
	workTime: string;
};

export type EmployeeSection = {
	employees: Employee[];
	title: EmployeeShiftGroup;
};

export type EmployeeRecord = {
	address: string | null;
	bank_account_number: string | null;
	bank_name: string | null;
	birth_date: string | null;
	created_at: string;
	email: string | null;
	hourly_wage: number | null;
	id: string;
	is_owner: boolean;
	joined_at: string;
	name: string;
	phone: string;
	phone_public: boolean;
	shift_group: EmployeeShiftGroup;
	updated_at: string;
	work_end_minutes: number;
	work_days: EmployeeWeekday[];
	workplace_id: string | null;
	workplace_name: string | null;
	work_start_minutes: number;
};

export type EmployeeDocumentRecord = {
	created_at: string;
	document_type: EmployeeDocumentType;
	employee_id: string;
	file_name: string;
	file_size: number | null;
	id: string;
	local_uri: string;
	mime_type: string | null;
	storage_bucket: string | null;
	storage_path: string | null;
	updated_at: string;
	uploaded_at: string;
};

export const employeeTable = {
	address: "address",
	bankAccountNumber: "bank_account_number",
	bankName: "bank_name",
	birthDate: "birth_date",
	createdAt: "created_at",
	email: "email",
	hourlyWage: "hourly_wage",
	id: "id",
	name: "name",
	phone: "phone",
	phonePublic: "phone_public",
	shiftGroup: "shift_group",
	updatedAt: "updated_at",
	workDays: "work_days",
	workEndMinutes: "work_end_minutes",
	workplaceId: "workplace_id",
	workplaceName: "workplace_name",
	workStartMinutes: "work_start_minutes",
	joinedAt: "joined_at",
	owner: "is_owner",
} as const;

export const employeeDocumentTable = {
	createdAt: "created_at",
	documentType: "document_type",
	employeeId: "employee_id",
	fileName: "file_name",
	fileSize: "file_size",
	id: "id",
	localUri: "local_uri",
	mimeType: "mime_type",
	storageBucket: "storage_bucket",
	storagePath: "storage_path",
	updatedAt: "updated_at",
	uploadedAt: "uploaded_at",
} as const;
