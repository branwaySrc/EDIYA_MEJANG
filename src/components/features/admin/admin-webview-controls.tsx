import { StyleSheet, View } from "react-native";

import { AppIcon } from "@/components/base/app-icon";
import { AppPressable } from "@/components/base/app-pressable";
import { AppColors } from "@/constants/theme";

export type AdminWebViewControlsProps = {
	canGoBack: boolean;
	canGoForward: boolean;
	onGoBack: () => void;
	onGoForward: () => void;
};

export function AdminWebViewControls({ canGoBack, canGoForward, onGoBack, onGoForward }: AdminWebViewControlsProps) {
	return (
		<View style={styles.container}>
			<AppPressable
				accessibilityLabel="웹뷰 뒤로가기"
				disabled={!canGoBack}
				onPress={onGoBack}
				pressedColor="rgba(255, 255, 255, 0.12)"
				radius="idle"
				style={[styles.controlButton, !canGoBack && styles.disabledButton]}
			>
				<AppIcon.Lg color={AppColors.textOnPrimary} name="chevron-back" pressable={false} />
			</AppPressable>
			<AppPressable
				accessibilityLabel="웹뷰 앞으로가기"
				disabled={!canGoForward}
				onPress={onGoForward}
				pressedColor="rgba(255, 255, 255, 0.12)"
				radius="idle"
				style={[styles.controlButton, !canGoForward && styles.disabledButton]}
			>
				<AppIcon.Lg color={AppColors.textOnPrimary} name="chevron-forward" pressable={false} />
			</AppPressable>
		</View>
	);
}

export default AdminWebViewControls;

const styles = StyleSheet.create({
	container: {
		width: "100%",
		minHeight: 42,
		flexDirection: "row",
		backgroundColor: AppColors.primary,
	},
	controlButton: {
		flex: 1,
		minHeight: 42,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: AppColors.primary,
	},
	disabledButton: {
		opacity: 0.35,
	},
});
