import type { ReactNode } from "react";
import { memo } from "react";
import { StyleSheet, TextInput, type TextInputProps, View } from "react-native";

import { AppIcon, type AppIconProps } from "@/components/base/app-icon";
import { AppPressable } from "@/components/base/app-pressable";
import { AppText } from "@/components/base/app-text";
import { AppColors, AppFonts, AppSpacing } from "@/constants/theme";

export type ManagementFieldProps = Omit<TextInputProps, "onChangeText" | "value"> & {
	label: string;
	onChangeText: (value: string) => void;
	value: string;
};

export const ManagementField = memo(function ManagementField({
	label,
	multiline = false,
	onChangeText,
	placeholder,
	value,
	...props
}: ManagementFieldProps) {
	return (
		<View style={styles.field}>
			<AppText.Base bold color={AppColors.sub}>
				{label}
			</AppText.Base>
			<TextInput
				{...props}
				multiline={multiline}
				onChangeText={onChangeText}
				placeholder={placeholder}
				placeholderTextColor={AppColors.placeholder}
				style={[styles.input, multiline ? styles.textArea : null]}
				textAlignVertical={multiline ? "top" : "center"}
				value={value}
			/>
		</View>
	);
});

export function ManagementSection({ children, title }: { children: ReactNode; title: string }) {
	return (
		<View style={styles.section}>
			<View style={styles.sectionHeader}>
				<AppText.Base bold color={AppColors.primary}>
					{title}
				</AppText.Base>
			</View>
			<View style={styles.sectionBody}>{children}</View>
		</View>
	);
}

export function ManagementHeaderAddButton({ onPress }: { onPress: () => void }) {
	return (
		<AppPressable
			accessibilityLabel="새 항목 추가하기"
			accessibilityRole="button"
			onPress={onPress}
			pressedColor="rgba(255, 255, 255, 0.14)"
			radius="base"
			style={styles.headerAddButton}
		>
			<AppIcon.Sm color={AppColors.textOnPrimary} name="add" pressable={false} />
			<AppText.Sm bold color={AppColors.textOnPrimary}>
				추가하기
			</AppText.Sm>
		</AppPressable>
	);
}

export function ManagementActionButton({
	disabled = false,
	icon = "add",
	label,
	onPress,
	tone = "secondary",
}: {
	disabled?: boolean;
	icon?: AppIconProps["name"];
	label: string;
	onPress: () => void;
	tone?: "primary" | "secondary" | "danger";
}) {
	return (
		<AppPressable
			accessibilityLabel={label}
			accessibilityRole="button"
			disabled={disabled}
			onPress={onPress}
			pressedColor={tone === "primary" ? "#003E7A" : "rgba(0, 75, 147, 0.08)"}
			radius="base"
			style={[
				styles.actionButton,
				tone === "primary" ? styles.primaryActionButton : null,
				tone === "danger" ? styles.dangerActionButton : null,
				disabled ? styles.disabledActionButton : null,
			]}
		>
			<AppIcon.Sm
				color={tone === "primary" ? AppColors.textOnPrimary : tone === "danger" ? "#B91C1C" : AppColors.primary}
				name={icon}
				pressable={false}
			/>
			<AppText.Sm bold color={tone === "primary" ? AppColors.textOnPrimary : tone === "danger" ? "#B91C1C" : AppColors.primary}>
				{label}
			</AppText.Sm>
		</AppPressable>
	);
}

export function ManagementOptionSelector<Option extends string>({
	label,
	onChange,
	options,
	value,
}: {
	label: string;
	onChange: (value: Option) => void;
	options: readonly { label: string; value: Option }[];
	value: Option;
}) {
	return (
		<View style={styles.field}>
			<AppText.Sm bold color={AppColors.sub}>
				{label}
			</AppText.Sm>
			<View style={styles.optionList}>
				{options.map(option => {
					const selected = option.value === value;

					return (
						<AppPressable
							key={option.value}
							accessibilityLabel={option.label}
							accessibilityRole="radio"
							accessibilityState={{ checked: selected }}
							onPress={() => onChange(option.value)}
							pressedColor="rgba(0, 75, 147, 0.08)"
							radius="base"
							style={[styles.option, selected ? styles.selectedOption : null]}
						>
							<AppText.Sm bold={selected} color={selected ? AppColors.textOnPrimary : AppColors.text}>
								{option.label}
							</AppText.Sm>
						</AppPressable>
					);
				})}
			</View>
		</View>
	);
}

export function ManagementItemRow({
	badge,
	onDelete,
	onEdit,
	onPress,
	subtitle,
	title,
}: {
	badge?: string;
	onDelete?: () => void;
	onEdit?: () => void;
	onPress?: () => void;
	subtitle: string;
	title: string;
}) {
	return (
		<AppPressable
			accessibilityLabel={`${title} 상세 보기`}
			accessibilityRole="button"
			onPress={onPress}
			pressedColor="rgba(0, 75, 147, 0.04)"
			radius="idle"
			style={styles.itemRow}
		>
			<View style={styles.itemTextArea}>
				<AppText.Lg numberOfLines={1}>{title}</AppText.Lg>
				<AppText.Sm color={AppColors.sub} numberOfLines={1}>
					{subtitle}
				</AppText.Sm>
			</View>
			{badge || onDelete || onEdit ? (
				<View style={styles.itemAside}>
					{badge ? (
						<View style={styles.itemBadge}>
							<AppText.Xs bold color={AppColors.primary}>
								{badge}
							</AppText.Xs>
						</View>
					) : null}
					{onEdit ? (
						<AppPressable
							accessibilityLabel={`${title} 수정하기`}
							accessibilityRole="button"
							onPress={event => {
								event.stopPropagation();
								onEdit();
							}}
							pressedColor="rgba(0, 75, 147, 0.08)"
							radius="base"
							style={styles.editButton}
						>
							<AppText.Sm bold color={AppColors.primary} style={styles.underlinedText}>
								수정하기
							</AppText.Sm>
						</AppPressable>
					) : null}
					{onDelete ? (
						<AppIcon.Sm
							accessibilityLabel={`${title} 삭제`}
							color="#B91C1C"
							name="trash-outline"
							onPress={event => {
								event.stopPropagation();
								onDelete();
							}}
						/>
					) : null}
				</View>
			) : null}
		</AppPressable>
	);
}

const styles = StyleSheet.create({
	field: {
		width: "100%",
		gap: AppSpacing.xs,
	},
	input: {
		width: "100%",
		minHeight: 46,
		borderWidth: 1,
		borderColor: "rgba(71, 85, 105, 0.36)",
		borderRadius: 4,
		backgroundColor: AppColors.background,
		color: AppColors.text,
		fontFamily: AppFonts.regular,
		fontSize: 17,
		paddingHorizontal: AppSpacing.sm,
		paddingVertical: 0,
	},
	textArea: {
		minHeight: 96,
		paddingTop: AppSpacing.sm,
		paddingBottom: AppSpacing.sm,
	},
	section: {
		width: "100%",
		backgroundColor: AppColors.background,
	},
	sectionHeader: {
		paddingHorizontal: AppSpacing.md,
		paddingTop: AppSpacing.lg,
		paddingBottom: AppSpacing.sm,
		backgroundColor: "#F4F4F4",
	},
	sectionBody: {
		width: "100%",
		gap: AppSpacing.md,
		padding: AppSpacing.md,
	},
	headerAddButton: {
		minHeight: 36,
		flexDirection: "row",
		alignItems: "center",
		gap: AppSpacing.xs,
		paddingHorizontal: AppSpacing.sm,
	},
	actionButton: {
		minHeight: 44,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: AppSpacing.xs,
		borderWidth: 1,
		borderColor: "rgba(0, 75, 147, 0.36)",
		backgroundColor: AppColors.background,
		paddingHorizontal: AppSpacing.md,
	},
	primaryActionButton: {
		borderColor: AppColors.primary,
		backgroundColor: AppColors.primary,
	},
	dangerActionButton: {
		borderColor: "rgba(185, 28, 28, 0.32)",
		backgroundColor: "#FEF2F2",
	},
	disabledActionButton: {
		opacity: 0.45,
	},
	optionList: {
		width: "100%",
		flexDirection: "row",
		flexWrap: "wrap",
		gap: AppSpacing.xs,
	},
	option: {
		minHeight: 40,
		alignItems: "center",
		justifyContent: "center",
		borderWidth: 1,
		borderColor: "rgba(71, 85, 105, 0.28)",
		backgroundColor: AppColors.background,
		paddingHorizontal: AppSpacing.md,
	},
	selectedOption: {
		borderColor: AppColors.primary,
		backgroundColor: AppColors.primary,
	},
	itemRow: {
		width: "100%",
		minHeight: 78,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: AppSpacing.sm,
		backgroundColor: AppColors.background,
		paddingHorizontal: AppSpacing.md,
		paddingVertical: AppSpacing.sm,
	},
	itemTextArea: {
		flex: 1,
		minWidth: 0,
	},
	itemAside: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "flex-end",
		gap: AppSpacing.sm,
	},
	itemBadge: {
		minHeight: 22,
		alignItems: "center",
		justifyContent: "center",
		borderWidth: 1,
		borderColor: "rgba(0, 75, 147, 0.26)",
		borderRadius: 999,
		backgroundColor: "#F8FBFF",
		paddingHorizontal: AppSpacing.sm,
	},
	editButton: {
		minHeight: 38,
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: AppSpacing.sm,
	},
	underlinedText: {
		textDecorationLine: "underline",
	},
});
