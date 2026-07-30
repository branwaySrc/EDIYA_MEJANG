import { memo } from "react";
import { StyleSheet, View } from "react-native";

import { AppIcon } from "@/components/base/app-icon";
import { AppPressable } from "@/components/base/app-pressable";
import { AppText } from "@/components/base/app-text";
import {
	AttendanceCalendarGrid,
	AttendanceCalendarLegend,
} from "@/components/features/employee/attendance/calendar/attendance-calendar-grid";
import { AppColors, AppSpacing } from "@/constants/theme";
import type { AttendanceScheduleEntry } from "@/database/employee/attendance.type";
import { buildCalendarMonthDays, formatCalendarMonthTitle, type CalendarMonth } from "@/lib/korea-date";

export type AttendanceMonthCalendarProps = {
	entriesByDate: Map<string, AttendanceScheduleEntry[]>;
	month: CalendarMonth;
	onChangeMonth: (amount: number) => void;
	onPressDate: (dateKey: string) => void;
	onPressToday: () => void;
	todayKey: string;
};

export const AttendanceMonthCalendar = memo(function AttendanceMonthCalendar({
	entriesByDate,
	month,
	onChangeMonth,
	onPressDate,
	onPressToday,
	todayKey,
}: AttendanceMonthCalendarProps) {
	const calendarDays = buildCalendarMonthDays(month);

	return (
		<View style={styles.section}>
			<View style={styles.toolbar}>
				<View style={styles.monthControls}>
					<AppIcon.Base
						accessibilityLabel="이전 달"
						buttonStyle={styles.iconButton}
						name="chevron-back"
						onPress={() => onChangeMonth(-1)}
					/>
					<AppText.Lg bold>{formatCalendarMonthTitle(month)}</AppText.Lg>
					<AppIcon.Base
						accessibilityLabel="다음 달"
						buttonStyle={styles.iconButton}
						name="chevron-forward"
						onPress={() => onChangeMonth(1)}
					/>
				</View>
				<AppPressable
					accessibilityRole="button"
					border
					onPress={onPressToday}
					radius="base"
					style={styles.todayButton}
				>
					<AppText.Xs bold color={AppColors.primary}>
						오늘
					</AppText.Xs>
				</AppPressable>
			</View>

			<View style={styles.legendFrame}>
				<AttendanceCalendarLegend />
			</View>
			<AttendanceCalendarGrid
				days={calendarDays}
				entriesByDate={entriesByDate}
				mode="month"
				onPressDate={onPressDate}
				todayKey={todayKey}
			/>
		</View>
	);
});

export default AttendanceMonthCalendar;

const styles = StyleSheet.create({
	section: {
		width: "100%",
		backgroundColor: AppColors.background,
		paddingVertical: AppSpacing.md,
	},
	toolbar: {
		minHeight: 44,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: AppSpacing.sm,
		marginBottom: AppSpacing.xs,
		paddingHorizontal: AppSpacing.md,
	},
	monthControls: {
		flexDirection: "row",
		alignItems: "center",
		gap: AppSpacing.xs,
	},
	iconButton: {
		width: 36,
		height: 36,
	},
	todayButton: {
		minWidth: 52,
		minHeight: 34,
		alignItems: "center",
		justifyContent: "center",
		borderColor: "rgba(0, 75, 147, 0.34)",
		backgroundColor: AppColors.background,
		paddingHorizontal: AppSpacing.sm,
	},
	legendFrame: {
		paddingHorizontal: AppSpacing.md,
	},
});
