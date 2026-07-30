import type { ReactNode } from "react";
import { useMemo } from "react";
import { Animated, type LayoutChangeEvent, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppIcon } from "@/components/base/app-icon";
import { AppPressable } from "@/components/base/app-pressable";
import { AppText } from "@/components/base/app-text";
import { AppColors, AppSpacing } from "@/constants/theme";

export type AppHeaderProps = {
	aside?: ReactNode;
	drawerOpen: boolean;
	drawerProgress: Animated.Value;
	leadingMode?: "drawer" | "back";
	onLayout?: (event: LayoutChangeEvent) => void;
	onPressBack?: () => void;
	onToggleDrawer: () => void;
	title: string;
};

export function AppHeader({
	aside,
	drawerOpen,
	drawerProgress,
	leadingMode = "drawer",
	onLayout,
	onPressBack,
	onToggleDrawer,
	title,
}: AppHeaderProps) {
	const drawerIconRotation = useMemo(
		() =>
			drawerProgress.interpolate({
				inputRange: [0, 1],
				outputRange: ["0deg", "360deg"],
			}),
		[drawerProgress],
	);
	const menuIconOpacity = useMemo(
		() =>
			drawerProgress.interpolate({
				inputRange: [0, 0.45, 1],
				outputRange: [1, 0, 0],
			}),
		[drawerProgress],
	);
	const backIconOpacity = useMemo(
		() =>
			drawerProgress.interpolate({
				inputRange: [0, 0.55, 1],
				outputRange: [0, 0, 1],
			}),
		[drawerProgress],
	);

	return (
		<SafeAreaView onLayout={onLayout} style={styles.safeArea} edges={["top", "right", "left"]}>
			<View style={styles.header}>
				<View style={styles.titleArea}>
					{leadingMode === "back" ? (
						<AppIcon.Lg
							accessibilityLabel="이전 화면으로 이동"
							color={AppColors.textOnPrimary}
							name="arrow-back"
							onPress={onPressBack}
							pressedColor="rgba(255, 255, 255, 0.14)"
						/>
					) : (
						<AppPressable
							accessibilityLabel={drawerOpen ? "메뉴 닫기" : "메뉴 열기"}
							accessibilityRole="button"
							hitSlop={8}
							onPress={onToggleDrawer}
							pressedColor="rgba(255, 255, 255, 0.14)"
							radius="full"
							style={styles.menuToggleButton}
						>
							<Animated.View style={[styles.menuToggleIcon, { transform: [{ rotate: drawerIconRotation }] }]}>
								<Animated.View style={[styles.menuToggleIconLayer, { opacity: menuIconOpacity }]}>
									<AppIcon.Lg color={AppColors.textOnPrimary} name="menu" pressable={false} />
								</Animated.View>
								<Animated.View style={[styles.menuToggleIconLayer, { opacity: backIconOpacity }]}>
									<AppIcon.Lg color={AppColors.textOnPrimary} name="arrow-back" pressable={false} />
								</Animated.View>
							</Animated.View>
						</AppPressable>
					)}

					<AppText.Lg bold color={AppColors.textOnPrimary} numberOfLines={1}>
						{title}
					</AppText.Lg>
				</View>

				{aside && <View style={styles.aside}>{aside}</View>}
			</View>
		</SafeAreaView>
	);
}

export default AppHeader;

const styles = StyleSheet.create({
	safeArea: {
		backgroundColor: AppColors.primary,
		zIndex: 20,
	},
	header: {
		minHeight: 56,
		paddingHorizontal: AppSpacing.md,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		backgroundColor: AppColors.primary,
	},
	titleArea: {
		flex: 1,
		minWidth: 0,
		flexDirection: "row",
		alignItems: "center",
		gap: AppSpacing.sm,
	},
	aside: {
		flexDirection: "row",
		alignItems: "center",
		gap: AppSpacing.xs,
		marginLeft: AppSpacing.md,
	},
	menuToggleButton: {
		width: 40,
		height: 40,
		alignItems: "center",
		justifyContent: "center",
	},
	menuToggleIcon: {
		width: 40,
		height: 40,
		alignItems: "center",
		justifyContent: "center",
	},
	menuToggleIconLayer: {
		position: "absolute",
		alignItems: "center",
		justifyContent: "center",
	},
});
