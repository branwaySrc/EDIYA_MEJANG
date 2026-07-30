import { type Href, useRouter } from "expo-router";
import { memo } from "react";
import { StyleSheet, View } from "react-native";

import { AppIcon } from "@/components/base/app-icon";
import { AppPressable } from "@/components/base/app-pressable";
import { AppText } from "@/components/base/app-text";
import { AppColors, AppSpacing } from "@/constants/theme";
import { useHiringContractStore } from "@/store/hiring-contract-store";

export const HiringCompleteView = memo(function HiringCompleteView() {
	const router = useRouter();
	const result = useHiringContractStore(state => state.result);
	const resetDraft = useHiringContractStore(state => state.resetDraft);

	const startNewHiring = () => {
		resetDraft();
		router.dismissTo("/sajang/hiring/register" as Href);
	};

	return (
		<View style={styles.container}>
			<View style={styles.completeCard}>
				<AppIcon.Xl color={AppColors.primary} name="checkmark-circle-outline" pressable={false} />
				<AppText.Xl bold color={AppColors.primary} style={styles.centerText}>
					계약서 처리가 완료됐어요
				</AppText.Xl>
				<AppText.Sm color={AppColors.sub} style={styles.centerText}>
					PDF는 태블릿 로컬 저장소에 저장되었고, 이메일 앱이 열렸다면 첨부된 계약서를 직접 발송하면 됩니다.
				</AppText.Sm>
			</View>

			<View style={styles.resultTable}>
				<View style={styles.row}>
					<AppText.Xs bold color={AppColors.sub} style={styles.label}>
						파일명
					</AppText.Xs>
					<AppText.Sm style={styles.value}>{result?.fileName ?? "생성된 파일 없음"}</AppText.Sm>
				</View>
				<View style={styles.row}>
					<AppText.Xs bold color={AppColors.sub} style={styles.label}>
						PDF 경로
					</AppText.Xs>
					<AppText.Sm style={styles.value}>{result?.pdfUri ?? "없음"}</AppText.Sm>
				</View>
				<View style={styles.row}>
					<AppText.Xs bold color={AppColors.sub} style={styles.label}>
						Storage
					</AppText.Xs>
					<AppText.Sm style={styles.value}>{result?.storagePath ?? "추후 업로드 예정"}</AppText.Sm>
				</View>
			</View>

			<View style={styles.actions}>
				<AppPressable onPress={() => router.dismissTo("/sajang/home" as Href)} pressedColor="rgba(0, 75, 147, 0.08)" radius="base" style={styles.secondaryButton}>
					<AppText.Base bold color={AppColors.primary}>
						사장님 공간
					</AppText.Base>
				</AppPressable>
				<AppPressable onPress={startNewHiring} pressedColor="#003E7A" radius="base" style={styles.primaryButton}>
					<AppText.Base bold color={AppColors.textOnPrimary}>
						신규고용 다시
					</AppText.Base>
				</AppPressable>
			</View>
		</View>
	);
});

export default HiringCompleteView;

const styles = StyleSheet.create({
	container: {
		width: "100%",
		gap: AppSpacing.md,
		padding: AppSpacing.md,
		paddingBottom: AppSpacing.xl,
	},
	completeCard: {
		minHeight: 220,
		alignItems: "center",
		justifyContent: "center",
		gap: AppSpacing.sm,
		borderWidth: 1,
		borderColor: "rgba(0, 75, 147, 0.24)",
		borderRadius: 8,
		backgroundColor: "#F8FAFC",
		padding: AppSpacing.md,
	},
	centerText: {
		textAlign: "center",
	},
	resultTable: {
		width: "100%",
		borderWidth: 1,
		borderColor: "rgba(71, 85, 105, 0.3)",
		borderRadius: 8,
		overflow: "hidden",
	},
	row: {
		minHeight: 42,
		flexDirection: "row",
		borderTopWidth: 1,
		borderColor: "rgba(71, 85, 105, 0.18)",
	},
	label: {
		width: 86,
		backgroundColor: "#F8FAFC",
		padding: AppSpacing.sm,
	},
	value: {
		flex: 1,
		padding: AppSpacing.sm,
	},
	actions: {
		flexDirection: "row",
		gap: AppSpacing.sm,
	},
	primaryButton: {
		flex: 1,
		minHeight: 50,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: AppColors.primary,
	},
	secondaryButton: {
		flex: 1,
		minHeight: 50,
		alignItems: "center",
		justifyContent: "center",
		borderWidth: 1,
		borderColor: AppColors.primary,
		backgroundColor: AppColors.background,
	},
});
