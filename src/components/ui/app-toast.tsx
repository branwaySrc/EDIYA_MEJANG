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
			style={[styles.layer, { paddingTop: Math.max(insets.top, AppSpacing.md) + AppSpacing.sm }]}
		>
			<View style={styles.toast}>
				<View style={styles.iconFrame}>
					<AppIcon.Sm color={AppColors.textOnPrimary} name="checkmark" pressable={false} />
				</View>
				<AppText.Base bold color={AppColors.textOnPrimary} numberOfLines={2} style={styles.message}>
					{message}
				</AppText.Base>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	layer: {
		position: "absolute",
		top: 0,
		right: 0,
		left: 0,
		alignItems: "center",
		paddingHorizontal: AppSpacing.md,
		zIndex: 1000,
	},
	toast: {
		width: "100%",
		minHeight: 56,
		maxWidth: 520,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "flex-start",
		gap: AppSpacing.sm,
		borderRadius: 4,
		borderWidth: 1,
		borderColor: "rgba(255, 255, 255, 0.18)",
		backgroundColor: "#111827",
		paddingHorizontal: AppSpacing.md,
		paddingVertical: AppSpacing.sm,
		shadowColor: AppColors.text,
		shadowOffset: { width: 0, height: 5 },
		shadowOpacity: 0.22,
		shadowRadius: 12,
	},
	iconFrame: {
		width: 28,
		height: 28,
		alignItems: "center",
		justifyContent: "center",
		borderRadius: 999,
		backgroundColor: "rgba(255, 255, 255, 0.18)",
	},
	message: {
		flex: 1,
		minWidth: 0,
	},
});
