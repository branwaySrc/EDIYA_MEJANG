import { useMemo } from "react";

import { toEmployee } from "@/database/employee/employee";
import { useEmployeeManagementStore } from "@/store/employee-management-store";

export function useAttendanceEmployees() {
	const records = useEmployeeManagementStore(state => state.records);

	return useMemo(
		() => records.filter(record => !record.is_owner).map(toEmployee),
		[records],
	);
}
