import { useEffect, useMemo, useState } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

import { AppPressable } from "@/components/base/app-pressable";
import { AppText } from "@/components/base/app-text";
import { AppColors, AppSpacing } from "@/constants/theme";

export type UnderlineTabItem<T extends string> = {
	accessibilityLabel?: string;
	id: T;
	label: string;
};

export type UnderlineTabMenuProps<T extends string> = {
	activeId: T;
	items: readonly UnderlineTabItem<T>[];
	onChange: (id: T) => void;
};

function ActiveTabLine() {
	const [progress] = useState(() => new Animated.Value(0));
	const opacity = useMemo(
		() =>
			progress.interpolate({
				inputRange: [0, 1],
				outputRange: [0.6, 1],
			}),
		[progress],
	);

	useEffect(() => {
		progress.setValue(0);
		Animated.timing(progress, {
			duration: 180,
			easing: Easing.out(Easing.cubic),
			toValue: 1,
			useNativeDriver: true,
		}).start();
	}, [progress]);

	return (
		<View style={styles.activeLineTrack}>
			<Animated.View
				style={[
					styles.activeLine,
					{
						opacity,
						transform: [{ scaleX: progress }],
					},
				]}
			/>
		</View>
	);
}

export function UnderlineTabMenu<T extends string>({ activeId, items, onChange }: UnderlineTabMenuProps<T>) {
	return (
		<View accessibilityRole="tablist" style={styles.container}>
			{items.map(item => {
				const active = item.id === activeId;

				return (
					<AppPressable
						key={item.id}
						accessibilityLabel={item.accessibilityLabel ?? item.label}
						accessibilityRole="tab"
						accessibilityState={{ selected: active }}
						onPress={() => onChange(item.id)}
						pressedColor="rgba(255, 255, 255, 0.12)"
						radius="idle"
						style={styles.tab}
					>
						<AppText.Base bold={active} color={AppColors.textOnPrimary} numberOfLines={1}>
							{item.label}
						</AppText.Base>
						{active && <ActiveTabLine />}
					</AppPressable>
				);
			})}
		</View>
	);
}

export default UnderlineTabMenu;

const styles = StyleSheet.create({
	container: {
		width: "100%",
		flexDirection: "row",
		backgroundColor: AppColors.primary,
	},
	tab: {
		flex: 1,
		minHeight: 42,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: AppColors.primary,
		paddingHorizontal: AppSpacing.sm,
		position: "relative",
	},
	activeLineTrack: {
		position: "absolute",
		right: AppSpacing.sm,
		bottom: 3,
		left: AppSpacing.sm,
		height: 4,
		alignItems: "center",
	},
	activeLine: {
		width: "70%",
		height: 3,
		borderRadius: 999,
		backgroundColor: AppColors.textOnPrimary,
	},
});
