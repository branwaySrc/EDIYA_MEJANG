import { memo } from "react";
import { StyleSheet, View } from "react-native";

import { AppBadge } from "@/components/base/app-badge";
import { AppPressable } from "@/components/base/app-pressable";
import { AppText } from "@/components/base/app-text";
import { AppColors, AppSpacing } from "@/constants/theme";
import type { Employee } from "@/database/employee/employee.type";

export type EmployeeCardProps = {
	employee: Employee;
	onPress?: () => void;
};

function formatCardDate(value: string | null) {
	if (!value) {
		return "";
	}

	const date = new Date(value);

	if (Number.isNaN(date.getTime())) {
		return value;
	}

	return date.toLocaleDateString("ko-KR", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	});
}

export const EmployeeCard = memo(function EmployeeCard({ employee, onPress }: EmployeeCardProps) {
	const terminated = employee.employmentStatus === "terminated";
	const cardStyle = [styles.card, employee.owner && styles.ownerCard, terminated && styles.terminatedCard];
	const content = (
		<>
			<View style={styles.header}>
				<View style={styles.identity}>
					<AppText.Xs bold color={terminated ? "#B91C1C" : AppColors.primary} numberOfLines={1}>
						{terminated ? "이전 직원" : employee.owner ? "매장 운영" : employee.shiftGroup}
					</AppText.Xs>
					<AppText.Lg bold numberOfLines={1}>
						{employee.name}
					</AppText.Lg>
				</View>
				{employee.owner && <AppBadge tone="primary">사장</AppBadge>}
			</View>

			{terminated ? (
				<View style={styles.terminatedInfo}>
					<AppText.Xs bold color="#B91C1C">
						해고일
					</AppText.Xs>
					<AppText.Sm bold color="#B91C1C" numberOfLines={1}>
						{formatCardDate(employee.terminatedAt)}
					</AppText.Sm>
				</View>
			) : null}

			<View style={styles.contact}>
				<AppText.Xs bold color={AppColors.sub}>
					연락처
				</AppText.Xs>
				<AppText.Sm numberOfLines={1}>{employee.phonePublic ? employee.phone : "카카오톡"}</AppText.Sm>
			</View>

			<View style={styles.schedule}>
				<View style={styles.infoBlock}>
					<AppText.Xs bold color={AppColors.sub}>
						근무 시간
					</AppText.Xs>
					<AppText.Sm bold numberOfLines={1}>
						{employee.workTime}
					</AppText.Sm>
				</View>

				<View style={styles.infoBlock}>
					<AppText.Xs bold color={AppColors.sub}>
						근무 요일
					</AppText.Xs>
					<View style={styles.weekdayRow}>
						{employee.workDays.map(day => (
							<AppBadge key={day} tone="primary">
								{day}
							</AppBadge>
						))}
					</View>
				</View>
			</View>
		</>
	);

	if (onPress) {
		return (
			<AppPressable
				accessibilityLabel={`${employee.name} 직원 상세 보기`}
				accessibilityRole="button"
				onPress={onPress}
				pressedColor="rgba(0, 75, 147, 0.05)"
				radius="idle"
				style={cardStyle}
			>
				{content}
			</AppPressable>
		);
	}

	return <View style={cardStyle}>{content}</View>;
});

export default EmployeeCard;

const styles = StyleSheet.create({
	card: {
		width: "100%",
		minHeight: 204,
		borderWidth: 1,
		borderColor: "rgba(71, 85, 105, 0.28)",
		borderRadius: 8,
		backgroundColor: AppColors.background,
		padding: AppSpacing.md,
		gap: AppSpacing.sm,
	},
	ownerCard: {
		minHeight: 168,
		borderColor: "rgba(0, 75, 147, 0.42)",
		backgroundColor: "#F8FBFF",
	},
	terminatedCard: {
		borderColor: "rgba(185, 28, 28, 0.32)",
		backgroundColor: "#FFF7F7",
	},
	header: {
		flexDirection: "row",
		alignItems: "flex-start",
		justifyContent: "space-between",
		gap: AppSpacing.xs,
	},
	identity: {
		flex: 1,
		minWidth: 0,
		gap: 2,
	},
	contact: {
		gap: 2,
		borderBottomWidth: 1,
		borderBottomColor: "rgba(71, 85, 105, 0.18)",
		paddingBottom: AppSpacing.sm,
	},
	terminatedInfo: {
		gap: 2,
		borderBottomWidth: 1,
		borderBottomColor: "rgba(185, 28, 28, 0.16)",
		paddingBottom: AppSpacing.sm,
	},
	schedule: {
		flex: 1,
		justifyContent: "space-between",
		gap: AppSpacing.sm,
	},
	infoBlock: {
		gap: AppSpacing.xs,
	},
	weekdayRow: {
		flexDirection: "row",
		alignItems: "center",
		flexWrap: "wrap",
		gap: AppSpacing.xs,
	},
});
