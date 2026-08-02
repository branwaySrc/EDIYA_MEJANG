import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppIcon } from "@/components/base/app-icon";
import { AppText } from "@/components/base/app-text";
import { AppColors, AppSpacing } from "@/constants/theme";
import { useAppToastStore } from "@/store/app-toast-store";

const toastDurationMs = 2200;

export function AppToast() {
	const insets = useSafeAreaInsets();
	const hideToast = useAppToastStore(state => state.hideToast);
	const message = useAppToastStore(state => state.message);
	const toastId = useAppToastStore(state => state.toastId);

	useEffect(() => {
		if (!message) {
			return;
		}

		const timer = setTimeout(hideToast, toastDurationMs);

		return () => clearTimeout(timer);
	}, [hideToast, message, toastId]);

	if (!message) {
		return null;
	}

	return (
		<View
			accessibilityLiveRegion="polite"
			pointerEvents="none"
			style={[styles.layer, { paddingBottom: Math.max(insets.bottom, AppSpacing.md) }]}
		>
			<View style={styles.toast}>
				<AppIcon.Sm color={AppColors.textOnPrimary} name="checkmark-circle" pressable={false} />
				<AppText.Sm bold color={AppColors.textOnPrimary}>
					{message}
				</AppText.Sm>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	layer: {
		position: "absolute",
		right: 0,
		bottom: 0,
		left: 0,
		alignItems: "center",
		paddingHorizontal: AppSpacing.md,
		zIndex: 1000,
	},
	toast: {
		minHeight: 46,
		maxWidth: 420,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: AppSpacing.sm,
		borderRadius: 4,
		backgroundColor: "#1F2937",
		paddingHorizontal: AppSpacing.md,
		paddingVertical: AppSpacing.sm,
		shadowColor: AppColors.text,
		shadowOffset: { width: 0, height: 3 },
		shadowOpacity: 0.18,
		shadowRadius: 8,
	},
});
