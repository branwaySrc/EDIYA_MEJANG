import { useState } from "react";

import { AttendanceCalendarView } from "@/components/features/employee/attendance/calendar/attendance-calendar-view";
import { AttendanceLogView } from "@/components/features/employee/attendance/logs/attendance-log-view";
import { AttendanceStatisticsView } from "@/components/features/employee/attendance/statistics/attendance-statistics-view";
import { AttendanceTabMenu, type AttendanceTabId } from "@/components/features/employee/attendance/attendance-tab-menu";
import { AppLayout } from "@/components/global/app-layout";
import { appRoutes } from "@/constants/route";

export function AttendancePage() {
	const [activeTabId, setActiveTabId] = useState<AttendanceTabId>("calendar");

	let activeContent;

	switch (activeTabId) {
		case "logs":
			activeContent = <AttendanceLogView />;
			break;
		case "statistics":
			activeContent = <AttendanceStatisticsView />;
			break;
		case "calendar":
		default:
			activeContent = <AttendanceCalendarView />;
	}

	return (
		<AppLayout
			activeDrawerId="attendance"
			title={appRoutes.attendance.label}
			topSlot={<AttendanceTabMenu activeId={activeTabId} onChange={setActiveTabId} />}
			type="view"
		>
			{activeContent}
		</AppLayout>
	);
}

export default AttendancePage;
