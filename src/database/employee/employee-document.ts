import type { EmployeeDocumentType } from "@/database/employee/employee.type";

export const employeeDocumentTypes: EmployeeDocumentType[] = [
	"health_certificate",
	"bankbook_copy",
	"id_card_copy",
	"contract",
	"other",
];

export const employeeDocumentLabels: Record<EmployeeDocumentType, string> = {
	bankbook_copy: "통장사본",
	contract: "근로계약서",
	health_certificate: "보건증",
	id_card_copy: "신분증사본",
	other: "기타 서류",
};
