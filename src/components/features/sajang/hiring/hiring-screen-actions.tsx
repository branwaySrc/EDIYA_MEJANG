import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { AppPressable } from "@/components/base/app-pressable";
import { AppText } from "@/components/base/app-text";
import { AppColors, AppSpacing } from "@/constants/theme";

export type HiringScreenActionsProps = {
	primaryDisabled?: boolean;
	primaryLabel: string;
	onPressPrimary: () => void;
	onPressSecondary?: () => void;
	secondaryLabel?: string;
	tertiarySlot?: ReactNode;
};

export function HiringScreenActions({
	primaryDisabled = false,
	primaryLabel,
	onPressPrimary,
	onPressSecondary,
	secondaryLabel,
	tertiarySlot,
}: HiringScreenActionsProps) {
	return (
		<View style={styles.container}>
			{tertiarySlot}
			<View style={styles.row}>
				{secondaryLabel && onPressSecondary && (
					<AppPressable onPress={onPressSecondary} pressedColor="rgba(0, 75, 147, 0.08)" radius="base" style={styles.secondaryButton}>
						<AppText.Base bold color={AppColors.primary}>
							{secondaryLabel}
						</AppText.Base>
					</AppPressable>
				)}
				<AppPressable
					disabled={primaryDisabled}
					onPress={onPressPrimary}
					pressedColor="#003E7A"
					radius="base"
					style={[styles.primaryButton, primaryDisabled && styles.disabledButton]}
				>
					<AppText.Base bold color={AppColors.textOnPrimary}>
						{primaryLabel}
					</AppText.Base>
				</AppPressable>
			</View>
		</View>
	);
}

export default HiringScreenActions;

const styles = StyleSheet.create({
	container: {
		width: "100%",
		gap: AppSpacing.sm,
	},
	row: {
		width: "100%",
		flexDirection: "row",
		gap: AppSpacing.sm,
	},
	primaryButton: {
		flex: 1,
		minHeight: 50,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: AppColors.primary,
	},
	secondaryButton: {
		flex: 1,
		minHeight: 50,
		alignItems: "center",
		justifyContent: "center",
		borderWidth: 1,
		borderColor: AppColors.primary,
		backgroundColor: AppColors.background,
	},
	disabledButton: {
		opacity: 0.42,
	},
});
