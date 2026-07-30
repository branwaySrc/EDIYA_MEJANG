import { useEffect, useRef } from "react";
import { StyleSheet, TextInput, type TextInputProps, View } from "react-native";

import { AppIcon } from "@/components/base/app-icon";
import { AppPressable } from "@/components/base/app-pressable";
import { AppText } from "@/components/base/app-text";
import { AppColors, AppFonts, AppSpacing } from "@/constants/theme";

export type SearchBoxProps = Omit<TextInputProps, "autoFocus" | "onChangeText" | "onSubmitEditing" | "placeholder" | "returnKeyType" | "value"> & {
	autoFocus?: boolean;
	onChangeText: (value: string) => void;
	onSubmit: () => void;
	placeholder?: string;
	showSubmitButton?: boolean;
	value: string;
};

export function SearchBox({
	autoFocus = false,
	onChangeText,
	onSubmit,
	placeholder = "메뉴 검색, 초성 검색 가능",
	showSubmitButton = true,
	value,
	...props
}: SearchBoxProps) {
	const inputRef = useRef<TextInput>(null);

	useEffect(() => {
		if (!autoFocus) {
			return;
		}

		const timer = setTimeout(() => {
			inputRef.current?.focus();
		}, 120);

		return () => clearTimeout(timer);
	}, [autoFocus]);

	return (
		<View style={styles.container}>
			<View style={styles.inputArea}>
				<AppIcon.Base color={AppColors.sub} name="search-outline" pressable={false} />
				<TextInput
					{...props}
					ref={inputRef}
					autoCapitalize="none"
					autoCorrect={false}
					autoFocus={autoFocus}
					onChangeText={onChangeText}
					onSubmitEditing={onSubmit}
					placeholder={placeholder}
					placeholderTextColor={AppColors.placeholder}
					returnKeyType="search"
					style={styles.input}
					value={value}
				/>
			</View>

			{showSubmitButton ? (
				<AppPressable accessibilityLabel="검색 실행" onPress={onSubmit} pressedColor="#003E7A" radius="base" style={styles.submitButton}>
					<AppText.Base bold color={AppColors.textOnPrimary}>
						검색
					</AppText.Base>
				</AppPressable>
			) : null}
		</View>
	);
}

export default SearchBox;

const styles = StyleSheet.create({
	container: {
		width: "100%",
		gap: AppSpacing.sm,
	},
	inputArea: {
		width: "100%",
		minHeight: 56,
		flexDirection: "row",
		alignItems: "center",
		gap: AppSpacing.sm,
		borderWidth: 2,
		borderColor: "#000000",
		borderRadius: 4,
		backgroundColor: AppColors.background,
		paddingHorizontal: AppSpacing.md,
	},
	input: {
		flex: 1,
		minWidth: 0,
		color: AppColors.text,
		fontFamily: AppFonts.regular,
		fontSize: 17,
		lineHeight: 24,
		paddingVertical: 0,
	},
	submitButton: {
		width: "100%",
		minHeight: 52,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: AppColors.primary,
		paddingHorizontal: AppSpacing.md,
	},
});
