import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/base/app-text";
import {
	formatAttendanceRate,
	formatMinutesAsHours,
} from "@/components/features/employee/attendance/attendance-ui";
import { AppColors, AppSpacing } from "@/constants/theme";
import type { EmployeeAttendanceSummary } from "@/database/employee/attendance.type";

type SummaryMetricProps = {
	label: string;
	value: string;
};

export type AttendanceSummaryMetricsProps = {
	attendanceRateLabel: string;
	summary: EmployeeAttendanceSummary;
};

function SummaryMetric({ label, value }: SummaryMetricProps) {
	return (
		<View style={styles.metric}>
			<AppText.Xs color={AppColors.sub}>{label}</AppText.Xs>
			<AppText.Lg bold color={AppColors.primary}>
				{value}
			</AppText.Lg>
		</View>
	);
}

export function AttendanceSummaryMetrics({
	attendanceRateLabel,
	summary,
}: AttendanceSummaryMetricsProps) {
	return (
		<View style={styles.grid}>
			<SummaryMetric
				label="월 계약시간"
				value={formatMinutesAsHours(summary.contractedMinutes)}
			/>
			<SummaryMetric
				label={attendanceRateLabel}
				value={formatAttendanceRate(summary.attendanceRate)}
			/>
			<SummaryMetric
				label="완료 근무"
				value={`${summary.completedShiftCount}/${summary.elapsedShiftCount}회`}
			/>
			<SummaryMetric
				label="미달 시간"
				value={formatMinutesAsHours(summary.missedMinutes)}
			/>
			<SummaryMetric
				label="대타 근무"
				value={`${summary.substituteShiftCount}회`}
			/>
			<SummaryMetric
				label="누적 대타 시간"
				value={formatMinutesAsHours(summary.substituteMinutes)}
			/>
		</View>
	);
}

export default AttendanceSummaryMetrics;

const styles = StyleSheet.create({
	grid: {
		width: "100%",
		flexDirection: "row",
		flexWrap: "wrap",
		justifyContent: "space-between",
		rowGap: AppSpacing.sm,
	},
	metric: {
		width: "48.5%",
		minHeight: 84,
		justifyContent: "center",
		gap: AppSpacing.xs,
		borderWidth: 1,
		borderColor: "#CBD5E1",
		borderRadius: 8,
		backgroundColor: AppColors.background,
		padding: AppSpacing.md,
	},
});
