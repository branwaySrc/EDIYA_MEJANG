import { type Href, useRouter } from "expo-router";
import { useCallback, useMemo } from "react";
import { ScrollView, StyleSheet, View, type ViewStyle } from "react-native";

import { AppIcon } from "@/components/base/app-icon";
import { AppPressable } from "@/components/base/app-pressable";
import { AppText } from "@/components/base/app-text";
import { formatAttendanceRate, formatMinutesAsHours, shiftColors } from "@/components/features/employee/attendance/attendance-ui";
import { useAttendanceEmployees } from "@/components/features/employee/attendance/use-attendance-employees";
import { useKoreaToday } from "@/components/features/employee/attendance/use-korea-today";
import { AppColors, AppSpacing } from "@/constants/theme";
import type { EmployeeAttendanceSummary } from "@/database/employee/attendance.type";
import { buildAttendanceMonthSummary, buildAttendanceSchedule } from "@/lib/attendance-schedule";
import { formatCalendarMonthKey, formatShortDateLabel, getCalendarMonth } from "@/lib/korea-date";
import { useAttendanceStore } from "@/store/attendance-store";

function EmployeeStatisticsRow({ onPressDetails, summary }: { onPressDetails: () => void; summary: EmployeeAttendanceSummary }) {
	const progressStyle: ViewStyle = {
		width: `${Math.min(100, Math.max(0, summary.attendanceRate * 100))}%`,
		backgroundColor: shiftColors[summary.shiftGroup],
	};
	const completedDateText = summary.completedDates.length === 0 ? "없음" : summary.completedDates.slice(-4).map(formatShortDateLabel).join(", ");
	const missedDateText = summary.missedDates.length === 0 ? "없음" : summary.missedDates.slice(-4).map(formatShortDateLabel).join(", ");
	const substituteDateText = summary.substituteDates.length === 0 ? "없음" : summary.substituteDates.slice(-4).map(formatShortDateLabel).join(", ");

	return (
		<View style={styles.employeeRow}>
			<View style={styles.employeeHeader}>
				<View style={styles.employeeIdentity}>
					<View style={[styles.shiftMark, { backgroundColor: shiftColors[summary.shiftGroup] }]} />
					<View style={styles.employeeText}>
						<AppText.Base bold>{summary.employeeName}</AppText.Base>
						<AppText.Xs color={AppColors.sub}>
							{summary.shiftGroup} · 월 {formatMinutesAsHours(summary.contractedMinutes)}
						</AppText.Xs>
					</View>
				</View>
				<AppText.Base bold color={AppColors.primary}>
					{formatAttendanceRate(summary.attendanceRate)}
				</AppText.Base>
			</View>

			<View style={styles.progressTrack}>
				<View style={[styles.progressValue, progressStyle]} />
			</View>

			<View style={styles.employeeCounts}>
				<AppText.Xs color={AppColors.sub}>
					완료 {summary.completedShiftCount}/{summary.elapsedShiftCount}회
				</AppText.Xs>
				<AppText.Xs color={AppColors.sub}>확정 {formatMinutesAsHours(summary.completedMinutes)}</AppText.Xs>
				<AppText.Xs color={AppColors.sub}>부족 {formatMinutesAsHours(summary.missedMinutes)}</AppText.Xs>
				<AppText.Xs color="#04878B">
					대근 {summary.substituteShiftCount}회 · {formatMinutesAsHours(summary.substituteMinutes)}
				</AppText.Xs>
			</View>

			<View style={styles.dateSummary}>
				<AppText.Xs color={AppColors.sub} numberOfLines={2}>
					출근일 {completedDateText}
				</AppText.Xs>
				<AppText.Xs color={summary.missedDates.length > 0 ? "#B42318" : AppColors.sub} numberOfLines={2}>
					미출근일 {missedDateText}
				</AppText.Xs>
				<AppText.Xs color={summary.substituteDates.length > 0 ? "#04878B" : AppColors.sub} numberOfLines={2}>
					대근 시간 {substituteDateText}
				</AppText.Xs>
			</View>

			<View style={styles.detailsActionRow}>
				<AppPressable
					accessibilityLabel={`${summary.employeeName} 근무 통계 자세히 보기`}
					accessibilityRole="button"
					border
					onPress={onPressDetails}
					radius="base"
					style={styles.detailsButton}
				>
					<AppText.Sm bold color={AppColors.primary}>
						자세히 보기
					</AppText.Sm>
					<AppIcon.Sm color={AppColors.primary} name="chevron-forward" pressable={false} />
				</AppPressable>
			</View>
		</View>
	);
}

export function AttendanceStatisticsView() {
	const router = useRouter();
	const employees = useAttendanceEmployees();
	const todayKey = useKoreaToday();
	const currentMonth = useMemo(() => getCalendarMonth(todayKey), [todayKey]);
	const currentMonthKey = useMemo(() => formatCalendarMonthKey(currentMonth), [currentMonth]);
	const records = useAttendanceStore(state => state.records);
	const schedule = useMemo(
		() =>
			buildAttendanceSchedule({
				...currentMonth,
				employees,
				records,
				todayKey,
			}),
		[currentMonth, employees, records, todayKey],
	);
	const summary = useMemo(
		() => buildAttendanceMonthSummary(schedule, employees, todayKey),
		[employees, schedule, todayKey],
	);
	const handlePressDetails = useCallback(
		(employeeId: string) => {
			router.push({
				pathname: "/attendance/statistics/[employeeId]",
				params: {
					employeeId,
					month: currentMonthKey,
				},
			} as Href);
		},
		[currentMonthKey, router],
	);

	return (
		<ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} style={styles.container}>
			<View style={styles.content}>
				<View style={styles.employeeSection}>
					<View style={styles.sectionHeader}>
						<AppText.Base bold>직원별 현황</AppText.Base>
						<AppText.Xs color={AppColors.sub}>{summary.employeeSummaries.length}명</AppText.Xs>
					</View>
					{summary.employeeSummaries.map(employeeSummary => (
						<EmployeeStatisticsRow
							key={employeeSummary.employeeId}
							onPressDetails={() => handlePressDetails(employeeSummary.employeeId)}
							summary={employeeSummary}
						/>
					))}
				</View>
			</View>
		</ScrollView>
	);
}

export default AttendanceStatisticsView;

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
		maxWidth: 960,
		backgroundColor: AppColors.background,
		padding: AppSpacing.md,
	},
	employeeSection: {
		width: "100%",
	},
	sectionHeader: {
		minHeight: 44,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		borderBottomWidth: 1,
		borderBottomColor: "#CBD5E1",
	},
	employeeRow: {
		width: "100%",
		gap: AppSpacing.sm,
		borderBottomWidth: 1,
		borderBottomColor: "#E2E8F0",
		paddingVertical: AppSpacing.md,
	},
	employeeHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: AppSpacing.sm,
	},
	employeeIdentity: {
		flex: 1,
		minWidth: 0,
		flexDirection: "row",
		alignItems: "center",
		gap: AppSpacing.sm,
	},
	shiftMark: {
		width: 4,
		height: 34,
		borderRadius: 2,
	},
	employeeText: {
		flex: 1,
		minWidth: 0,
		gap: 1,
	},
	progressTrack: {
		width: "100%",
		height: 8,
		borderRadius: 4,
		backgroundColor: "#E2E8F0",
		overflow: "hidden",
	},
	progressValue: {
		height: "100%",
		borderRadius: 4,
	},
	employeeCounts: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		flexWrap: "wrap",
		columnGap: AppSpacing.md,
		rowGap: AppSpacing.xs,
	},
	dateSummary: {
		gap: 2,
	},
	detailsActionRow: {
		flexDirection: "row",
		justifyContent: "flex-end",
	},
	detailsButton: {
		minWidth: 132,
		minHeight: 38,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: AppSpacing.xs,
		borderColor: "rgba(0, 75, 147, 0.34)",
		backgroundColor: AppColors.background,
		paddingLeft: AppSpacing.md,
		paddingRight: AppSpacing.xs,
	},
});
