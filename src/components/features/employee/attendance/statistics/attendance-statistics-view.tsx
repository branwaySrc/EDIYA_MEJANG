import { type Href, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View, type ViewStyle } from "react-native";

import { AppIcon } from "@/components/base/app-icon";
import { AppPressable } from "@/components/base/app-pressable";
import { AppText } from "@/components/base/app-text";
import { formatAttendanceRate, formatMinutesAsHours, shiftColors } from "@/components/features/employee/attendance/attendance-ui";
import { OwnerMonthlyWorkSummary } from "@/components/features/employee/attendance/owner-monthly-work-summary";
import { useAttendanceEmployees } from "@/components/features/employee/attendance/use-attendance-employees";
import { useKoreaToday } from "@/components/features/employee/attendance/use-korea-today";
import { AppColors, AppSpacing } from "@/constants/theme";
import { fetchAttendanceMonthArchive } from "@/database/employee/attendance-history";
import type { AttendanceMonthSummary, AttendanceScheduleEntry, EmployeeAttendanceSummary } from "@/database/employee/attendance.type";
import { buildAttendanceMonthSummary, buildAttendanceSchedule } from "@/lib/attendance-schedule";
import {
	addCalendarMonths,
	formatCalendarMonthKey,
	formatCalendarMonthTitle,
	formatShortDateLabel,
	getCalendarMonth,
	getCalendarMonthLastDateKey,
	parseCalendarMonthKey,
} from "@/lib/korea-date";
import { useAttendanceStore } from "@/store/attendance-store";

type MonthSummaryState =
	| { monthKey: string; status: "loading" }
	| { monthKey: string; status: "empty" | "error" }
	| { monthKey: string; schedule: AttendanceScheduleEntry[]; status: "ready"; summary: AttendanceMonthSummary };

function formatPayrollAmount(minutes: number, hourlyWage: number | null | undefined) {
	if (!hourlyWage) {
		return "시급 미입력";
	}

	return `${Math.round((minutes / 60) * hourlyWage).toLocaleString("ko-KR")}원`;
}

function getPayableWorkMinutes(summary: EmployeeAttendanceSummary) {
	return summary.completedMinutes + summary.substituteMinutes;
}

function EmployeeStatisticsRow({
	hourlyWage,
	onPressDetails,
	showOwnerPayroll,
	summary,
}: {
	hourlyWage?: number | null;
	onPressDetails: () => void;
	showOwnerPayroll: boolean;
	summary: EmployeeAttendanceSummary;
}) {
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

			{showOwnerPayroll ? (
				<View style={styles.payrollSummary}>
					<View style={styles.payrollItem}>
						<AppText.Xs bold color={AppColors.sub}>
							예상 금액
						</AppText.Xs>
						<AppText.Base bold color={AppColors.primary}>
							{formatPayrollAmount(getPayableWorkMinutes(summary), hourlyWage)}
						</AppText.Base>
					</View>
					<View style={styles.payrollItem}>
						<AppText.Xs bold color={AppColors.sub}>
							예정 금액
						</AppText.Xs>
						<AppText.Base bold>{formatPayrollAmount(summary.contractedMinutes, hourlyWage)}</AppText.Base>
					</View>
				</View>
			) : null}

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

export type AttendanceStatisticsViewProps = {
	showOwnerMonthlySummary?: boolean;
	showOwnerPayroll?: boolean;
};

export function AttendanceStatisticsView({ showOwnerMonthlySummary = false, showOwnerPayroll = false }: AttendanceStatisticsViewProps) {
	const router = useRouter();
	const employees = useAttendanceEmployees();
	const todayKey = useKoreaToday();
	const currentMonth = useMemo(() => getCalendarMonth(todayKey), [todayKey]);
	const currentMonthKey = useMemo(() => formatCalendarMonthKey(currentMonth), [currentMonth]);
	const [selectedMonthKey, setSelectedMonthKey] = useState(currentMonthKey);
	const selectedMonth = useMemo(() => parseCalendarMonthKey(selectedMonthKey) ?? currentMonth, [currentMonth, selectedMonthKey]);
	const isCurrentMonth = selectedMonthKey === currentMonthKey;
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
	const summary = useMemo(() => buildAttendanceMonthSummary(schedule, employees, todayKey), [employees, schedule, todayKey]);
	const employeeById = useMemo(() => new Map(employees.map(employee => [employee.id, employee])), [employees]);
	const [archiveState, setArchiveState] = useState<MonthSummaryState>({
		monthKey: selectedMonthKey,
		status: "loading",
	});

	useEffect(() => {
		if (isCurrentMonth) {
			return;
		}

		let active = true;

		fetchAttendanceMonthArchive(selectedMonthKey)
			.then(archive => {
				if (!active) {
					return;
				}

				if (!archive || archive.coverage.status !== "closed") {
					setArchiveState({ monthKey: selectedMonthKey, status: "empty" });
					return;
				}

				const archiveSchedule = buildAttendanceSchedule({
					...selectedMonth,
					employees,
					records: archive.records,
					todayKey: getCalendarMonthLastDateKey(selectedMonth),
				});
				const archiveSummary = buildAttendanceMonthSummary(archiveSchedule, employees, getCalendarMonthLastDateKey(selectedMonth));

				setArchiveState({ monthKey: selectedMonthKey, schedule: archiveSchedule, status: "ready", summary: archiveSummary });
			})
			.catch(() => {
				if (active) {
					setArchiveState({ monthKey: selectedMonthKey, status: "error" });
				}
			});

		return () => {
			active = false;
		};
	}, [employees, isCurrentMonth, selectedMonth, selectedMonthKey]);

	const visibleState: MonthSummaryState = isCurrentMonth
		? { monthKey: selectedMonthKey, schedule, status: "ready", summary }
		: archiveState.monthKey === selectedMonthKey
			? archiveState
			: { monthKey: selectedMonthKey, status: "loading" };
	const visibleSummary = visibleState.status === "ready" ? visibleState.summary : null;
	const visibleSummaryTodayKey = isCurrentMonth ? todayKey : getCalendarMonthLastDateKey(selectedMonth);
	const canMoveNext = selectedMonthKey < currentMonthKey;
	const handleChangeMonth = useCallback(
		(amount: number) => {
			const nextMonth = addCalendarMonths(selectedMonth, amount);
			const nextMonthKey = formatCalendarMonthKey(nextMonth);

			if (nextMonthKey <= currentMonthKey) {
				setSelectedMonthKey(nextMonthKey);
			}
		},
		[currentMonthKey, selectedMonth],
	);
	const handlePressDetails = useCallback(
		(employeeId: string) => {
			const pathname = showOwnerPayroll ? "/sajang/attendance/statistics/[employeeId]" : "/attendance/statistics/[employeeId]";

			router.push({
				pathname,
				params: {
					employeeId,
					month: selectedMonthKey,
				},
			} as Href);
		},
		[router, selectedMonthKey, showOwnerPayroll],
	);

	return (
		<ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} style={styles.container}>
			<View style={styles.content}>
				<View style={styles.monthToolbar}>
					<View style={styles.monthControls}>
						<AppIcon.Base
							accessibilityLabel="이전 달 통계"
							buttonStyle={styles.monthIconButton}
							name="chevron-back"
							onPress={() => handleChangeMonth(-1)}
						/>
						<AppText.Base bold style={styles.monthTitle}>
							{formatCalendarMonthTitle(selectedMonth)}
						</AppText.Base>
						<AppIcon.Base
							accessibilityLabel="다음 달 통계"
							buttonStyle={styles.monthIconButton}
							color={canMoveNext ? AppColors.text : AppColors.placeholder}
							disabled={!canMoveNext}
							name="chevron-forward"
							onPress={() => handleChangeMonth(1)}
						/>
					</View>

					{isCurrentMonth ? (
						<View style={styles.currentButtonPlaceholder} />
					) : (
						<AppPressable
							accessibilityRole="button"
							border
							onPress={() => setSelectedMonthKey(currentMonthKey)}
							radius="base"
							style={styles.currentButton}
						>
							<AppText.Xs bold color={AppColors.primary}>
								이번달로 이동
							</AppText.Xs>
						</AppPressable>
					)}
				</View>

				{showOwnerMonthlySummary && visibleState.status === "ready" ? (
					<View style={styles.monthlySummaryFullBleed}>
						<OwnerMonthlyWorkSummary employees={employees} entries={visibleState.schedule} todayKey={visibleSummaryTodayKey} />
					</View>
				) : null}

				<View style={styles.employeeSection}>
					<View style={styles.sectionHeader}>
						<AppText.Base bold>직원별 현황</AppText.Base>
						<AppText.Base color={AppColors.sub}>{visibleSummary?.employeeSummaries.length ?? 0}명</AppText.Base>
					</View>
					{visibleState.status === "loading" ? (
						<View style={styles.loading}>
							<ActivityIndicator color={AppColors.primary} />
						</View>
					) : visibleState.status === "ready" && visibleState.summary.employeeSummaries.length > 0 ? (
						visibleState.summary.employeeSummaries.map(employeeSummary => (
							<EmployeeStatisticsRow
								key={employeeSummary.employeeId}
								hourlyWage={employeeById.get(employeeSummary.employeeId)?.hourlyWage}
								onPressDetails={() => handlePressDetails(employeeSummary.employeeId)}
								showOwnerPayroll={showOwnerPayroll}
								summary={employeeSummary}
							/>
						))
					) : (
						<View style={styles.emptyState}>
							<AppText.Base bold>선택한 달의 근태 통계가 없습니다.</AppText.Base>
							<AppText.Sm color={AppColors.sub}>
								{visibleState.status === "error" ? "근태 기록을 불러오지 못했습니다." : "마감된 근태 기록이 없거나 예정 근무가 없습니다."}
							</AppText.Sm>
						</View>
					)}
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
		gap: AppSpacing.md,
		backgroundColor: AppColors.background,
		padding: AppSpacing.md,
	},
	monthToolbar: {
		minHeight: 44,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: AppSpacing.sm,
	},
	monthControls: {
		flexDirection: "row",
		alignItems: "center",
		gap: AppSpacing.xs,
	},
	monthIconButton: {
		width: 36,
		height: 36,
	},
	monthTitle: {
		minWidth: 92,
		textAlign: "center",
		letterSpacing: 0,
	},
	currentButtonPlaceholder: {
		width: 58,
	},
	currentButton: {
		minWidth: 58,
		minHeight: 34,
		alignItems: "center",
		justifyContent: "center",
		borderColor: "rgba(0, 75, 147, 0.34)",
		backgroundColor: AppColors.background,
		paddingHorizontal: AppSpacing.sm,
	},
	monthlySummaryFullBleed: {
		marginHorizontal: -AppSpacing.md,
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
	payrollSummary: {
		flexDirection: "row",
		gap: AppSpacing.sm,
	},
	payrollItem: {
		flex: 1,
		minHeight: 64,
		justifyContent: "center",
		gap: AppSpacing.xs,
		borderWidth: 1,
		borderColor: "rgba(0, 75, 147, 0.18)",
		borderRadius: 4,
		backgroundColor: "#F8FBFF",
		paddingHorizontal: AppSpacing.sm,
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
	loading: {
		minHeight: 220,
		alignItems: "center",
		justifyContent: "center",
	},
	emptyState: {
		minHeight: 220,
		alignItems: "center",
		justifyContent: "center",
		gap: AppSpacing.xs,
		paddingHorizontal: AppSpacing.md,
	},
});
