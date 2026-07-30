import type { ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { AppText } from "@/components/base/app-text";
import { AppColors } from "@/constants/theme";

export type AppBadgeProps = {
	children: ReactNode;
	size?: "xs" | "sm";
	style?: StyleProp<ViewStyle>;
	tone?: "neutral" | "primary";
};

export function AppBadge({ children, size = "xs", style, tone = "neutral" }: AppBadgeProps) {
	const TextComponent = size === "sm" ? AppText.Sm : AppText.Xs;

	return (
		<View style={[styles.base, size === "xs" ? styles.sizeXs : styles.sizeSm, tone === "primary" ? styles.primary : styles.neutral, style]}>
			<TextComponent bold={tone === "primary"} color={tone === "primary" ? AppColors.primary : AppColors.sub} numberOfLines={1}>
				{children}
			</TextComponent>
		</View>
	);
}

export default AppBadge;

const styles = StyleSheet.create({
	base: {
		alignItems: "center",
		justifyContent: "center",
		borderRadius: 999,
	},
	sizeXs: {
		minHeight: 22,
		paddingVertical: 4,
		paddingHorizontal: 10,
	},
	sizeSm: {
		minHeight: 28,
		paddingVertical: 5,
		paddingHorizontal: 12,
	},
	neutral: {
		backgroundColor: "rgba(71, 85, 105, 0.12)",
	},
	primary: {
		backgroundColor: "rgba(0, 75, 147, 0.12)",
	},
});
