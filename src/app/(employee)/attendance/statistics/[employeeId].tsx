import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo } from "react";

import { EmployeeAttendanceStatisticsView } from "@/components/features/employee/attendance/statistics/employee-attendance-statistics-view";
import { useKoreaToday } from "@/components/features/employee/attendance/use-korea-today";
import { AppLayout } from "@/components/global/app-layout";
import {
	formatCalendarMonthKey,
	getCalendarMonth,
	parseCalendarMonthKey,
} from "@/lib/korea-date";

function getRouteParam(value: string | string[] | undefined) {
	return Array.isArray(value) ? value[0] : value;
}

export default function EmployeeAttendanceStatisticsScreen() {
	const router = useRouter();
	const { employeeId, month } = useLocalSearchParams<{
		employeeId?: string | string[];
		month?: string | string[];
	}>();
	const todayKey = useKoreaToday();
	const currentMonthKey = useMemo(
		() => formatCalendarMonthKey(getCalendarMonth(todayKey)),
		[todayKey],
	);
	const employeeIdParam = getRouteParam(employeeId) ?? "";
	const monthParam = getRouteParam(month);
	const selectedMonthKey =
		monthParam && parseCalendarMonthKey(monthParam) && monthParam <= currentMonthKey
			? monthParam
			: currentMonthKey;

	return (
		<AppLayout
			activeDrawerId="attendance"
			drawerEnabled={false}
			leadingMode="back"
			onPressBack={() => {
				if (router.canGoBack()) {
					router.back();
					return;
				}

				router.replace("/attendance");
			}}
			title="직원별 출근 현황"
			type="view"
		>
			<EmployeeAttendanceStatisticsView
				employeeId={employeeIdParam}
				monthKey={selectedMonthKey}
				onChangeMonth={nextMonthKey => router.setParams({ month: nextMonthKey })}
			/>
		</AppLayout>
	);
}
