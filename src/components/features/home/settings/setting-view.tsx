import { StyleSheet, View } from "react-native";

import { AppIcon } from "@/components/base/app-icon";
import { AppPressable } from "@/components/base/app-pressable";
import { AppSpacer } from "@/components/base/app-spacer";
import { AppText } from "@/components/base/app-text";
import { AppColors, AppSpacing } from "@/constants/theme";

const recipeVersion = "v0.1.0";
const recipeUpdatedAt = "업데이트 이력 없음";

export function SettingView() {
	return (
		<View style={styles.container}>
			<View style={styles.section}>
				<AppText.Sm bold color={AppColors.primary}>
					레시피 데이터
				</AppText.Sm>

				<AppPressable
					accessibilityLabel="레시피 최신화 업데이트"
					pressedColor="#003E7A"
					radius="base"
					style={styles.updateButton}
				>
					<AppIcon.Base color={AppColors.textOnPrimary} name="cloud-download-outline" pressable={false} />
					<AppText.Base bold color={AppColors.textOnPrimary}>
						레시피 최신화 업데이트
					</AppText.Base>
				</AppPressable>

				<View style={styles.metaBox}>
					<View style={styles.metaRow}>
						<AppText.Sm color={AppColors.sub}>현재 버전</AppText.Sm>
						<AppText.Sm bold>{recipeVersion}</AppText.Sm>
					</View>
					<AppSpacer style={styles.metaSpacer} />
					<View style={styles.metaRow}>
						<AppText.Sm color={AppColors.sub}>최근 업데이트</AppText.Sm>
						<AppText.Sm bold>{recipeUpdatedAt}</AppText.Sm>
					</View>
				</View>
			</View>
		</View>
	);
}

export default SettingView;

const styles = StyleSheet.create({
	container: {
		width: "100%",
	},
	section: {
		width: "100%",
		gap: AppSpacing.md,
	},
	updateButton: {
		width: "100%",
		minHeight: 52,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: AppSpacing.sm,
		backgroundColor: AppColors.primary,
		paddingHorizontal: AppSpacing.md,
	},
	metaBox: {
		width: "100%",
		borderWidth: 1,
		borderColor: "rgba(71, 85, 105, 0.18)",
		borderRadius: 4,
		backgroundColor: AppColors.background,
	},
	metaRow: {
		minHeight: 44,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: AppSpacing.md,
		paddingHorizontal: AppSpacing.md,
	},
	metaSpacer: {
		opacity: 0.18,
	},
});
