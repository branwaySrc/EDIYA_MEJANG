import { StyleSheet, View } from "react-native";

import { AppBadge } from "@/components/base/app-badge";
import { AppIcon } from "@/components/base/app-icon";
import { AppPressable } from "@/components/base/app-pressable";
import { AppText } from "@/components/base/app-text";
import { formatWon } from "@/components/features/paid/paid-format";
import { AppColors, AppSpacing } from "@/constants/theme";
import { getPaidCustomerBalance, getRecentUsageDate } from "@/database/paid/paid-customer";
import type { PaidCustomer } from "@/database/paid/paid-customer.type";

export type PaidCustomerCardProps = {
	customer: PaidCustomer;
	onPressDetails: () => void;
};

export function PaidCustomerCard({ customer, onPressDetails }: PaidCustomerCardProps) {
	const balance = getPaidCustomerBalance(customer);
	const recentUsageDate = getRecentUsageDate(customer);
	const depleted = balance <= 0;

	return (
		<View style={[styles.card, depleted && styles.cardDepleted]}>
			<AppPressable
				accessibilityLabel={`${customer.name} 자세히보기`}
				onPress={onPressDetails}
				pressedColor="rgba(0, 75, 147, 0.04)"
				radius="base"
				style={styles.summary}
			>
				<View style={styles.summaryLeft}>
					<View style={styles.profileRow}>
						<AppText.Base bold numberOfLines={1}>
							{customer.name}
						</AppText.Base>
						<AppBadge size="xs" tone="primary">
							{customer.nickname}
						</AppBadge>
						<AppBadge tone="primary">{customer.affiliation}</AppBadge>
					</View>
					<View style={styles.balanceBlock}>
						<AppText.Xs bold color={AppColors.sub}>
							현재 잔액
						</AppText.Xs>
						<AppText.Xl bold color={AppColors.primary} numberOfLines={1}>
							{formatWon(balance)}
						</AppText.Xl>
					</View>
					<View style={styles.summaryDateRow}>
						<AppText.Sm bold color={AppColors.primary}>
							최초 선결제일
						</AppText.Sm>
						<AppText.Sm>{customer.firstPaidDate}</AppText.Sm>
					</View>
				</View>

				<View style={styles.summaryRight}>
					<View style={styles.summaryDateColumn}>
						<AppBadge style={styles.dateBadge}>최근 결제일</AppBadge>
						<AppText.Sm>{recentUsageDate}</AppText.Sm>
					</View>
					<View style={styles.detailAction}>
						<AppText.Sm bold color={AppColors.primary}>
							자세히보기
						</AppText.Sm>
						<AppIcon.Sm color={AppColors.primary} name="chevron-forward" pressable={false} />
					</View>
				</View>
			</AppPressable>
		</View>
	);
}

export default PaidCustomerCard;

const styles = StyleSheet.create({
	card: {
		width: "100%",
		borderWidth: 1,
		borderColor: "rgba(71, 85, 105, 0.34)",
		borderRadius: 8,
		backgroundColor: AppColors.background,
		overflow: "hidden",
		marginBottom: 14,
	},
	cardDepleted: {
		opacity: 0.5,
	},
	summary: {
		width: "100%",
		minHeight: 112,
		flexDirection: "row",
		justifyContent: "space-between",
		gap: AppSpacing.sm,
		backgroundColor: AppColors.background,
		paddingHorizontal: AppSpacing.md,
		paddingVertical: AppSpacing.sm,
	},
	summaryLeft: {
		flex: 1,
		minWidth: 0,
		justifyContent: "center",
		gap: AppSpacing.xs,
	},
	profileRow: {
		flexDirection: "row",
		alignItems: "center",
		flexWrap: "wrap",
		gap: AppSpacing.sm,
	},
	balanceBlock: {
		gap: 2,
	},
	summaryDateRow: {
		flexDirection: "row",
		alignItems: "center",
		flexWrap: "wrap",
		gap: AppSpacing.sm,
	},
	summaryRight: {
		width: 116,
		alignItems: "flex-end",
		justifyContent: "space-between",
		paddingVertical: 2,
	},
	summaryDateColumn: {
		alignItems: "flex-end",
		gap: AppSpacing.xs,
	},
	detailAction: {
		flexDirection: "row",
		alignItems: "center",
		gap: AppSpacing.xs,
	},
	dateBadge: {
		alignSelf: "flex-end",
	},
});
