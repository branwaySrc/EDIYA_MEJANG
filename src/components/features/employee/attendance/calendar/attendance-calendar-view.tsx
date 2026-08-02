import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { AttendanceDayPopup } from "@/components/features/employee/attendance/calendar/attendance-day-popup";
import { AttendanceGreetingOverlay } from "@/components/features/employee/attendance/calendar/attendance-greeting-overlay";
import { AttendancePeriodCalendar } from "@/components/features/employee/attendance/calendar/attendance-period-calendar";
import { TodayShiftTimeline } from "@/components/features/employee/attendance/calendar/today-shift-timeline";
import { useAttendanceEmployees } from "@/components/features/employee/attendance/use-attendance-employees";
import { useKoreaToday } from "@/components/features/employee/attendance/use-korea-today";
import { AppColors, AppSpacing } from "@/constants/theme";
import type { AttendanceFeedbackPayload } from "@/lib/attendance-greeting";
import {
	buildAttendanceSchedule,
	buildAttendanceScheduleForDates,
	getTodayAttendanceEntries,
	groupAttendanceByDate,
} from "@/lib/attendance-schedule";
import {
	addCalendarMonths,
	buildCalendarMonthPeriodDays,
	formatDateKey,
	getCalendarMonthPeriod,
	type CalendarMonthPeriod,
} from "@/lib/korea-date";
import { useAttendanceStore } from "@/store/attendance-store";

export function AttendanceCalendarView() {
	const router = useRouter();
	const employees = useAttendanceEmployees();
	const todayKey = useKoreaToday();
	const todayPeriod = useMemo(() => getCalendarMonthPeriod(todayKey), [todayKey]);
	const [manualPeriod, setManualPeriod] = useState<CalendarMonthPeriod | null>(null);
	const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
	const [feedback, setFeedback] = useState<AttendanceFeedbackPayload | null>(null);
	const visiblePeriod = manualPeriod ?? todayPeriod;
	const attendanceRecords = useAttendanceStore(state => state.records);
	const visiblePeriodDays = useMemo(() => buildCalendarMonthPeriodDays(visiblePeriod), [visiblePeriod]);
	const visiblePeriodDateKeys = useMemo(
		() => visiblePeriodDays.map(day => day.dateKey),
		[visiblePeriodDays],
	);
	const visibleSchedule = useMemo(
		() =>
			buildAttendanceScheduleForDates({
				dateKeys: visiblePeriodDateKeys,
				employees,
				records: attendanceRecords,
				todayKey,
			}),
		[attendanceRecords, employees, todayKey, visiblePeriodDateKeys],
	);
	const visibleMonthSchedule = useMemo(
		() =>
			buildAttendanceSchedule({
				year: visiblePeriod.year,
				month: visiblePeriod.month,
				employees,
				records: attendanceRecords,
				todayKey,
			}),
		[attendanceRecords, employees, todayKey, visiblePeriod.month, visiblePeriod.year],
	);
	const todaySchedule = useMemo(
		() =>
			buildAttendanceScheduleForDates({
				dateKeys: [todayKey],
				employees,
				records: attendanceRecords,
				todayKey,
			}),
		[attendanceRecords, employees, todayKey],
	);
	const entriesByDate = useMemo(() => groupAttendanceByDate(visibleSchedule), [visibleSchedule]);
	const todayEntries = useMemo(
		() => getTodayAttendanceEntries(todaySchedule, todayKey),
		[todayKey, todaySchedule],
	);
	const selectedEntries = selectedDateKey ? entriesByDate.get(selectedDateKey) ?? [] : [];

	const handleChangeMonth = useCallback(
		(amount: number) => {
			setManualPeriod(current => ({
				...addCalendarMonths(current ?? todayPeriod, amount),
				periodIndex: 0,
			}));
			setSelectedDateKey(null);
		},
		[todayPeriod],
	);

	const handleChangePeriod = useCallback(
		(periodIndex: number) => {
			setManualPeriod(current => ({
				...(current ?? todayPeriod),
				periodIndex,
			}));
			setSelectedDateKey(null);
		},
		[todayPeriod],
	);

	const handlePressToday = useCallback(() => {
		setManualPeriod(null);
		setSelectedDateKey(null);
	}, []);

	const handlePressFullCalendar = useCallback(() => {
		router.push({
			pathname: "/attendance-calendar",
			params: { date: formatDateKey(visiblePeriod.year, visiblePeriod.month, 1) },
		});
	}, [router, visiblePeriod]);

	return (
		<>
			<ScrollView
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}
				style={styles.container}
			>
				<View style={styles.content}>
					<TodayShiftTimeline entries={todayEntries} todayKey={todayKey} />
					<View style={styles.sectionGap} />
					<AttendancePeriodCalendar
						entriesByDate={entriesByDate}
						onChangeMonth={handleChangeMonth}
						onChangePeriod={handleChangePeriod}
						onPressDate={setSelectedDateKey}
						onPressFullCalendar={handlePressFullCalendar}
						onPressToday={handlePressToday}
						period={visiblePeriod}
						todayKey={todayKey}
					/>
				</View>
			</ScrollView>
			{selectedDateKey && (
				<AttendanceDayPopup
					dateKey={selectedDateKey}
					entries={selectedEntries}
					monthEntries={visibleMonthSchedule}
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

export default AttendanceCalendarView;

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
	sectionGap: {
		width: "100%",
		height: AppSpacing.sm,
		backgroundColor: "#F1F5F9",
	},
});
