import { type Href, useRouter } from "expo-router";
import { memo, useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/base/app-text";
import { createHiringSummary } from "@/components/features/sajang/hiring/hiring-contract-template";
import { HiringStepFrame } from "@/components/features/sajang/hiring/hiring-form-ui";
import { HiringScreenActions } from "@/components/features/sajang/hiring/hiring-screen-actions";
import { AppColors, AppSpacing } from "@/constants/theme";
import { useHiringContractStore } from "@/store/hiring-contract-store";

export const HiringSummaryView = memo(function HiringSummaryView() {
	const router = useRouter();
	const draft = useHiringContractStore(state => state.draft);
	const summaryRows = useMemo(() => createHiringSummary(draft), [draft]);

	return (
		<HiringStepFrame step={6} title="계약서 요약" subtitle="현재 작성된 계약 정보를 다시 확인합니다.">
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

			<HiringScreenActions
				primaryLabel="서명하기"
				onPressPrimary={() => router.push("/sajang/hiring/signature" as Href)}
				onPressSecondary={() => router.back()}
				secondaryLabel="이전"
			/>
		</HiringStepFrame>
	);
});

export default HiringSummaryView;

const styles = StyleSheet.create({
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
		width: 96,
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
});
