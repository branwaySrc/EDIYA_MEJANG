import type { ReactNode } from "react";
import { memo, useRef, useState } from "react";
import { Keyboard, KeyboardAvoidingView, type KeyboardTypeOptions, Modal, Platform, Pressable, StyleSheet, TextInput, View } from "react-native";

import { AppText } from "@/components/base/app-text";
import { AppColors, AppFonts, AppSpacing } from "@/constants/theme";

export type HiringFieldProps = {
	keyboardType?: KeyboardTypeOptions;
	label: string;
	maxLength?: number;
	multiline?: boolean;
	onChangeText: (value: string) => void;
	placeholder: string;
	value: string;
};

export const HiringField = memo(function HiringField({
	keyboardType = "default",
	label,
	maxLength,
	multiline = false,
	onChangeText,
	placeholder,
	value,
}: HiringFieldProps) {
	const [modalOpen, setModalOpen] = useState(false);
	const inputRef = useRef<TextInput>(null);

	const openModal = () => {
		setModalOpen(true);
	};

	const closeModal = () => {
		Keyboard.dismiss();
		setModalOpen(false);
	};

	const focusInput = () => {
		requestAnimationFrame(() => {
			inputRef.current?.focus();
		});
	};

	const changeText = (nextValue: string) => {
		onChangeText(nextValue);
	};

	return (
		<View style={styles.field}>
			<AppText.Sm bold color={AppColors.sub}>
				{label}
			</AppText.Sm>
			<Pressable
				accessibilityLabel={`${label} 입력하기`}
				accessibilityRole="button"
				onPress={openModal}
				style={({ pressed }) => [styles.input, multiline && styles.textArea, pressed && styles.inputPressed]}
			>
				<AppText.Base color={value ? AppColors.text : AppColors.placeholder} numberOfLines={multiline ? 3 : 1}>
					{value || placeholder}
				</AppText.Base>
			</Pressable>

			<Modal animationType="fade" onRequestClose={closeModal} onShow={focusInput} transparent visible={modalOpen}>
				<KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalRoot}>
					<Pressable accessibilityLabel={`${label} 입력창 닫기`} style={styles.modalBackdrop} onPress={closeModal} />
					<View style={styles.modalPanel}>
						<AppText.Sm bold color={AppColors.primary}>
							{label}
						</AppText.Sm>
						<TextInput
							autoFocus
							ref={inputRef}
							keyboardType={keyboardType}
							maxLength={maxLength}
							multiline={multiline}
							onChangeText={changeText}
							onSubmitEditing={multiline ? undefined : closeModal}
							placeholder={placeholder}
							placeholderTextColor={AppColors.placeholder}
							returnKeyType={multiline ? "default" : "done"}
							style={[styles.modalInput, multiline && styles.modalTextArea]}
							textAlignVertical={multiline ? "top" : "center"}
							value={value}
						/>
						<Pressable
							accessibilityRole="button"
							onPressIn={closeModal}
							onPress={closeModal}
							style={({ pressed }) => [styles.modalDoneButton, pressed && styles.modalDoneButtonPressed]}
						>
							<AppText.Base bold color={AppColors.textOnPrimary}>
								완료
							</AppText.Base>
						</Pressable>
					</View>
				</KeyboardAvoidingView>
			</Modal>
		</View>
	);
});

export function HiringStepFrame({ children, step, subtitle, title }: { children: ReactNode; step: number; subtitle?: string; title: string }) {
	return (
		<View style={styles.container}>
			<View style={styles.progressBox}>
				<AppText.Xs bold color={AppColors.primary}>
					Page {String(step).padStart(2, "0")} / 07
				</AppText.Xs>
				<AppText.Lg bold>{title}</AppText.Lg>
				{subtitle && <AppText.Sm color={AppColors.sub}>{subtitle}</AppText.Sm>}
			</View>
			{children}
		</View>
	);
}

export default HiringStepFrame;

const styles = StyleSheet.create({
	container: {
		width: "100%",
		gap: AppSpacing.md,
		padding: AppSpacing.md,
		paddingBottom: AppSpacing.xl,
	},
	progressBox: {
		gap: AppSpacing.xs,
		borderWidth: 1,
		borderColor: "rgba(0, 75, 147, 0.22)",
		borderRadius: 8,
		backgroundColor: "#F8FBFF",
		padding: AppSpacing.md,
	},
	field: {
		width: "100%",
		gap: AppSpacing.xs,
		marginBottom: 18,
	},
	input: {
		minHeight: 46,
		justifyContent: "center",
		borderWidth: 1,
		borderColor: "rgba(71, 85, 105, 0.36)",
		borderRadius: 4,
		backgroundColor: AppColors.background,
		color: AppColors.text,
		fontFamily: AppFonts.regular,
		fontSize: 17,
		paddingVertical: AppSpacing.sm,
		paddingHorizontal: AppSpacing.sm,
	},
	inputPressed: {
		borderColor: AppColors.primary,
		backgroundColor: "#F8FBFF",
	},
	textArea: {
		minHeight: 92,
		paddingTop: AppSpacing.sm,
	},
	modalRoot: {
		flex: 1,
		justifyContent: "flex-end",
		backgroundColor: "rgba(0, 0, 0, 0.58)",
		padding: AppSpacing.md,
		paddingBottom: AppSpacing.xl + AppSpacing.md,
	},
	modalBackdrop: {
		...StyleSheet.absoluteFill,
	},
	modalPanel: {
		width: "100%",
		gap: AppSpacing.sm,
		borderRadius: 8,
		backgroundColor: AppColors.background,
		padding: AppSpacing.md,
	},
	modalInput: {
		minHeight: 64,
		borderWidth: 1,
		borderColor: "rgba(0, 75, 147, 0.34)",
		borderRadius: 4,
		backgroundColor: AppColors.background,
		color: AppColors.text,
		fontFamily: AppFonts.regular,
		fontSize: 22,
		paddingHorizontal: AppSpacing.md,
	},
	modalTextArea: {
		minHeight: 168,
		paddingTop: AppSpacing.md,
	},
	modalDoneButton: {
		minHeight: 50,
		alignItems: "center",
		justifyContent: "center",
		borderRadius: 4,
		backgroundColor: AppColors.primary,
	},
	modalDoneButtonPressed: {
		backgroundColor: "#003E7A",
	},
});
