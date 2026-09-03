import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { AppIcon } from "@/components/base/app-icon";
import { AppPressable } from "@/components/base/app-pressable";
import { AppText } from "@/components/base/app-text";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { AppColors, AppSpacing } from "@/constants/theme";

type ManagementDetailActionsProps = {
	onDelete: () => void;
	onEdit: () => void;
};

export function ManagementDetailActions({ onDelete, onEdit }: ManagementDetailActionsProps) {
	const [confirmOpen, setConfirmOpen] = useState(false);

	const handleConfirmDelete = () => {
		setConfirmOpen(false);
		onDelete();
	};

	return (
		<>
			<View style={styles.container}>
				<AppPressable
					accessibilityLabel="아이템 수정하기"
					accessibilityRole="button"
					onPress={onEdit}
					pressedColor="#003E7A"
					radius="base"
					style={styles.editButton}
				>
					<AppIcon.Sm color={AppColors.textOnPrimary} name="create-outline" pressable={false} />
					<AppText.Base bold color={AppColors.textOnPrimary}>
						수정하기
					</AppText.Base>
				</AppPressable>
				<AppPressable
					accessibilityLabel="아이템 삭제"
					accessibilityRole="button"
					onPress={() => setConfirmOpen(true)}
					pressedColor="#991B1B"
					radius="base"
					style={styles.deleteButton}
				>
					<AppIcon.Sm color={AppColors.textOnPrimary} name="trash-outline" pressable={false} />
					<AppText.Base bold color={AppColors.textOnPrimary}>
						삭제하기
					</AppText.Base>
				</AppPressable>
			</View>

			<ConfirmDialog
				message="정말로 삭제하시겠습니까?"
				onCancel={() => setConfirmOpen(false)}
				onConfirm={handleConfirmDelete}
				open={confirmOpen}
			/>
		</>
	);
}

const styles = StyleSheet.create({
	container: {
		width: "100%",
		alignItems: "center",
		gap: AppSpacing.sm,
		backgroundColor: AppColors.background,
		padding: AppSpacing.md,
	},
	editButton: {
		width: "100%",
		minHeight: 52,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: AppSpacing.sm,
		backgroundColor: AppColors.primary,
	},
	deleteButton: {
		width: "100%",
		minHeight: 52,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: AppSpacing.sm,
		backgroundColor: "#B91C1C",
		paddingHorizontal: AppSpacing.md,
	},
});
