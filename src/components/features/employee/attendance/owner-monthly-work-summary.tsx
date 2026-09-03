import { useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { AppBadge } from "@/components/base/app-badge";
import { AppIcon } from "@/components/base/app-icon";
import { AppPressable } from "@/components/base/app-pressable";
import { AppText } from "@/components/base/app-text";
import {
	buildTemporaryWorkerSummaries,
	TemporaryWorkerSummarySection,
	type TemporaryWorkerSummaryItem,
} from "@/components/features/employee/attendance/temporary-worker-summary";
import { AppColors, AppSpacing } from "@/constants/theme";
import type { AttendanceScheduleEntry } from "@/database/employee/attendance.type";
import type { Employee } from "@/database/employee/employee.type";
import { buildAttendanceMonthSummary } from "@/lib/attendance-schedule";
import { formatCalendarMonthTitle, parseDateKey, type CalendarMonthPeriod } from "@/lib/korea-date";

type WeeklyAllowanceCandidate = {
	employeeId: string;
	employeeName: string;
	minutes: number;
	weekIndex: number;
};

export type OwnerMonthlyWorkSummaryProps = {
	employees: Employee[];
	entries: AttendanceScheduleEntry[];
	todayKey: string;
};

export type OwnerMonthlyWorkSummaryMonthToolbarProps = {
	onChangeMonth: (amount: number) => void;
	onPressToday: () => void;
	period: CalendarMonthPeriod;
};

function formatWorkMinutes(totalMinutes: number) {
	const hours = Math.floor(totalMinutes / 60);
	const minutes = totalMinutes % 60;

	if (hours === 0) {
		return `${minutes}분`;
	}

	if (minutes === 0) {
		return `${hours}시간`;
	}

	return `${hours}시간 ${minutes}분`;
}

function formatPayrollAmount(amount: number) {
	return `${Math.round(amount).toLocaleString("ko-KR")}원`;
}

function getMonthWeekIndex(dateKey: string) {
	const { day, month, year } = parseDateKey(dateKey);
	const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();

	return Math.floor((firstWeekday + day - 1) / 7) + 1;
}

function buildWeeklyAllowanceCandidates(entries: AttendanceScheduleEntry[], employeeById: Map<string, Employee>) {
	const weeklyMinutesByEmployee = new Map<string, { employeeName: string; minutes: number; weekIndex: number }>();

	for (const entry of entries) {
		if (entry.status !== "completed") {
			continue;
		}

		const workerId = entry.substituteEmployeeId ?? entry.employeeId;
		const worker = employeeById.get(workerId);

		if (!worker) {
			continue;
		}

		const minutes = entry.substituteEmployeeId
			? (entry.substituteConfirmedWorkMinutes ?? entry.scheduledMinutes)
			: (entry.confirmedWorkMinutes ?? entry.scheduledMinutes);
		const weekIndex = getMonthWeekIndex(entry.workDate);
		const key = `${workerId}:${weekIndex}`;
		const current = weeklyMinutesByEmployee.get(key);

		weeklyMinutesByEmployee.set(key, {
			employeeName: worker.name,
			minutes: (current?.minutes ?? 0) + minutes,
			weekIndex,
		});
	}

	return [...weeklyMinutesByEmployee.entries()]
		.map(([key, value]) => ({
			employeeId: key.split(":")[0],
			...value,
		}))
		.filter(candidate => candidate.minutes >= 15 * 60)
		.sort((left, right) => left.weekIndex - right.weekIndex || left.employeeName.localeCompare(right.employeeName, "ko"));
}

export function OwnerMonthlyWorkSummaryMonthToolbar({
	onChangeMonth,
	onPressToday,
	period,
}: OwnerMonthlyWorkSummaryMonthToolbarProps) {
	return (
		<View style={styles.summaryMonthToolbar}>
			<View style={styles.summaryMonthControls}>
				<AppIcon.Base
					accessibilityLabel="이전 달 근무 요약"
					buttonStyle={styles.summaryMonthIconButton}
					name="chevron-back"
					onPress={() => onChangeMonth(-1)}
				/>
				<AppText.Base bold style={styles.summaryMonthTitle}>
					{formatCalendarMonthTitle(period)}
				</AppText.Base>
				<AppIcon.Base
					accessibilityLabel="다음 달 근무 요약"
					buttonStyle={styles.summaryMonthIconButton}
					name="chevron-forward"
					onPress={() => onChangeMonth(1)}
				/>
			</View>
			<AppPressable accessibilityRole="button" border onPress={onPressToday} radius="base" style={styles.summaryTodayButton}>
				<AppText.Xs bold color={AppColors.primary}>
					오늘로 이동하기
				</AppText.Xs>
			</AppPressable>
		</View>
	);
}

function MonthlyWorkSummaryTable({
	actualCost,
	actualMinutes,
	scheduledCost,
	scheduledMinutes,
	temporaryWorkerSummaries,
	weeklyAllowanceCandidates,
}: {
	actualCost: number;
	actualMinutes: number;
	scheduledCost: number;
	scheduledMinutes: number;
	temporaryWorkerSummaries: TemporaryWorkerSummaryItem[];
	weeklyAllowanceCandidates: WeeklyAllowanceCandidate[];
}) {
	return (
		<View style={styles.summaryTable}>
			<View style={styles.summaryHeader}>
				<AppText.Base bold color={AppColors.primary}>
					이번달 근무 요약
				</AppText.Base>
			</View>
			<View style={styles.summaryRow}>
				<AppText.Sm bold color={AppColors.sub} style={styles.summaryLabel}>
					이번달 누적 총 근무 시간
				</AppText.Sm>
				<AppText.Base bold style={styles.summaryValue}>
					{formatWorkMinutes(actualMinutes)}
				</AppText.Base>
			</View>
			<View style={styles.summaryRow}>
				<AppText.Sm bold color={AppColors.sub} style={styles.summaryLabel}>
					예정 근무 시간
				</AppText.Sm>
				<AppText.Base bold style={styles.summaryValue}>
					{formatWorkMinutes(scheduledMinutes)}
				</AppText.Base>
			</View>
			<View style={styles.summaryRow}>
				<AppText.Sm bold color={AppColors.sub} style={styles.summaryLabel}>
					총 예상비용
				</AppText.Sm>
				<AppText.Base bold style={styles.summaryValue}>
					{formatPayrollAmount(scheduledCost)}
				</AppText.Base>
			</View>
			<View style={styles.summaryRow}>
				<AppText.Sm bold color={AppColors.sub} style={styles.summaryLabel}>
					확정비용
				</AppText.Sm>
				<AppText.Base bold color={AppColors.primary} style={styles.summaryValue}>
					{formatPayrollAmount(actualCost)}
				</AppText.Base>
			</View>
			<View style={styles.allowanceRow}>
				<View style={styles.allowanceHeader}>
					<AppText.Sm bold color={AppColors.sub}>
						주휴수당
					</AppText.Sm>
					<AppText.Xs color={AppColors.sub}>주 15시간 이상 실제 근무</AppText.Xs>
				</View>
				{weeklyAllowanceCandidates.length > 0 ? (
					<View style={styles.allowanceBadges}>
						{weeklyAllowanceCandidates.map(candidate => (
							<AppBadge key={`${candidate.employeeId}-${candidate.weekIndex}`} size="sm" tone="primary">
								{candidate.employeeName} · {candidate.weekIndex}주차
							</AppBadge>
						))}
					</View>
				) : (
					<AppText.Sm color={AppColors.placeholder}>해당 직원 없음</AppText.Sm>
				)}
			</View>
			<TemporaryWorkerSummarySection items={temporaryWorkerSummaries} />
		</View>
	);
}

export function OwnerMonthlyWorkSummary({ employees, entries, todayKey }: OwnerMonthlyWorkSummaryProps) {
	const employeeById = useMemo(() => new Map(employees.map(employee => [employee.id, employee])), [employees]);
	const monthSummary = useMemo(
		() => buildAttendanceMonthSummary(entries, employees, todayKey),
		[employees, entries, todayKey],
	);
	const weeklyAllowanceCandidates = useMemo(
		() => buildWeeklyAllowanceCandidates(entries, employeeById),
		[employeeById, entries],
	);
	const temporaryWorkerSummaries = useMemo(
		() => buildTemporaryWorkerSummaries(entries),
		[entries],
	);
	const payrollSummary = useMemo(() => {
		return entries.reduce(
			(total, entry) => {
				const scheduledEmployee = employeeById.get(entry.employeeId);
				const scheduledWage = scheduledEmployee?.hourlyWage ?? 0;
				const scheduledCost = (entry.scheduledMinutes / 60) * scheduledWage;
				let actualCost = 0;

				if (entry.status === "completed") {
					const workerId = entry.substituteEmployeeId ?? entry.employeeId;
					const worker = employeeById.get(workerId);
					const actualMinutes = entry.substituteEmployeeId || entry.temporaryWorkerId
						? (entry.substituteConfirmedWorkMinutes ?? entry.scheduledMinutes)
						: (entry.confirmedWorkMinutes ?? entry.scheduledMinutes);
					const actualHourlyWage = entry.temporaryWorkerId
						? (entry.substituteHourlyWageSnapshot ?? 0)
						: (worker?.hourlyWage ?? 0);

					actualCost = (actualMinutes / 60) * actualHourlyWage;
				}

				return {
					actualCost: total.actualCost + actualCost,
					scheduledCost: total.scheduledCost + scheduledCost,
				};
			},
			{ actualCost: 0, scheduledCost: 0 },
		);
	}, [employeeById, entries]);

	return (
		<MonthlyWorkSummaryTable
			actualCost={payrollSummary.actualCost}
			actualMinutes={monthSummary.completedMinutes}
			scheduledCost={payrollSummary.scheduledCost}
			scheduledMinutes={monthSummary.contractedMinutes}
			temporaryWorkerSummaries={temporaryWorkerSummaries}
			weeklyAllowanceCandidates={weeklyAllowanceCandidates}
		/>
	);
}

const styles = StyleSheet.create({
	summaryMonthToolbar: {
		minHeight: 70,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: AppSpacing.sm,
		borderBottomWidth: 1,
		borderBottomColor: "rgba(71, 85, 105, 0.14)",
		paddingHorizontal: AppSpacing.md,
	},
	summaryMonthControls: {
		flexDirection: "row",
		alignItems: "center",
		gap: AppSpacing.xs,
	},
	summaryMonthIconButton: {
		width: 36,
		height: 36,
	},
	summaryMonthTitle: {
		minWidth: 96,
		textAlign: "center",
		letterSpacing: 0,
	},
	summaryTodayButton: {
		minWidth: 52,
		minHeight: 34,
		alignItems: "center",
		justifyContent: "center",
		borderColor: "rgba(0, 75, 147, 0.34)",
		backgroundColor: AppColors.background,
		paddingHorizontal: AppSpacing.sm,
	},
	summaryTable: {
		width: "100%",
		borderBottomWidth: 1,
		borderBottomColor: "rgba(71, 85, 105, 0.18)",
		backgroundColor: AppColors.background,
		padding: AppSpacing.md,
	},
	summaryHeader: {
		minHeight: 34,
		justifyContent: "center",
	},
	summaryRow: {
		minHeight: 52,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: AppSpacing.md,
		borderBottomWidth: 1,
		borderBottomColor: "rgba(71, 85, 105, 0.14)",
	},
	summaryLabel: {
		flex: 1,
		minWidth: 0,
	},
	summaryValue: {
		textAlign: "right",
	},
	allowanceRow: {
		width: "100%",
		gap: AppSpacing.sm,
		paddingTop: AppSpacing.md,
	},
	allowanceHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: AppSpacing.sm,
	},
	allowanceBadges: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: AppSpacing.xs,
	},
});
