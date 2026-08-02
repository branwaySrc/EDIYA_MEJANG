import { Modal, Pressable, StyleSheet, View } from "react-native";

import { AppPressable } from "@/components/base/app-pressable";
import { AppText } from "@/components/base/app-text";
import { AppColors, AppSpacing } from "@/constants/theme";

type ConfirmDialogProps = {
	confirmLabel?: string;
	message: string;
	onCancel: () => void;
	onConfirm: () => void;
	open: boolean;
	title?: string;
};

export function ConfirmDialog({
	confirmLabel = "삭제",
	message,
	onCancel,
	onConfirm,
	open,
	title = "아이템 삭제",
}: ConfirmDialogProps) {
	return (
		<Modal
			animationType="fade"
			onRequestClose={onCancel}
			presentationStyle="overFullScreen"
			statusBarTranslucent
			transparent
			visible={open}
		>
			<View style={styles.layer}>
				<Pressable accessibilityLabel="삭제 확인창 닫기" onPress={onCancel} style={styles.backdrop} />
				<View accessibilityViewIsModal style={styles.dialog}>
					<View style={styles.content}>
						<AppText.Lg bold>{title}</AppText.Lg>
						<AppText.Base color={AppColors.sub}>{message}</AppText.Base>
					</View>
					<View style={styles.actions}>
						<AppPressable
							accessibilityLabel="삭제 취소"
							accessibilityRole="button"
							onPress={onCancel}
							radius="base"
							style={styles.cancelButton}
						>
							<AppText.Base bold>취소</AppText.Base>
						</AppPressable>
						<AppPressable
							accessibilityLabel="아이템 삭제"
							accessibilityRole="button"
							onPress={onConfirm}
							pressedColor="#991B1B"
							radius="base"
							style={styles.deleteButton}
						>
							<AppText.Base bold color={AppColors.textOnPrimary}>
								{confirmLabel}
							</AppText.Base>
						</AppPressable>
					</View>
				</View>
			</View>
		</Modal>
	);
}

const styles = StyleSheet.create({
	layer: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		padding: AppSpacing.md,
	},
	backdrop: {
		position: "absolute",
		top: 0,
		right: 0,
		bottom: 0,
		left: 0,
		backgroundColor: "rgba(0, 0, 0, 0.38)",
	},
	dialog: {
		width: "100%",
		maxWidth: 360,
		borderRadius: 8,
		backgroundColor: AppColors.background,
	},
	content: {
		gap: AppSpacing.sm,
		padding: AppSpacing.lg,
	},
	actions: {
		flexDirection: "row",
		gap: AppSpacing.sm,
		borderTopWidth: 1,
		borderTopColor: "#E2E8F0",
		padding: AppSpacing.md,
	},
	cancelButton: {
		minHeight: 46,
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		borderWidth: 1,
		borderColor: "#CBD5E1",
		backgroundColor: AppColors.background,
	},
	deleteButton: {
		minHeight: 46,
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "#B91C1C",
	},
});
