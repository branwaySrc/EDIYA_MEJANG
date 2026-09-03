import { useMemo } from "react";

import { toEmployee } from "@/database/employee/employee";
import { useEmployeeManagementStore } from "@/store/employee-management-store";

export function useAttendanceEmployees() {
	const records = useEmployeeManagementStore(state => state.records);
	const employmentPeriods = useEmployeeManagementStore(state => state.employmentPeriods);

	return useMemo(
		() => {
			const periodsByEmployeeId = new Map<string, typeof employmentPeriods>();

			for (const period of employmentPeriods) {
				const periods = periodsByEmployeeId.get(period.employee_id) ?? [];
				periods.push(period);
				periodsByEmployeeId.set(period.employee_id, periods);
			}

			return records
				.filter(record => !record.is_owner)
				.map(record => ({
					...toEmployee(record),
					employmentPeriods: (periodsByEmployeeId.get(record.id) ?? []).map(period => ({
						endedOn: period.ended_on,
						id: period.id,
						startedOn: period.started_on,
					})),
				}));
		},
		[employmentPeriods, records],
	);
}
