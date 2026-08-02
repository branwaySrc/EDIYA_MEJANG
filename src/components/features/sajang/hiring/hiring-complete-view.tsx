import { type Href, useRouter } from "expo-router";
import { memo } from "react";
import { StyleSheet, View } from "react-native";

import { AppIcon } from "@/components/base/app-icon";
import { AppPressable } from "@/components/base/app-pressable";
import { AppText } from "@/components/base/app-text";
import { HiringStepFrame } from "@/components/features/sajang/hiring/hiring-form-ui";
import { AppColors, AppSpacing } from "@/constants/theme";
import { useHiringContractStore } from "@/store/hiring-contract-store";

export const HiringCompleteView = memo(function HiringCompleteView() {
	const router = useRouter();
	const result = useHiringContractStore(state => state.result);
	const contracts = useHiringContractStore(state => state.contracts);
	const resetDraft = useHiringContractStore(state => state.resetDraft);

	const goToStart = () => {
		resetDraft();
		router.dismissTo("/sajang/home" as Href);
	};

	return (
		<HiringStepFrame
			step={7}
			title="PDF 저장 및 직원 등록 완료"
			subtitle="PDF 파일은 다운로드 폴더에 저장되고, 계약서 기록은 앱 로컬 저장소에 보관됩니다."
		>
			<View style={styles.completeCard}>
				<AppIcon.Xl color={AppColors.primary} name="checkmark-circle-outline" pressable={false} />
				<AppText.Xl bold color={AppColors.primary} style={styles.centerText}>
					신규고용 처리가 완료되었습니다
				</AppText.Xl>
				<AppText.Sm color={AppColors.sub} style={styles.centerText}>
					파일 관리자에서 바로 확인할 수 있도록 선택한 다운로드 폴더에 PDF가 저장되었습니다.
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
						PDF
					</AppText.Xs>
					<AppText.Sm style={styles.value}>{result?.pdfUri ?? "없음"}</AppText.Sm>
				</View>
				<View style={styles.row}>
					<AppText.Xs bold color={AppColors.sub} style={styles.label}>
						저장 위치
					</AppText.Xs>
					<AppText.Sm style={styles.value}>{result?.storagePath ?? "없음"}</AppText.Sm>
				</View>
				<View style={styles.row}>
					<AppText.Xs bold color={AppColors.sub} style={styles.label}>
						기록 저장
					</AppText.Xs>
					<AppText.Sm style={styles.value}>앱 로컬 스토리지 / {contracts.length}건</AppText.Sm>
				</View>
				<View style={styles.row}>
					<AppText.Xs bold color={AppColors.sub} style={styles.label}>
						Metadata
					</AppText.Xs>
					<AppText.Sm style={styles.value}>{result?.metadataUri ?? "없음"}</AppText.Sm>
				</View>
			</View>

			<View style={styles.actions}>
				<AppPressable onPress={goToStart} pressedColor="#003E7A" radius="base" style={styles.primaryButton}>
					<AppText.Base bold color={AppColors.textOnPrimary}>
						처음으로 가기
					</AppText.Base>
				</AppPressable>
			</View>
		</HiringStepFrame>
	);
});

export default HiringCompleteView;

const styles = StyleSheet.create({
	completeCard: {
		minHeight: 210,
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
		width: "100%",
	},
	primaryButton: {
		width: "100%",
		minHeight: 56,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: AppColors.primary,
	},
});
