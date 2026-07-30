import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";

import { AppIcon } from "@/components/base/app-icon";
import { AppPressable } from "@/components/base/app-pressable";
import { AppText } from "@/components/base/app-text";
import { shiftColors } from "@/components/features/employee/attendance/attendance-ui";
import { AttendanceSummaryMetrics } from "@/components/features/employee/attendance/statistics/attendance-summary-metrics";
import { useKoreaToday } from "@/components/features/employee/attendance/use-korea-today";
import { AppColors, AppSpacing } from "@/constants/theme";
import { fetchAttendanceMonthArchive } from "@/database/employee/attendance-history";
import type { EmployeeAttendanceSummary } from "@/database/employee/attendance.type";
import { sampleEmployees } from "@/database/employee/employee";
import { buildEmployeeAttendanceMonthSummary } from "@/lib/attendance-schedule";
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

type ArchiveStatisticsState =
	| { monthKey: string; status: "loading" }
	| { monthKey: string; status: "empty" | "error" }
	| { monthKey: string; status: "ready"; summary: EmployeeAttendanceSummary };

export type EmployeeAttendanceStatisticsViewProps = {
	employeeId: string;
	monthKey: string;
	onChangeMonth: (monthKey: string) => void;
};

function formatDateHistory(dates: string[]) {
	return dates.length === 0 ? "없음" : dates.map(formatShortDateLabel).join(", ");
}

function DateHistoryRow({ color = AppColors.text, dates, label }: { color?: string; dates: string[]; label: string }) {
	return (
		<View style={styles.dateHistoryRow}>
			<AppText.Xs bold color={AppColors.sub} style={styles.dateHistoryLabel}>
				{label}
			</AppText.Xs>
			<AppText.Sm color={color} style={styles.dateHistoryValue}>
				{formatDateHistory(dates)}
			</AppText.Sm>
		</View>
	);
}

function StatisticsFallback({ error = false }: { error?: boolean }) {
	return (
		<View style={styles.fallback}>
			<AppIcon.Lg color={AppColors.sub} name="document-text-outline" pressable={false} />
			<AppText.Base bold>데이터 조회가 되지 않았습니다.</AppText.Base>
			<AppText.Sm color={AppColors.sub} style={styles.fallbackDescription}>
				{error ? "근무 기록을 불러오는 중 문제가 발생했습니다." : "선택한 월에 확정된 근무 기록이 없습니다."}
			</AppText.Sm>
		</View>
	);
}

export function EmployeeAttendanceStatisticsView({ employeeId, monthKey, onChangeMonth }: EmployeeAttendanceStatisticsViewProps) {
	const todayKey = useKoreaToday();
	const currentMonth = useMemo(() => getCalendarMonth(todayKey), [todayKey]);
	const currentMonthKey = useMemo(() => formatCalendarMonthKey(currentMonth), [currentMonth]);
	const selectedMonth = useMemo(() => parseCalendarMonthKey(monthKey) ?? currentMonth, [currentMonth, monthKey]);
	const isCurrentMonth = monthKey === currentMonthKey;
	const employee = useMemo(() => sampleEmployees.find(item => item.id === employeeId), [employeeId]);
	const liveRecords = useAttendanceStore(state => state.records);
	const liveSummary = useMemo(
		() =>
			buildEmployeeAttendanceMonthSummary({
				...currentMonth,
				employeeId,
				employees: sampleEmployees,
				records: liveRecords,
				todayKey,
			}),
		[currentMonth, employeeId, liveRecords, todayKey],
	);
	const [archiveState, setArchiveState] = useState<ArchiveStatisticsState>({
		monthKey,
		status: "loading",
	});

	useEffect(() => {
		if (isCurrentMonth) {
			return;
		}

		let active = true;

		fetchAttendanceMonthArchive(monthKey)
			.then(archive => {
				if (!active) {
					return;
				}

				if (!archive || archive.coverage.status !== "closed") {
					setArchiveState({ monthKey, status: "empty" });
					return;
				}

				const summary = buildEmployeeAttendanceMonthSummary({
					...selectedMonth,
					employeeId,
					employees: sampleEmployees,
					records: archive.records,
					todayKey: getCalendarMonthLastDateKey(selectedMonth),
				});

				setArchiveState(summary ? { monthKey, status: "ready", summary } : { monthKey, status: "empty" });
			})
			.catch(() => {
				if (active) {
					setArchiveState({ monthKey, status: "error" });
				}
			});

		return () => {
			active = false;
		};
	}, [employeeId, isCurrentMonth, monthKey, selectedMonth]);

	const visibleState: ArchiveStatisticsState = isCurrentMonth
		? liveSummary
			? { monthKey, status: "ready", summary: liveSummary }
			: { monthKey, status: "empty" }
		: archiveState.monthKey === monthKey
			? archiveState
			: { monthKey, status: "loading" };
	const canMoveNext = monthKey < currentMonthKey;
	const handleChangeMonth = useCallback(
		(amount: number) => {
			const nextMonth = addCalendarMonths(selectedMonth, amount);
			const nextMonthKey = formatCalendarMonthKey(nextMonth);

			if (nextMonthKey <= currentMonthKey) {
				onChangeMonth(nextMonthKey);
			}
		},
		[currentMonthKey, onChangeMonth, selectedMonth],
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
						<AppPressable accessibilityRole="button" border onPress={() => onChangeMonth(currentMonthKey)} radius="base" style={styles.currentButton}>
							<AppText.Xs bold color={AppColors.primary}>
								이번 달
							</AppText.Xs>
						</AppPressable>
					)}
				</View>

				<View style={styles.header}>
					<View style={styles.employeeIdentity}>
						<View style={[styles.shiftMark, { backgroundColor: employee ? shiftColors[employee.shiftGroup] : AppColors.sub }]} />
						<View style={styles.employeeText}>
							<AppText.Lg bold>{employee?.name ?? "직원 정보 없음"}</AppText.Lg>
							<AppText.Xs color={AppColors.sub}>{employee ? `${employee.shiftGroup} · ${employee.kakaoName}` : employeeId}</AppText.Xs>
						</View>
					</View>
					<View style={[styles.sourceBadge, isCurrentMonth ? styles.liveBadge : styles.archiveBadge]}>
						<AppText.Xs bold color={isCurrentMonth ? AppColors.primary : AppColors.sub}>
							{isCurrentMonth ? "실시간" : "확정"}
						</AppText.Xs>
					</View>
				</View>

				<View style={styles.titleArea}>
					<AppText.Lg bold>{formatCalendarMonthTitle(selectedMonth)} 출근 현황</AppText.Lg>
					<AppText.Xs color={AppColors.sub}>
						{isCurrentMonth ? "출근률은 오늘까지 예정된 근무를 기준으로 계산됩니다." : "마감된 월의 확정 근무 기록을 기준으로 계산됩니다."}
					</AppText.Xs>
				</View>

				{visibleState.status === "loading" ? (
					<View style={styles.loading}>
						<ActivityIndicator color={AppColors.primary} />
					</View>
				) : visibleState.status === "ready" ? (
					<>
						<AttendanceSummaryMetrics attendanceRateLabel={isCurrentMonth ? "오늘까지 출근률" : "월 출근률"} summary={visibleState.summary} />

						<View style={styles.dateHistory}>
							<AppText.Base bold>근무 날짜</AppText.Base>
							<DateHistoryRow dates={visibleState.summary.completedDates} label="출근일" />
							<DateHistoryRow color="#B42318" dates={visibleState.summary.missedDates} label="미출근일" />
							<DateHistoryRow color="#04878B" dates={visibleState.summary.substituteDates} label="대타 출근일" />
						</View>
					</>
				) : (
					<StatisticsFallback error={visibleState.status === "error"} />
				)}
			</View>
		</ScrollView>
	);
}

export default EmployeeAttendanceStatisticsView;

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
	header: {
		minHeight: 56,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: AppSpacing.sm,
		borderTopWidth: 1,
		borderBottomWidth: 1,
		borderColor: "#E2E8F0",
		paddingVertical: AppSpacing.sm,
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
		height: 36,
		borderRadius: 2,
	},
	employeeText: {
		flex: 1,
		minWidth: 0,
		gap: 1,
	},
	sourceBadge: {
		minWidth: 50,
		minHeight: 26,
		alignItems: "center",
		justifyContent: "center",
		borderRadius: 4,
		paddingHorizontal: AppSpacing.xs,
	},
	liveBadge: {
		backgroundColor: "rgba(0, 75, 147, 0.1)",
	},
	archiveBadge: {
		backgroundColor: "#E2E8F0",
	},
	titleArea: {
		gap: 2,
	},
	loading: {
		minHeight: 240,
		alignItems: "center",
		justifyContent: "center",
	},
	dateHistory: {
		width: "100%",
		marginTop: AppSpacing.sm,
		paddingTop: AppSpacing.lg,
		borderTopWidth: 1,
		borderTopColor: "#CBD5E1",
	},
	dateHistoryRow: {
		minHeight: 32,
		flexDirection: "row",
		alignItems: "flex-start",
		gap: AppSpacing.sm,
		borderBottomWidth: 1,
		borderBottomColor: "#E2E8F0",
		paddingVertical: AppSpacing.sm,
	},
	dateHistoryLabel: {
		width: 72,
		paddingTop: 2,
		letterSpacing: 0,
	},
	dateHistoryValue: {
		flex: 1,
		minWidth: 0,
		letterSpacing: 0,
	},
	fallback: {
		minHeight: 240,
		alignItems: "center",
		justifyContent: "center",
		gap: AppSpacing.xs,
		borderTopWidth: 1,
		borderTopColor: "#E2E8F0",
		paddingHorizontal: AppSpacing.md,
	},
	fallbackDescription: {
		textAlign: "center",
		letterSpacing: 0,
	},
});
