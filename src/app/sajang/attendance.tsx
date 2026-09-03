import { type Href, useRouter } from "expo-router";

import { AttendancePage } from "@/components/features/employee/attendance/attendance-page";

export default function SajangAttendanceScreen() {
	const router = useRouter();

	return (
		<AttendancePage
			activeDrawerId="owner-space"
			leadingMode="back"
			onPressBack={() => router.replace("/sajang/home" as Href)}
			showOwnerMonthlySummary
			showOwnerPayroll
			title="근무근태"
		/>
	);
}
