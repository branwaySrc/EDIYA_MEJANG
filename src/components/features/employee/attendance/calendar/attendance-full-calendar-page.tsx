import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { AttendanceDayPopup } from "@/components/features/employee/attendance/calendar/attendance-day-popup";
import { AttendanceGreetingOverlay } from "@/components/features/employee/attendance/calendar/attendance-greeting-overlay";
import { AttendanceMonthCalendar } from "@/components/features/employee/attendance/calendar/attendance-month-calendar";
import { useAttendanceEmployees } from "@/components/features/employee/attendance/use-attendance-employees";
import { useKoreaToday } from "@/components/features/employee/attendance/use-korea-today";
import { AppLayout } from "@/components/global/app-layout";
import { AppColors, AppSpacing } from "@/constants/theme";
import type { AttendanceFeedbackPayload } from "@/lib/attendance-greeting";
import { buildAttendanceSchedule, groupAttendanceByDate } from "@/lib/attendance-schedule";
import { addCalendarMonths, getCalendarMonth } from "@/lib/korea-date";
import { useAttendanceStore } from "@/store/attendance-store";

function getInitialDateKey(date: string | string[] | undefined, fallbackDateKey: string) {
	const value = Array.isArray(date) ? date[0] : date;
	return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : fallbackDateKey;
}

export function AttendanceFullCalendarPage() {
	const router = useRouter();
	const employees = useAttendanceEmployees();
	const { date } = useLocalSearchParams<{ date?: string | string[] }>();
	const todayKey = useKoreaToday();
	const initialDateKey = getInitialDateKey(date, todayKey);
	const [visibleMonth, setVisibleMonth] = useState(() => getCalendarMonth(initialDateKey));
	const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
	const [feedback, setFeedback] = useState<AttendanceFeedbackPayload | null>(null);
	const attendanceRecords = useAttendanceStore(state => state.records);
	const visibleSchedule = useMemo(
		() =>
			buildAttendanceSchedule({
				...visibleMonth,
				employees,
				records: attendanceRecords,
				todayKey,
			}),
		[attendanceRecords, employees, todayKey, visibleMonth],
	);
	const entriesByDate = useMemo(() => groupAttendanceByDate(visibleSchedule), [visibleSchedule]);
	const selectedEntries = selectedDateKey ? entriesByDate.get(selectedDateKey) ?? [] : [];

	const handleChangeMonth = useCallback((amount: number) => {
		setVisibleMonth(current => addCalendarMonths(current, amount));
		setSelectedDateKey(null);
	}, []);

	const handlePressToday = useCallback(() => {
		setVisibleMonth(getCalendarMonth(todayKey));
		setSelectedDateKey(null);
	}, [todayKey]);

	return (
		<>
			<AppLayout
				drawerEnabled={false}
				onPressBack={() => router.back()}
				title="달력 전체 보기"
				type="view"
			>
				<ScrollView
					contentContainerStyle={styles.scrollContent}
					showsVerticalScrollIndicator={false}
					style={styles.container}
				>
					<View style={styles.content}>
						<AttendanceMonthCalendar
							entriesByDate={entriesByDate}
							month={visibleMonth}
							onChangeMonth={handleChangeMonth}
							onPressDate={setSelectedDateKey}
							onPressToday={handlePressToday}
							todayKey={todayKey}
						/>
					</View>
				</ScrollView>
			</AppLayout>
			{selectedDateKey && (
				<AttendanceDayPopup
					dateKey={selectedDateKey}
					entries={selectedEntries}
					monthEntries={visibleSchedule}
					onClose={() => setSelectedDateKey(null)}
					onFeedback={setFeedback}
					todayKey={todayKey}
				/>
			)}
			{feedback && (
				<AttendanceGreetingOverlay onClose={() => setFeedback(null)} payload={feedback} />
			)}
		</>
	);
}

export default AttendanceFullCalendarPage;

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#F1F5F9",
	},
	scrollContent: {
		flexGrow: 1,
		alignItems: "center",
		paddingBottom: AppSpacing.xl,
	},
	content: {
		width: "100%",
		maxWidth: 1120,
		backgroundColor: AppColors.background,
	},
});
