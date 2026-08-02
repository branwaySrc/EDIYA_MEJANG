import type { ReactNode } from "react";
import { memo } from "react";
import { KeyboardTypeOptions, StyleSheet, TextInput, View } from "react-native";

import { AppText } from "@/components/base/app-text";
import { AppColors, AppFonts, AppSpacing } from "@/constants/theme";

export type HiringFieldProps = {
	keyboardType?: KeyboardTypeOptions;
	label: string;
	multiline?: boolean;
	onChangeText: (value: string) => void;
	placeholder: string;
	value: string;
};

export const HiringField = memo(function HiringField({ keyboardType = "default", label, multiline = false, onChangeText, placeholder, value }: HiringFieldProps) {
	return (
		<View style={styles.field}>
			<AppText.Sm bold color={AppColors.sub}>
				{label}
			</AppText.Sm>
			<TextInput
				keyboardType={keyboardType}
				multiline={multiline}
				onChangeText={onChangeText}
				placeholder={placeholder}
				placeholderTextColor={AppColors.placeholder}
				style={[styles.input, multiline && styles.textArea]}
				textAlignVertical={multiline ? "top" : "center"}
				value={value}
			/>
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
	},
	input: {
		minHeight: 46,
		borderWidth: 1,
		borderColor: "rgba(71, 85, 105, 0.36)",
		borderRadius: 4,
		backgroundColor: AppColors.background,
		color: AppColors.text,
		fontFamily: AppFonts.regular,
		fontSize: 17,
		paddingHorizontal: AppSpacing.sm,
	},
	textArea: {
		minHeight: 92,
		paddingTop: AppSpacing.sm,
	},
});
