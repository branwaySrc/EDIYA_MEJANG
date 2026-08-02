import type { HiringContractResult, HiringDraft } from "@/components/features/sajang/hiring/hiring-types";
import type { EmployeeRecord } from "@/database/employee/employee.type";

export function createEmployeeRecordFromHiringDraft(draft: HiringDraft, result: HiringContractResult): EmployeeRecord {
	const now = new Date().toISOString();

	return {
		address: draft.address.trim() || null,
		bank_account_number: null,
		bank_name: null,
		birth_date: draft.birthDate.trim() || null,
		created_at: now,
		email: draft.employeeEmail.trim() || null,
		hourly_wage: Number(draft.hourlyWage.replace(/\D/g, "")) || null,
		id: result.employeeId,
		is_owner: false,
		joined_at: draft.startDate.trim() || now.slice(0, 10),
		name: draft.employeeName.trim(),
		phone: draft.phone.trim(),
		phone_public: draft.phonePublic,
		shift_group: draft.shiftGroup,
		updated_at: now,
		work_days: [...draft.workDays],
		work_end_minutes: draft.workEndMinutes ?? 0,
		workplace_id: draft.selectedWorkplaceId,
		workplace_name: draft.storeName.trim() || null,
		work_start_minutes: draft.workStartMinutes ?? 0,
	};
}
