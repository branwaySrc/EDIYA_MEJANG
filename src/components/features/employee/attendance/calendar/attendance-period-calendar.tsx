import { memo, useMemo } from "react";
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
import {
	buildCalendarMonthPeriodDays,
	getCalendarMonthPeriodCount,
	type CalendarMonthPeriod,
} from "@/lib/korea-date";

export type AttendancePeriodCalendarProps = {
	entriesByDate: Map<string, AttendanceScheduleEntry[]>;
	onChangeMonth: (amount: number) => void;
	onChangePeriod: (periodIndex: number) => void;
	onPressDate: (dateKey: string) => void;
	onPressFullCalendar: () => void;
	onPressToday: () => void;
	period: CalendarMonthPeriod;
	todayKey: string;
};

export const AttendancePeriodCalendar = memo(function AttendancePeriodCalendar({
	entriesByDate,
	onChangeMonth,
	onChangePeriod,
	onPressDate,
	onPressFullCalendar,
	onPressToday,
	period,
	todayKey,
}: AttendancePeriodCalendarProps) {
	const periodDays = useMemo(() => buildCalendarMonthPeriodDays(period), [period]);
	const periodCount = getCalendarMonthPeriodCount(period);

	return (
		<View style={styles.section}>
			<View style={styles.fullCalendarRow}>
				<AppPressable
					accessibilityLabel="달력 전체 보기"
					accessibilityRole="button"
					onPress={onPressFullCalendar}
					pressedColor="rgba(0, 75, 147, 0.08)"
					radius="base"
					style={styles.fullCalendarButton}
				>
					<AppIcon.Sm color={AppColors.primary} name="calendar-outline" pressable={false} />
					<AppText.Xs bold color={AppColors.primary}>
						달력 전체 보기
					</AppText.Xs>
				</AppPressable>
			</View>

			<View style={styles.toolbar}>
				<View style={styles.monthControls}>
					<AppIcon.Base
						accessibilityLabel="이전 달"
						buttonStyle={styles.iconButton}
						name="chevron-back"
						onPress={() => onChangeMonth(-1)}
					/>
					<AppText.Lg bold>{period.month}월</AppText.Lg>
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

			<View accessibilityRole="tablist" style={styles.periodTabs}>
				{Array.from({ length: periodCount }, (_, periodIndex) => {
					const active = periodIndex === period.periodIndex;

					return (
						<AppPressable
							key={periodIndex}
							accessibilityLabel={`${periodIndex + 1}번 2주 구간`}
							accessibilityRole="tab"
							accessibilityState={{ selected: active }}
							onPress={() => onChangePeriod(periodIndex)}
							pressedColor="rgba(0, 75, 147, 0.08)"
							radius="base"
							style={[styles.periodTab, active && styles.activePeriodTab]}
						>
							<AppText.Sm bold color={active ? AppColors.textOnPrimary : AppColors.sub}>
								#{periodIndex + 1}
							</AppText.Sm>
						</AppPressable>
					);
				})}
			</View>

			<View style={styles.legendFrame}>
				<AttendanceCalendarLegend />
			</View>
			<AttendanceCalendarGrid
				days={periodDays}
				entriesByDate={entriesByDate}
				mode="period"
				onPressDate={onPressDate}
				showOutsideMonthDates
				todayKey={todayKey}
			/>
		</View>
	);
});

export default AttendancePeriodCalendar;

const styles = StyleSheet.create({
	section: {
		width: "100%",
		backgroundColor: AppColors.background,
		paddingVertical: AppSpacing.md,
	},
	fullCalendarRow: {
		minHeight: 34,
		alignItems: "flex-end",
		justifyContent: "center",
		paddingHorizontal: AppSpacing.md,
	},
	fullCalendarButton: {
		minHeight: 32,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: AppSpacing.xs,
		paddingHorizontal: AppSpacing.xs,
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
	periodTabs: {
		minHeight: 38,
		flexDirection: "row",
		alignItems: "center",
		gap: AppSpacing.xs,
		marginBottom: AppSpacing.xs,
		paddingHorizontal: AppSpacing.md,
	},
	legendFrame: {
		paddingHorizontal: AppSpacing.md,
	},
	periodTab: {
		width: 48,
		height: 32,
		alignItems: "center",
		justifyContent: "center",
		borderWidth: 1,
		borderColor: "#CBD5E1",
		backgroundColor: AppColors.background,
	},
	activePeriodTab: {
		borderColor: AppColors.primary,
		backgroundColor: AppColors.primary,
	},
});
