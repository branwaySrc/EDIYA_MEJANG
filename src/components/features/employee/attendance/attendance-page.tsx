import { useState } from "react";

import { AttendanceRefreshStatus } from "@/components/features/employee/attendance/attendance-refresh-status";
import { AttendanceCalendarView } from "@/components/features/employee/attendance/calendar/attendance-calendar-view";
import { AttendanceLogView } from "@/components/features/employee/attendance/logs/attendance-log-view";
import { AttendanceStatisticsView } from "@/components/features/employee/attendance/statistics/attendance-statistics-view";
import { AttendanceTabMenu, type AttendanceTabId } from "@/components/features/employee/attendance/attendance-tab-menu";
import { AppLayout, type AppLayoutProps } from "@/components/global/app-layout";
import type { DrawerMenuId } from "@/constants/route";
import { appRoutes } from "@/constants/route";

export type AttendancePageProps = {
	activeDrawerId?: DrawerMenuId;
	leadingMode?: AppLayoutProps["leadingMode"];
	onPressBack?: AppLayoutProps["onPressBack"];
	showOwnerMonthlySummary?: boolean;
	showOwnerPayroll?: boolean;
	showRefreshStatus?: boolean;
	title?: string;
};

export function AttendancePage({
	activeDrawerId = "attendance",
	leadingMode = "drawer",
	onPressBack,
	showOwnerMonthlySummary = false,
	showOwnerPayroll = false,
	showRefreshStatus = false,
	title = appRoutes.attendance.label,
}: AttendancePageProps = {}) {
	const [activeTabId, setActiveTabId] = useState<AttendanceTabId>("calendar");

	let activeContent;

	switch (activeTabId) {
		case "logs":
			activeContent = <AttendanceLogView />;
			break;
		case "statistics":
			activeContent = (
				<AttendanceStatisticsView
					showOwnerMonthlySummary={showOwnerMonthlySummary}
					showOwnerPayroll={showOwnerPayroll}
				/>
			);
			break;
		case "calendar":
		default:
			activeContent = <AttendanceCalendarView showOwnerMonthlySummary={showOwnerMonthlySummary} />;
	}

	return (
		<AppLayout
			activeDrawerId={activeDrawerId}
			aside={showRefreshStatus ? <AttendanceRefreshStatus /> : undefined}
			leadingMode={leadingMode}
			onPressBack={onPressBack}
			title={title}
			topSlot={<AttendanceTabMenu activeId={activeTabId} onChange={setActiveTabId} />}
			type="view"
		>
			{activeContent}
		</AppLayout>
	);
}

export default AttendancePage;
