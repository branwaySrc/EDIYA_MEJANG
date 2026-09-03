import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/base/app-text";
import { AppColors, AppSpacing } from "@/constants/theme";
import type { AttendanceScheduleEntry } from "@/database/employee/attendance.type";
import { parseDateKey } from "@/lib/korea-date";

export type TemporaryWorkerSummaryItem = {
	amount: number;
	count: number;
	hourlyWage: number;
	minutes: number;
	name: string;
	temporaryWorkerId: string;
	weekIndex: number;
};

function getMonthWeekIndex(dateKey: string) {
	const { day, month, year } = parseDateKey(dateKey);
	const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();

	return Math.floor((firstWeekday + day - 1) / 7) + 1;
}

function formatWorkMinutes(totalMinutes: number) {
	const hours = Math.floor(totalMinutes / 60);
	const minutes = totalMinutes % 60;

	if (hours === 0) {
		return `${minutes}분`;
	}

	return minutes === 0 ? `${hours}시간` : `${hours}시간 ${minutes}분`;
}

function formatAmount(amount: number) {
	return `${Math.round(amount).toLocaleString("ko-KR")}원`;
}

export function buildTemporaryWorkerSummaries(entries: AttendanceScheduleEntry[]) {
	const summaryByWorkerAndWeek = new Map<string, TemporaryWorkerSummaryItem>();

	for (const entry of entries) {
		if (entry.status !== "completed" || !entry.temporaryWorkerId || !entry.temporaryWorkerName) {
			continue;
		}

		const minutes = entry.substituteConfirmedWorkMinutes ?? entry.scheduledMinutes;
		const hourlyWage = entry.substituteHourlyWageSnapshot ?? 0;
		const weekIndex = getMonthWeekIndex(entry.workDate);
		const key = `${entry.temporaryWorkerId}:${weekIndex}`;
		const current = summaryByWorkerAndWeek.get(key);

		summaryByWorkerAndWeek.set(key, {
			amount: (current?.amount ?? 0) + (minutes / 60) * hourlyWage,
			count: (current?.count ?? 0) + 1,
			hourlyWage,
			minutes: (current?.minutes ?? 0) + minutes,
			name: entry.temporaryWorkerName,
			temporaryWorkerId: entry.temporaryWorkerId,
			weekIndex,
		});
	}

	return [...summaryByWorkerAndWeek.values()].sort(
		(left, right) => left.weekIndex - right.weekIndex || left.name.localeCompare(right.name, "ko"),
	);
}

export function TemporaryWorkerSummarySection({ items }: { items: TemporaryWorkerSummaryItem[] }) {
	return (
		<View style={styles.section}>
			<View style={styles.header}>
				<AppText.Sm bold color={AppColors.sub}>
					임시근로자
				</AppText.Sm>
				<AppText.Xs color={AppColors.sub}>실제 근무 기준</AppText.Xs>
			</View>
			{items.length === 0 ? (
				<AppText.Sm color="#94A3B8">임시근로 내역이 없습니다</AppText.Sm>
			) : (
				<View style={styles.list}>
					{items.map(item => (
						<View key={`${item.temporaryWorkerId}-${item.weekIndex}`} style={styles.card}>
							<View style={styles.cardHeader}>
								<AppText.Sm bold>{item.name}</AppText.Sm>
								<AppText.Xs bold color={AppColors.primary}>
									{item.weekIndex}주차 · {item.count}회
								</AppText.Xs>
							</View>
							<View style={styles.details}>
								<AppText.Xs color={AppColors.sub}>시급 {formatAmount(item.hourlyWage)}</AppText.Xs>
								<AppText.Xs color={AppColors.sub}>근무 {formatWorkMinutes(item.minutes)}</AppText.Xs>
								<AppText.Xs bold color={AppColors.primary}>지급 {formatAmount(item.amount)}</AppText.Xs>
							</View>
						</View>
					))}
				</View>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	section: {
		width: "100%",
		gap: AppSpacing.sm,
		borderTopWidth: 1,
		borderTopColor: "rgba(71, 85, 105, 0.14)",
		paddingTop: AppSpacing.md,
		marginTop: AppSpacing.md,
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: AppSpacing.sm,
	},
	list: {
		gap: AppSpacing.sm,
	},
	card: {
		gap: AppSpacing.xs,
		borderWidth: 1,
		borderColor: "#D7E4F0",
		borderRadius: 4,
		backgroundColor: "#F5F9FD",
		padding: AppSpacing.sm,
	},
	cardHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: AppSpacing.sm,
	},
	details: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		flexWrap: "wrap",
		columnGap: AppSpacing.md,
		rowGap: AppSpacing.xs,
	},
});
