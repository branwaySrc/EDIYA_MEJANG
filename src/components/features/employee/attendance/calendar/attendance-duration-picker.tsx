import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppIcon } from "@/components/base/app-icon";
import { AppPressable } from "@/components/base/app-pressable";
import { AppText } from "@/components/base/app-text";
import { formatMinutesAsNumericHours } from "@/components/features/employee/attendance/attendance-ui";
import { AppColors, AppSpacing } from "@/constants/theme";

const durationStepMinutes = 30;
const minimumDurationMinutes = 30;
const maximumDurationMinutes = 24 * 60;

type AttendanceDurationPickerProps = {
	employeeName: string;
	initialMinutes: number;
	mode: "attendance" | "substitute";
	onCancel: () => void;
	onConfirm: (minutes: number) => void;
};

function clampDuration(minutes: number) {
	return Math.min(maximumDurationMinutes, Math.max(minimumDurationMinutes, minutes));
}

export function AttendanceDurationPicker({
	employeeName,
	initialMinutes,
	mode,
	onCancel,
	onConfirm,
}: AttendanceDurationPickerProps) {
	const [pendingMinutes, setPendingMinutes] = useState(() => clampDuration(initialMinutes));

	const adjustDuration = (amount: number) => {
		setPendingMinutes(current => clampDuration(current + amount));
	};

	return (
		<View style={styles.layer}>
			<Pressable
				accessibilityLabel="근무시간 선택 닫기"
				accessibilityRole="button"
				onPress={onCancel}
				style={styles.backdrop}
			/>
			<SafeAreaView edges={["left", "right"]} style={styles.safeArea}>
				<View accessibilityViewIsModal style={styles.panel}>
					<View style={styles.header}>
						<View style={styles.headerText}>
							<AppText.Lg bold>실제 근무시간</AppText.Lg>
							<AppText.Xs color={AppColors.sub}>{employeeName}</AppText.Xs>
						</View>
						<AppIcon.Base
							accessibilityLabel="근무시간 선택 닫기"
							name="close"
							onPress={onCancel}
						/>
					</View>

					<View style={styles.contractRow}>
						<AppText.Sm color={AppColors.sub}>계약 근무시간</AppText.Sm>
						<AppText.Base bold color={AppColors.primary}>
							({formatMinutesAsNumericHours(initialMinutes)})
						</AppText.Base>
					</View>

					<View style={styles.pickerRow}>
						<AppIcon.Lg
							accessibilityLabel="근무시간 30분 줄이기"
							buttonStyle={styles.adjustButton}
							color={pendingMinutes <= minimumDurationMinutes ? AppColors.placeholder : AppColors.primary}
							disabled={pendingMinutes <= minimumDurationMinutes}
							name="remove"
							onPress={() => adjustDuration(-durationStepMinutes)}
						/>
						<View style={styles.durationValue}>
							<AppText.Xl bold color={AppColors.primary}>
								({formatMinutesAsNumericHours(pendingMinutes)})
							</AppText.Xl>
						</View>
						<AppIcon.Lg
							accessibilityLabel="근무시간 30분 늘리기"
							buttonStyle={styles.adjustButton}
							color={pendingMinutes >= maximumDurationMinutes ? AppColors.placeholder : AppColors.primary}
							disabled={pendingMinutes >= maximumDurationMinutes}
							name="add"
							onPress={() => adjustDuration(durationStepMinutes)}
						/>
					</View>

					<View style={styles.actions}>
						<AppPressable
							accessibilityLabel="근무시간 선택 취소"
							border
							onPress={onCancel}
							radius="base"
							style={styles.cancelButton}
						>
							<AppText.Base bold>취소</AppText.Base>
						</AppPressable>
						<AppPressable
							accessibilityLabel={`${mode === "substitute" ? "대타" : "출근"} 근무시간 확인`}
							onPress={() => onConfirm(pendingMinutes)}
							pressedColor="#003E7A"
							radius="base"
							style={styles.confirmButton}
						>
							<AppText.Base bold color={AppColors.textOnPrimary}>
								{mode === "substitute" ? "대타 확인" : "출근 확인"}
							</AppText.Base>
						</AppPressable>
					</View>
				</View>
			</SafeAreaView>
		</View>
	);
}

const styles = StyleSheet.create({
	layer: {
		position: "absolute",
		top: 0,
		right: 0,
		bottom: 0,
		left: 0,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "rgba(0, 0, 0, 0.48)",
		padding: AppSpacing.md,
		zIndex: 40,
	},
	backdrop: {
		position: "absolute",
		top: 0,
		right: 0,
		bottom: 0,
		left: 0,
	},
	safeArea: {
		width: "100%",
		maxWidth: 400,
	},
	panel: {
		width: "100%",
		gap: AppSpacing.md,
		borderRadius: 8,
		backgroundColor: AppColors.background,
		padding: AppSpacing.md,
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		gap: AppSpacing.sm,
	},
	headerText: {
		flex: 1,
		minWidth: 0,
		gap: 2,
	},
	contractRow: {
		minHeight: 42,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		borderTopWidth: 1,
		borderBottomWidth: 1,
		borderColor: "#E2E8F0",
	},
	pickerRow: {
		minHeight: 116,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: AppSpacing.md,
	},
	adjustButton: {
		width: 52,
		height: 52,
		borderWidth: 1,
		borderColor: "#CBD5E1",
	},
	durationValue: {
		width: 112,
		height: 68,
		alignItems: "center",
		justifyContent: "center",
		borderRadius: 4,
		backgroundColor: "rgba(0, 75, 147, 0.08)",
	},
	actions: {
		flexDirection: "row",
		gap: AppSpacing.sm,
	},
	cancelButton: {
		minHeight: 48,
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		borderColor: "#CBD5E1",
	},
	confirmButton: {
		minHeight: 48,
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: AppColors.primary,
	},
});
