import { useState } from "react";
import { Modal, StyleSheet, View } from "react-native";

import { AppIcon } from "@/components/base/app-icon";
import { AppPressable } from "@/components/base/app-pressable";
import { AppText } from "@/components/base/app-text";
import { AppColors, AppSpacing } from "@/constants/theme";
import { formatClockMinutes } from "@/database/employee/employee";

type TimeFieldProps = {
	label: string;
	onChange: (minutes: number) => void;
	value: number | null;
};

export function TimeField({ label, onChange, value }: TimeFieldProps) {
	const fallbackMinutes = 9 * 60;
	const [modalOpen, setModalOpen] = useState(false);
	const [pendingMinutes, setPendingMinutes] = useState(value ?? fallbackMinutes);

	const openPicker = () => {
		const currentMinutes = value ?? fallbackMinutes;
		setPendingMinutes(currentMinutes);
		setModalOpen(true);
	};

	const adjustPendingMinutes = (delta: number) => {
		setPendingMinutes(current => (current + delta + 1440) % 1440);
	};

	const applyPendingTime = () => {
		onChange(pendingMinutes);
		setModalOpen(false);
	};

	return (
		<>
			<View style={styles.field}>
				<AppText.Sm bold color={AppColors.sub}>
					{label}
				</AppText.Sm>
				<AppPressable
					accessibilityLabel={`${label} 선택`}
					accessibilityRole="button"
					onPress={openPicker}
					pressedColor="rgba(0, 75, 147, 0.06)"
					radius="base"
					style={styles.trigger}
				>
					<AppIcon.Sm color={AppColors.primary} name="time-outline" pressable={false} />
					<AppText.Base bold color={value === null ? AppColors.placeholder : AppColors.text}>
						{value === null ? "시간 선택" : formatClockMinutes(value)}
					</AppText.Base>
					<AppIcon.Sm color={AppColors.sub} name="chevron-down" pressable={false} />
				</AppPressable>
			</View>

			<Modal animationType="fade" onRequestClose={() => setModalOpen(false)} transparent visible={modalOpen}>
				<View style={styles.modalLayer}>
					<View style={styles.modalPanel}>
						<AppText.Lg bold>{label}</AppText.Lg>

						<View style={styles.picker}>
							<View style={styles.pickerColumn}>
								<AppText.Xs bold color={AppColors.sub}>
									시
								</AppText.Xs>
								<AppIcon.Base
									accessibilityLabel="시간 1시간 줄이기"
									name="remove-circle-outline"
									onPress={() => adjustPendingMinutes(-60)}
								/>
								<AppText.Xl bold>{String(Math.floor(pendingMinutes / 60)).padStart(2, "0")}</AppText.Xl>
								<AppIcon.Base
									accessibilityLabel="시간 1시간 늘리기"
									name="add-circle-outline"
									onPress={() => adjustPendingMinutes(60)}
								/>
							</View>
							<AppText.Xl bold style={styles.separatorText}>
								:
							</AppText.Xl>
							<View style={styles.pickerColumn}>
								<AppText.Xs bold color={AppColors.sub}>
									분
								</AppText.Xs>
								<AppIcon.Base
									accessibilityLabel="시간 5분 줄이기"
									name="remove-circle-outline"
									onPress={() => adjustPendingMinutes(-5)}
								/>
								<AppText.Xl bold>{String(pendingMinutes % 60).padStart(2, "0")}</AppText.Xl>
								<AppIcon.Base
									accessibilityLabel="시간 5분 늘리기"
									name="add-circle-outline"
									onPress={() => adjustPendingMinutes(5)}
								/>
							</View>
						</View>

						<AppText.Sm bold color={AppColors.primary} style={styles.selectedTime}>
							{formatClockMinutes(pendingMinutes)}
						</AppText.Sm>

						<View style={styles.modalActions}>
							<AppPressable
								accessibilityLabel="시간 선택 취소"
								onPress={() => setModalOpen(false)}
								radius="base"
								style={styles.cancelButton}
							>
								<AppText.Base bold>취소</AppText.Base>
							</AppPressable>
							<AppPressable
								accessibilityLabel="시간 적용"
								onPress={applyPendingTime}
								pressedColor="#003E7A"
								radius="base"
								style={styles.applyButton}
							>
								<AppText.Base bold color={AppColors.textOnPrimary}>
									적용
								</AppText.Base>
							</AppPressable>
						</View>
					</View>
				</View>
			</Modal>
		</>
	);
}

const styles = StyleSheet.create({
	field: {
		width: "100%",
		gap: AppSpacing.xs,
	},
	trigger: {
		width: "100%",
		minHeight: 48,
		flexDirection: "row",
		alignItems: "center",
		gap: AppSpacing.sm,
		borderWidth: 1,
		borderColor: "rgba(71, 85, 105, 0.36)",
		backgroundColor: AppColors.background,
		paddingHorizontal: AppSpacing.sm,
	},
	modalLayer: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "rgba(0, 0, 0, 0.38)",
		padding: AppSpacing.md,
	},
	modalPanel: {
		width: "100%",
		maxWidth: 360,
		gap: AppSpacing.md,
		borderRadius: 8,
		backgroundColor: AppColors.background,
		padding: AppSpacing.md,
	},
	picker: {
		minHeight: 164,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: AppSpacing.md,
	},
	pickerColumn: {
		width: 88,
		alignItems: "center",
		gap: AppSpacing.xs,
	},
	separatorText: {
		paddingTop: AppSpacing.lg,
	},
	selectedTime: {
		textAlign: "center",
	},
	modalActions: {
		flexDirection: "row",
		gap: AppSpacing.sm,
	},
	cancelButton: {
		minHeight: 46,
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		borderWidth: 1,
		borderColor: "#CBD5E1",
	},
	applyButton: {
		minHeight: 46,
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: AppColors.primary,
	},
});
