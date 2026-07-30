import { Pressable, StyleSheet, type PressableProps, type StyleProp, type ViewStyle } from "react-native";

import { AppColors } from "@/constants/theme";

type AppPressableRadius = "idle" | "base" | "full";
type PressableStyleCallback = Extract<NonNullable<PressableProps["style"]>, (state: never) => unknown>;
type PressableState = Parameters<PressableStyleCallback>[0];

export type AppPressableProps = Omit<PressableProps, "style"> & {
	border?: boolean;
	pressedColor?: string;
	radius?: AppPressableRadius;
	style?: PressableProps["style"];
};

function resolveStyle(style: AppPressableProps["style"], state: PressableState): StyleProp<ViewStyle> {
	return typeof style === "function" ? style(state) : style;
}

export function AppPressable({
	border = false,
	children,
	disabled,
	pressedColor = "rgba(0, 75, 147, 0.08)",
	radius = "idle",
	style,
	...props
}: AppPressableProps) {
	return (
		<Pressable
			{...props}
			disabled={disabled}
			style={state => [
				styles.base,
				radius === "full" ? styles.radiusFull : radius === "base" ? styles.radiusBase : styles.radiusIdle,
				border && styles.border,
				resolveStyle(style, state),
				state.pressed && !disabled && { backgroundColor: pressedColor },
			]}
		>
			{children}
		</Pressable>
	);
}

export default AppPressable;

const styles = StyleSheet.create({
	base: {
		overflow: "hidden",
	},
	border: {
		borderWidth: 1,
		borderColor: AppColors.sub,
	},
	radiusBase: {
		borderRadius: 4,
	},
	radiusFull: {
		borderRadius: 999,
	},
	radiusIdle: {
		borderRadius: 0,
	},
});
