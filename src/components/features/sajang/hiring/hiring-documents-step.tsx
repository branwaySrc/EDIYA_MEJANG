import { type Href, useRouter } from "expo-router";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { AppIcon } from "@/components/base/app-icon";
import { AppPressable } from "@/components/base/app-pressable";
import { AppText } from "@/components/base/app-text";
import { HiringStepFrame } from "@/components/features/sajang/hiring/hiring-form-ui";
import { HiringScreenActions } from "@/components/features/sajang/hiring/hiring-screen-actions";
import { hiringDocumentKeys, hiringDocumentLabels, isDocumentChecklistReady } from "@/components/features/sajang/hiring/hiring-types";
import { AppColors, AppSpacing } from "@/constants/theme";
import { useHiringContractStore } from "@/store/hiring-contract-store";

export function HiringDocumentsStep() {
	const router = useRouter();
	const draft = useHiringContractStore(state => state.draft);
	const setDocumentChecked = useHiringContractStore(state => state.setDocumentChecked);
	const ready = useMemo(() => isDocumentChecklistReady(draft), [draft]);

	return (
		<HiringStepFrame step={3} title="필수 서류 등록" subtitle="실제 파일 첨부 전까지는 제출 확인 체크리스트로 관리합니다.">
			<View style={styles.checkList}>
				{hiringDocumentKeys.map(key => {
					const checked = draft.documents[key];

					return (
						<AppPressable
							key={key}
							accessibilityLabel={`${hiringDocumentLabels[key]} ${checked ? "해제" : "확인"}`}
							onPress={() => setDocumentChecked(key, !checked)}
							pressedColor="rgba(0, 75, 147, 0.08)"
							radius="base"
							style={[styles.checkRow, checked && styles.checkRowActive]}
						>
							<View style={[styles.checkIcon, checked && styles.checkIconActive]}>
								{checked && <AppIcon.Sm color={AppColors.textOnPrimary} name="checkmark" pressable={false} />}
							</View>
							<View style={styles.checkText}>
								<AppText.Base bold>{hiringDocumentLabels[key]}</AppText.Base>
								<AppText.Sm color={AppColors.sub}>제출 여부를 확인했습니다.</AppText.Sm>
							</View>
						</AppPressable>
					);
				})}
			</View>

			<HiringScreenActions
				primaryDisabled={!ready}
				primaryLabel="계약서 작성"
				onPressPrimary={() => router.push("/sajang/hiring/contract" as Href)}
				onPressSecondary={() => router.back()}
				secondaryLabel="이전"
			/>
		</HiringStepFrame>
	);
}

export default HiringDocumentsStep;

const styles = StyleSheet.create({
	checkList: {
		width: "100%",
		gap: AppSpacing.sm,
	},
	checkRow: {
		minHeight: 76,
		flexDirection: "row",
		alignItems: "center",
		gap: AppSpacing.md,
		borderWidth: 1,
		borderColor: "rgba(71, 85, 105, 0.24)",
		backgroundColor: AppColors.background,
		padding: AppSpacing.md,
	},
	checkRowActive: {
		borderColor: AppColors.primary,
		backgroundColor: "#F8FBFF",
	},
	checkIcon: {
		width: 28,
		height: 28,
		alignItems: "center",
		justifyContent: "center",
		borderWidth: 1,
		borderColor: "rgba(71, 85, 105, 0.32)",
		borderRadius: 4,
	},
	checkIconActive: {
		borderColor: AppColors.primary,
		backgroundColor: AppColors.primary,
	},
	checkText: {
		flex: 1,
		minWidth: 0,
		gap: AppSpacing.xs,
	},
});
