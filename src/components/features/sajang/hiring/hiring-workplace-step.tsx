import { type Href, useRouter } from "expo-router";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { AppIcon } from "@/components/base/app-icon";
import { AppPressable } from "@/components/base/app-pressable";
import { AppText } from "@/components/base/app-text";
import { HiringStepFrame } from "@/components/features/sajang/hiring/hiring-form-ui";
import { HiringScreenActions } from "@/components/features/sajang/hiring/hiring-screen-actions";
import { isWorkplaceReady } from "@/components/features/sajang/hiring/hiring-types";
import { AppColors, AppSpacing } from "@/constants/theme";
import { hiringWorkplaces } from "@/database/sajang/workplace";
import { useHiringContractStore } from "@/store/hiring-contract-store";

export function HiringWorkplaceStep() {
	const router = useRouter();
	const draft = useHiringContractStore(state => state.draft);
	const selectWorkplace = useHiringContractStore(state => state.selectWorkplace);
	const ready = useMemo(() => isWorkplaceReady(draft), [draft]);

	return (
		<HiringStepFrame step={2} title="근무지 선택" subtitle="선택한 매장 정보는 계약서의 사업장 정보로 자동 연결됩니다.">
			<View style={styles.optionList}>
				{hiringWorkplaces.map(workplace => {
					const active = draft.selectedWorkplaceId === workplace.id;

					return (
						<AppPressable
							key={workplace.id}
							accessibilityLabel={`${workplace.name} 선택`}
							onPress={() => selectWorkplace(workplace)}
							pressedColor="rgba(0, 75, 147, 0.08)"
							radius="base"
							style={[styles.optionCard, active && styles.optionCardActive]}
						>
							<View style={styles.optionHeader}>
								<View style={styles.optionText}>
									<AppText.Base bold color={active ? AppColors.primary : AppColors.text}>
										{workplace.name}
									</AppText.Base>
									<AppText.Sm color={AppColors.sub}>{workplace.address}</AppText.Sm>
									<AppText.Sm color={AppColors.sub}>{workplace.phone}</AppText.Sm>
								</View>
								<AppIcon.Base color={active ? AppColors.primary : AppColors.placeholder} name={active ? "checkmark-circle" : "ellipse-outline"} pressable={false} />
							</View>
						</AppPressable>
					);
				})}
			</View>

			<HiringScreenActions
				primaryDisabled={!ready}
				primaryLabel="필수 서류 등록"
				onPressPrimary={() => router.push("/sajang/hiring/documents" as Href)}
				onPressSecondary={() => router.back()}
				secondaryLabel="이전"
			/>
		</HiringStepFrame>
	);
}

export default HiringWorkplaceStep;

const styles = StyleSheet.create({
	optionList: {
		width: "100%",
		gap: AppSpacing.sm,
	},
	optionCard: {
		width: "100%",
		borderWidth: 1,
		borderColor: "rgba(71, 85, 105, 0.24)",
		backgroundColor: AppColors.background,
		padding: AppSpacing.md,
	},
	optionCardActive: {
		borderWidth: 2,
		borderColor: AppColors.primary,
		backgroundColor: "#F8FBFF",
	},
	optionHeader: {
		flexDirection: "row",
		alignItems: "center",
		gap: AppSpacing.sm,
	},
	optionText: {
		flex: 1,
		minWidth: 0,
		gap: AppSpacing.xs,
	},
});
