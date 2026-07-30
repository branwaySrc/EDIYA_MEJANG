import { type Href, useRouter } from "expo-router";
import { memo, useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { AppBadge } from "@/components/base/app-badge";
import { AppText } from "@/components/base/app-text";
import { createHiringSummary } from "@/components/features/sajang/hiring/hiring-contract-template";
import { HiringScreenActions } from "@/components/features/sajang/hiring/hiring-screen-actions";
import { AppColors, AppSpacing } from "@/constants/theme";
import { useHiringContractStore } from "@/store/hiring-contract-store";

export const HiringSummaryView = memo(function HiringSummaryView() {
	const router = useRouter();
	const draft = useHiringContractStore(state => state.draft);
	const summaryRows = useMemo(() => createHiringSummary(draft), [draft]);

	return (
		<View style={styles.container}>
			<View style={styles.noticeBox}>
				<AppText.Lg bold color={AppColors.primary}>
					주요 내용을 다시 확인해 주세요
				</AppText.Lg>
				<AppText.Sm color={AppColors.sub}>직원이 서명하기 전에 근무 조건과 급여, 유의사항을 한 번 더 확인하는 단계입니다.</AppText.Sm>
			</View>

			<View style={styles.summaryTable}>
				{summaryRows.map(row => (
					<View key={row.label} style={styles.summaryRow}>
						<View style={styles.summaryLabel}>
							<AppText.Xs bold color={AppColors.sub}>
								{row.label}
							</AppText.Xs>
						</View>
						<View style={styles.summaryValue}>
							<AppText.Sm>{row.value}</AppText.Sm>
						</View>
					</View>
				))}
			</View>

			<View style={styles.badgeRow}>
				<AppBadge tone="primary">PDF 로컬 저장</AppBadge>
				<AppBadge tone="primary">이메일 앱 발송</AppBadge>
				<AppBadge>Storage 연동 예정</AppBadge>
			</View>

			<HiringScreenActions
				primaryLabel="서명하기"
				onPressPrimary={() => router.push("/sajang/hiring/signature" as Href)}
				onPressSecondary={() => router.back()}
				secondaryLabel="이전"
			/>
		</View>
	);
});

export default HiringSummaryView;

const styles = StyleSheet.create({
	container: {
		width: "100%",
		gap: AppSpacing.md,
		padding: AppSpacing.md,
		paddingBottom: AppSpacing.xl,
	},
	noticeBox: {
		gap: AppSpacing.xs,
		borderWidth: 1,
		borderColor: "rgba(0, 75, 147, 0.24)",
		borderRadius: 8,
		backgroundColor: "#F8FAFC",
		padding: AppSpacing.md,
	},
	summaryTable: {
		width: "100%",
		borderWidth: 1,
		borderColor: "rgba(71, 85, 105, 0.3)",
		borderRadius: 8,
		overflow: "hidden",
	},
	summaryRow: {
		minHeight: 42,
		flexDirection: "row",
		borderTopWidth: 1,
		borderColor: "rgba(71, 85, 105, 0.18)",
	},
	summaryLabel: {
		width: 92,
		justifyContent: "center",
		borderRightWidth: 1,
		borderColor: "rgba(71, 85, 105, 0.24)",
		backgroundColor: "#F8FAFC",
		paddingHorizontal: AppSpacing.sm,
	},
	summaryValue: {
		flex: 1,
		justifyContent: "center",
		paddingHorizontal: AppSpacing.sm,
		paddingVertical: AppSpacing.sm,
	},
	badgeRow: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: AppSpacing.xs,
	},
});
