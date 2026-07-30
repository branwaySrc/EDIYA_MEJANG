import { StyleSheet, View } from "react-native";

import { AppIcon } from "@/components/base/app-icon";
import { AppPressable } from "@/components/base/app-pressable";
import { AppText } from "@/components/base/app-text";
import { AppColors, AppSpacing } from "@/constants/theme";
import type { ManualCategory } from "@/database/manual/manual.type";

export type ManualItemProps = {
	category: ManualCategory;
	onPress: () => void;
};

export function ManualItem({ category, onPress }: ManualItemProps) {
	return (
		<AppPressable
			accessibilityLabel={`${category.title} 메뉴얼 보기`}
			accessibilityRole="button"
			onPress={onPress}
			pressedColor="rgba(0, 75, 147, 0.04)"
			radius="base"
			style={styles.item}
		>
			<View style={styles.leading}>
				<View style={styles.iconBox}>
					<AppIcon.Base color={AppColors.primary} name={category.icon} pressable={false} />
				</View>
				<AppText.Lg bold numberOfLines={1} style={styles.title}>
					{category.title}
				</AppText.Lg>
			</View>

			<AppIcon.Base color={AppColors.sub} name="chevron-forward" pressable={false} />
		</AppPressable>
	);
}

export default ManualItem;

const styles = StyleSheet.create({
	item: {
		width: "100%",
		minHeight: 70,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: AppSpacing.md,
		borderWidth: 1,
		borderColor: "rgba(71, 85, 105, 0.24)",
		backgroundColor: AppColors.background,
		paddingHorizontal: AppSpacing.md,
		paddingVertical: AppSpacing.sm,
	},
	leading: {
		flex: 1,
		minWidth: 0,
		flexDirection: "row",
		alignItems: "center",
		gap: AppSpacing.md,
	},
	iconBox: {
		width: 42,
		height: 42,
		alignItems: "center",
		justifyContent: "center",
		borderRadius: 4,
		backgroundColor: "rgba(0, 75, 147, 0.08)",
	},
	title: {
		flex: 1,
		minWidth: 0,
	},
});
