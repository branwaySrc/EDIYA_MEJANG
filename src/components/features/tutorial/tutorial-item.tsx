import { StyleSheet, View } from "react-native";

import { AppIcon } from "@/components/base/app-icon";
import { AppPressable } from "@/components/base/app-pressable";
import { AppText } from "@/components/base/app-text";
import { AppColors, AppSpacing } from "@/constants/theme";
import type { TutorialTopic } from "@/database/tutorial/tutorial.type";

export type TutorialItemProps = {
	onPress: () => void;
	topic: TutorialTopic;
};

export function TutorialItem({ onPress, topic }: TutorialItemProps) {
	return (
		<AppPressable
			accessibilityLabel={`${topic.title} 튜토리얼 보기`}
			accessibilityRole="button"
			onPress={onPress}
			pressedColor="rgba(0, 75, 147, 0.04)"
			radius="base"
			style={styles.item}
		>
			<View style={styles.leading}>
				<View style={styles.iconBox}>
					<AppIcon.Base color={AppColors.primary} name={topic.icon} pressable={false} />
				</View>
				<AppText.Lg bold numberOfLines={2} style={styles.title}>
					{topic.title}
				</AppText.Lg>
			</View>

			<AppIcon.Base color={AppColors.sub} name="chevron-forward" pressable={false} />
		</AppPressable>
	);
}

export default TutorialItem;

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
