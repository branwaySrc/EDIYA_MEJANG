import { memo } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { AppText } from "@/components/base/app-text";
import { attendanceStatusLabels, shiftColors } from "@/components/features/employee/attendance/attendance-ui";
import { AppColors, AppSpacing } from "@/constants/theme";
import type { AttendanceScheduleEntry } from "@/database/employee/attendance.type";
import { formatKoreaDateLabel, timeToMinutes } from "@/lib/korea-date";

export type TodayShiftTimelineProps = {
	entries: AttendanceScheduleEntry[];
	todayKey: string;
};

const storeOpenMinutes = 8 * 60;
const storeCloseMinutes = 21 * 60 + 30;
const timelineMinutes = storeCloseMinutes - storeOpenMinutes;
const nameColumnWidth = 94;
const timelineWidth = 720;
const timelineRightInset = 28;
const timelineContentWidth = nameColumnWidth + timelineWidth + timelineRightInset;
const timelineTicks = [
	{ label: "08:00", minutes: 8 * 60 },
	{ label: "10:00", minutes: 10 * 60 },
	{ label: "12:00", minutes: 12 * 60 },
	{ label: "14:00", minutes: 14 * 60 },
	{ label: "16:00", minutes: 16 * 60 },
	{ label: "18:00", minutes: 18 * 60 },
	{ label: "20:00", minutes: 20 * 60 },
	{ label: "21:30", minutes: 21 * 60 + 30 },
];

function getTimelinePosition(minutes: number) {
	return ((minutes - storeOpenMinutes) / timelineMinutes) * timelineWidth;
}

function ShiftTimelineRow({ entry }: { entry: AttendanceScheduleEntry }) {
	const scheduledStart = timeToMinutes(entry.scheduledStart);
	const scheduledEnd = timeToMinutes(entry.scheduledEnd);
	const visibleStart = Math.max(storeOpenMinutes, scheduledStart);
	const visibleEnd = Math.min(storeCloseMinutes, scheduledEnd);
	const barLeft = nameColumnWidth + getTimelinePosition(visibleStart);
	const barWidth = Math.max(12, getTimelinePosition(visibleEnd) - getTimelinePosition(visibleStart));

	return (
		<View style={styles.timelineRow}>
			<View style={styles.employeeColumn}>
				<View style={styles.employeeNameRow}>
					<View style={[styles.shiftDot, { backgroundColor: shiftColors[entry.shiftGroup] }]} />
					<AppText.Xs bold numberOfLines={1}>
						{entry.employeeName}
					</AppText.Xs>
				</View>
				<AppText.Xs color={AppColors.sub} numberOfLines={1}>
					{entry.scheduledStart}–{entry.scheduledEnd}
				</AppText.Xs>
			</View>

			<View style={styles.timelineTrack} />
			<View
				style={[
					styles.shiftBar,
					{
						left: barLeft,
						width: barWidth,
						backgroundColor: shiftColors[entry.shiftGroup],
						opacity: entry.status === "completed" ? 1 : entry.status === "missed" ? 0.42 : 0.68,
					},
				]}
			>
				<AppText.Xs bold color={AppColors.textOnPrimary} numberOfLines={1}>
					{attendanceStatusLabels[entry.status]}
				</AppText.Xs>
			</View>
		</View>
	);
}

export const TodayShiftTimeline = memo(function TodayShiftTimeline({ entries, todayKey }: TodayShiftTimelineProps) {
	const timedEntries = entries.filter(entry => Boolean(entry.scheduledStart && entry.scheduledEnd));

	return (
		<View style={styles.section}>
			<View style={styles.sectionHeader}>
				<View style={styles.sectionTitle}>
					<AppText.Lg bold>오늘 근무</AppText.Lg>
					<AppText.Xs color={AppColors.sub}>
						{formatKoreaDateLabel(todayKey)}
					</AppText.Xs>
				</View>
				<View style={styles.storeHours}>
					<AppText.Xs bold color={AppColors.primary}>
						08:00–21:30
					</AppText.Xs>
				</View>
			</View>

			{timedEntries.length === 0 ? (
				<View style={styles.emptyState}>
					<AppText.Sm color={AppColors.sub}>오늘 예정된 근무자가 없습니다.</AppText.Sm>
				</View>
			) : (
				<ScrollView
					contentContainerStyle={styles.horizontalContent}
					horizontal
					showsHorizontalScrollIndicator
					style={styles.horizontalScroll}
				>
					<View style={styles.timelineContent}>
						<View style={styles.axisRow}>
							{timelineTicks.map(tick => (
								<View
									key={tick.label}
									style={[styles.tickLabel, { left: nameColumnWidth + getTimelinePosition(tick.minutes) - 20 }]}
								>
									<AppText.Xs color={AppColors.sub}>{tick.label}</AppText.Xs>
								</View>
							))}
						</View>
						{timedEntries.map(entry => (
							<ShiftTimelineRow key={entry.id} entry={entry} />
						))}
					</View>
				</ScrollView>
			)}
		</View>
	);
});

export default TodayShiftTimeline;

const styles = StyleSheet.create({
	section: {
		width: "100%",
		backgroundColor: AppColors.background,
		borderBottomWidth: 1,
		borderBottomColor: "#E2E8F0",
		paddingTop: AppSpacing.md,
		paddingBottom: AppSpacing.md,
	},
	sectionHeader: {
		minHeight: 48,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: AppSpacing.sm,
		paddingHorizontal: AppSpacing.md,
		paddingBottom: AppSpacing.sm,
	},
	sectionTitle: {
		flex: 1,
		minWidth: 0,
		gap: 2,
	},
	storeHours: {
		minHeight: 28,
		alignItems: "center",
		justifyContent: "center",
		borderWidth: 1,
		borderColor: "rgba(0, 75, 147, 0.24)",
		borderRadius: 4,
		backgroundColor: "rgba(0, 75, 147, 0.08)",
		paddingHorizontal: AppSpacing.sm,
	},
	emptyState: {
		minHeight: 88,
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: AppSpacing.md,
	},
	horizontalScroll: {
		width: "100%",
	},
	horizontalContent: {
		paddingHorizontal: AppSpacing.md,
		paddingBottom: AppSpacing.xs,
	},
	timelineContent: {
		width: timelineContentWidth,
	},
	axisRow: {
		height: 28,
		position: "relative",
		marginLeft: 0,
	},
	tickLabel: {
		position: "absolute",
		top: 2,
		width: 44,
		alignItems: "center",
	},
	timelineRow: {
		width: timelineContentWidth,
		height: 52,
		justifyContent: "center",
		position: "relative",
		borderTopWidth: 1,
		borderTopColor: "#F1F5F9",
	},
	employeeColumn: {
		width: nameColumnWidth - AppSpacing.sm,
		gap: 1,
	},
	employeeNameRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: AppSpacing.xs,
	},
	shiftDot: {
		width: 6,
		height: 6,
		borderRadius: 3,
	},
	timelineTrack: {
		position: "absolute",
		left: nameColumnWidth,
		width: timelineWidth,
		height: 20,
		borderRadius: 4,
		backgroundColor: "#F1F5F9",
	},
	shiftBar: {
		position: "absolute",
		height: 20,
		alignItems: "center",
		justifyContent: "center",
		borderRadius: 4,
		paddingHorizontal: 3,
	},
});
