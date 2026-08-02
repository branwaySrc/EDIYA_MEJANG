import { memo } from "react";
import { StyleSheet, View } from "react-native";

import { AppPressable } from "@/components/base/app-pressable";
import { AppText } from "@/components/base/app-text";
import {
	attendanceStatusLabels,
	formatMinutesAsNumericHours,
} from "@/components/features/employee/attendance/attendance-ui";
import { AppColors, AppSpacing } from "@/constants/theme";
import type { AttendanceScheduleEntry, AttendanceStatus } from "@/database/employee/attendance.type";
import { parseDateKey, type CalendarDay } from "@/lib/korea-date";

type AttendanceCalendarGridProps = {
	days: CalendarDay[];
	entriesByDate: Map<string, AttendanceScheduleEntry[]>;
	mode: "month" | "period";
	onPressDate: (dateKey: string) => void;
	showOutsideMonthDates?: boolean;
	todayKey: string;
};

export const attendanceWeekdayLabels = ["일", "월", "화", "수", "목", "금", "토"] as const;

function getStatusBadgeStyle(status: AttendanceStatus) {
	switch (status) {
		case "completed":
			return styles.completedBadge;
		case "missed":
			return styles.missedBadge;
		case "scheduled":
		default:
			return styles.scheduledBadge;
	}
}

function getStatusTextColor(status: AttendanceStatus) {
	return status === "completed" ? AppColors.textOnPrimary : status === "missed" ? AppColors.sub : AppColors.primary;
}

function getPrimaryWorkMinutes(entry: AttendanceScheduleEntry) {
	if (entry.substituteEmployeeId) {
		return 0;
	}

	return entry.status === "completed"
		? entry.confirmedWorkMinutes ?? entry.scheduledMinutes
		: entry.scheduledMinutes;
}

function getSubstituteWorkMinutes(entry: AttendanceScheduleEntry) {
	return entry.status === "completed"
		? entry.substituteConfirmedWorkMinutes ?? entry.scheduledMinutes
		: entry.scheduledMinutes;
}

function formatEmployeeBadgeLabel(name: string, minutes: number) {
	return `${name}(${formatMinutesAsNumericHours(minutes)})`;
}

function CalendarDayCell({
	day,
	entries,
	mode,
	onPress,
	showOutsideMonthDates,
	todayKey,
}: {
	day: CalendarDay;
	entries: AttendanceScheduleEntry[];
	mode: AttendanceCalendarGridProps["mode"];
	onPress: () => void;
	showOutsideMonthDates: boolean;
	todayKey: string;
}) {
	const today = day.dateKey === todayKey;
	const outsideMonth = !day.inCurrentMonth;
	const highlightedToday = today && !outsideMonth;
	const disabled = outsideMonth;
	const visibleEntries = outsideMonth && !showOutsideMonthDates ? [] : entries;
	const { month } = parseDateKey(day.dateKey);
	const dateLabel = mode === "period" && outsideMonth ? `${month}/${day.day}` : day.day;
	const accessibilitySummary =
		visibleEntries.length === 0
			? `${day.dateKey}, 근무 일정 없음${outsideMonth ? ", 읽기 전용" : ""}`
			: `${day.dateKey}, ${visibleEntries.length}명의 근무 일정${outsideMonth ? ", 읽기 전용" : ""}`;

	return (
		<AppPressable
			accessibilityLabel={accessibilitySummary}
			accessibilityRole="button"
			disabled={disabled}
			onPress={onPress}
			pressedColor="rgba(180, 35, 24, 0.08)"
			radius="idle"
			style={[
				styles.dayCell,
				mode === "period" && styles.periodDayCell,
				outsideMonth && styles.outsideMonthCell,
				highlightedToday && styles.todayCell,
			]}
		>
			<View style={styles.dateRow}>
				<AppText.Xs
					bold={highlightedToday}
					color={
						highlightedToday
							? "#B42318"
							: disabled
								? AppColors.placeholder
								: day.weekday === "일"
									? "#B42318"
									: day.weekday === "토"
										? AppColors.primary
										: AppColors.text
					}
				>
					{dateLabel}
				</AppText.Xs>
			</View>

			<View style={[styles.badgeList, outsideMonth && styles.readOnlyBadgeList]}>
				{visibleEntries.map(entry => {
					const hasSubstitute = Boolean(entry.substituteEmployeeId && entry.substituteEmployeeName);

					return (
						<View
							key={entry.id}
							style={[
								styles.attendanceBadge,
								hasSubstitute ? styles.substitutedAttendanceBadge : getStatusBadgeStyle(entry.status),
							]}
						>
							<AppText.Xs
								bold={entry.status === "completed" && !hasSubstitute}
								color={hasSubstitute ? AppColors.sub : getStatusTextColor(entry.status)}
								numberOfLines={1}
								style={hasSubstitute ? styles.replacedEmployeeText : undefined}
							>
								{formatEmployeeBadgeLabel(entry.employeeName, getPrimaryWorkMinutes(entry))}
							</AppText.Xs>
							{hasSubstitute && (
								<View style={styles.substituteNameBadge}>
									<AppText.Xs bold color={AppColors.textOnPrimary} numberOfLines={1}>
										{formatEmployeeBadgeLabel(entry.substituteEmployeeName ?? "", getSubstituteWorkMinutes(entry))}
									</AppText.Xs>
								</View>
							)}
						</View>
					);
				})}
			</View>
		</AppPressable>
	);
}

export const AttendanceCalendarLegend = memo(function AttendanceCalendarLegend() {
	return (
		<View style={styles.legend}>
			{(["scheduled", "completed", "missed"] as const).map(status => (
				<View key={status} style={styles.legendItem}>
					<View style={[styles.legendSwatch, getStatusBadgeStyle(status)]} />
					<AppText.Xs color={AppColors.sub}>{attendanceStatusLabels[status]}</AppText.Xs>
				</View>
			))}
			<View style={styles.legendItem}>
				<View style={[styles.legendSwatch, styles.substituteLegendSwatch]} />
				<AppText.Xs color={AppColors.sub}>대타</AppText.Xs>
			</View>
		</View>
	);
});

export const AttendanceCalendarGrid = memo(function AttendanceCalendarGrid({
	days,
	entriesByDate,
	mode,
	onPressDate,
	showOutsideMonthDates = false,
	todayKey,
}: AttendanceCalendarGridProps) {
	return (
		<View style={styles.calendarFrame}>
			<View style={styles.weekdayRow}>
				{attendanceWeekdayLabels.map((weekday, index) => (
					<View key={weekday} style={styles.weekdayCell}>
						<AppText.Xs
							bold
							color={index === 0 ? "#B42318" : index === 6 ? AppColors.primary : AppColors.sub}
						>
							{weekday}
						</AppText.Xs>
					</View>
				))}
			</View>
			<View style={styles.dayGrid}>
				{days.map(day => (
					<CalendarDayCell
						key={day.dateKey}
						day={day}
						entries={entriesByDate.get(day.dateKey) ?? []}
						mode={mode}
						onPress={() => onPressDate(day.dateKey)}
						showOutsideMonthDates={showOutsideMonthDates}
						todayKey={todayKey}
					/>
				))}
			</View>
		</View>
	);
});

const styles = StyleSheet.create({
	legend: {
		minHeight: 34,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "flex-end",
		flexWrap: "wrap",
		columnGap: AppSpacing.md,
		rowGap: AppSpacing.xs,
		paddingBottom: AppSpacing.sm,
	},
	legendItem: {
		flexDirection: "row",
		alignItems: "center",
		gap: AppSpacing.xs,
	},
	legendSwatch: {
		width: 12,
		height: 12,
		borderRadius: 2,
	},
	calendarFrame: {
		width: "100%",
		borderTopWidth: 1,
		borderLeftWidth: 1,
		borderColor: "#CBD5E1",
	},
	weekdayRow: {
		width: "100%",
		flexDirection: "row",
	},
	weekdayCell: {
		width: "14.285714%",
		minHeight: 32,
		alignItems: "center",
		justifyContent: "center",
		borderRightWidth: 1,
		borderBottomWidth: 1,
		borderColor: "#CBD5E1",
		backgroundColor: "#F8FAFC",
	},
	dayGrid: {
		width: "100%",
		flexDirection: "row",
		flexWrap: "wrap",
	},
	dayCell: {
		width: "14.285714%",
		height: 140,
		borderRightWidth: 1,
		borderBottomWidth: 1,
		borderColor: "#CBD5E1",
		backgroundColor: AppColors.background,
		paddingHorizontal: 1,
		paddingVertical: 4,
	},
	periodDayCell: {
		height: 156,
	},
	outsideMonthCell: {
		backgroundColor: "#E2E8F0",
	},
	todayCell: {
		backgroundColor: "#FEE2E2",
	},
	dateRow: {
		minHeight: 20,
		alignItems: "flex-start",
		justifyContent: "center",
		paddingHorizontal: 2,
	},
	badgeList: {
		width: "100%",
		gap: 2,
	},
	readOnlyBadgeList: {
		opacity: 0.52,
	},
	attendanceBadge: {
		width: "100%",
		minHeight: 17,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 0,
		borderRadius: 2,
		paddingHorizontal: 2,
	},
	substitutedAttendanceBadge: {
		minHeight: 38,
		flexDirection: "column",
		alignItems: "stretch",
		backgroundColor: "#FFF1F0",
		paddingHorizontal: 1,
		paddingVertical: 1,
	},
	replacedEmployeeText: {
		width: "100%",
		textAlign: "center",
		textDecorationLine: "line-through",
	},
	substituteNameBadge: {
		width: "100%",
		minHeight: 17,
		alignItems: "center",
		justifyContent: "center",
		borderRadius: 2,
		backgroundColor: "#C2413B",
		paddingHorizontal: 1,
	},
	scheduledBadge: {
		backgroundColor: "rgba(0, 75, 147, 0.1)",
	},
	completedBadge: {
		backgroundColor: AppColors.primary,
	},
	substituteLegendSwatch: {
		backgroundColor: "#C2413B",
	},
	missedBadge: {
		borderWidth: 1,
		borderColor: "rgba(71, 85, 105, 0.28)",
		backgroundColor: "rgba(71, 85, 105, 0.08)",
	},
});
