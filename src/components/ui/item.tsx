import { useEffect, useMemo, useState } from "react";
import { Animated, Pressable, StyleSheet, View } from "react-native";

import type { AppIconProps } from "@/components/base/app-icon";
import { AppIcon } from "@/components/base/app-icon";
import { AppPressable } from "@/components/base/app-pressable";
import { AppText } from "@/components/base/app-text";
import { AppColors, AppSpacing } from "@/constants/theme";

export type SearchResultItemProps = {
	category: string;
	highlightRange?: {
		end: number;
		start: number;
	};
	onPress?: () => void;
	onToggle: () => void;
	selected?: boolean;
	title: string;
};

export type RecipeItemAction = {
	accessibilityLabel: string;
	color: string;
	icon: AppIconProps["name"];
	onPress: () => void;
};

export type RecipeItemProps = {
	action?: RecipeItemAction;
	category: string;
	onPress?: () => void;
	title: string;
};

function HighlightedTitle({ highlightRange, title }: Pick<SearchResultItemProps, "highlightRange" | "title">) {
	const titleChars = [...title];

	if (!highlightRange || highlightRange.start >= highlightRange.end) {
		return title;
	}

	const before = titleChars.slice(0, highlightRange.start).join("");
	const highlighted = titleChars.slice(highlightRange.start, highlightRange.end).join("");
	const after = titleChars.slice(highlightRange.end).join("");

	return (
		<>
			{before}
			<AppText.Lg bold color="#0B63CE">
				{highlighted}
			</AppText.Lg>
			{after}
		</>
	);
}

function SearchResult({ category, highlightRange, onPress, onToggle, selected = false, title }: SearchResultItemProps) {
	const [progress] = useState(() => new Animated.Value(selected ? 1 : 0));
	const actionBackgroundColor = useMemo(
		() =>
			progress.interpolate({
				inputRange: [0, 1],
				outputRange: [AppColors.primary, "#DC2626"],
			}),
		[progress],
	);

	useEffect(() => {
		Animated.timing(progress, {
			duration: 180,
			toValue: selected ? 1 : 0,
			useNativeDriver: false,
		}).start();
	}, [progress, selected]);

	return (
		<AppPressable onPress={onPress} pressedColor="rgba(0, 75, 147, 0.04)" radius="idle" style={styles.searchResult}>
			<AppText.Lg numberOfLines={1} style={styles.searchResultTitle}>
				<HighlightedTitle highlightRange={highlightRange} title={title} />
			</AppText.Lg>

			<View style={styles.searchResultAside}>
				<AppText.Sm color={AppColors.sub} numberOfLines={1}>
					{category}
				</AppText.Sm>
				<Pressable
					accessibilityLabel={`${title} ${selected ? "삭제" : "추가"}`}
					hitSlop={8}
					onPress={event => {
						event.stopPropagation();
						onToggle();
					}}
				>
					<Animated.View style={[styles.searchResultAction, { backgroundColor: actionBackgroundColor }]}>
						<AppIcon.Sm color={AppColors.textOnPrimary} name={selected ? "remove" : "add"} pressable={false} />
					</Animated.View>
				</Pressable>
			</View>
		</AppPressable>
	);
}

function Recipe({ action, category, onPress, title }: RecipeItemProps) {
	return (
		<AppPressable onPress={onPress} pressedColor="rgba(0, 75, 147, 0.04)" radius="idle" style={styles.recipe}>
			<View style={styles.recipeTextArea}>
				<AppText.Lg numberOfLines={1}>{title}</AppText.Lg>
				<AppText.Sm color={AppColors.sub} numberOfLines={1}>
					{category}
				</AppText.Sm>
			</View>

			{action && (
				<Pressable
					accessibilityLabel={action.accessibilityLabel}
					hitSlop={8}
					onPress={event => {
						event.stopPropagation();
						action.onPress();
					}}
				>
					<View style={[styles.recipeAction, { backgroundColor: action.color }]}>
						<AppIcon.Sm color={AppColors.textOnPrimary} name={action.icon} pressable={false} />
					</View>
				</Pressable>
			)}
		</AppPressable>
	);
}

export const Item = {
	Recipe,
	SearchResult,
};

export default Item;

const styles = StyleSheet.create({
	searchResult: {
		width: "100%",
		minHeight: 64,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: AppSpacing.md,
		backgroundColor: AppColors.background,
		paddingHorizontal: AppSpacing.md,
		paddingVertical: AppSpacing.sm,
	},
	searchResultTitle: {
		flex: 1,
		minWidth: 0,
	},
	searchResultAside: {
		flexDirection: "row",
		alignItems: "center",
		gap: AppSpacing.sm,
	},
	searchResultAction: {
		width: 32,
		height: 32,
		alignItems: "center",
		justifyContent: "center",
		borderRadius: 999,
	},
	recipe: {
		width: "100%",
		minHeight: 74,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: AppSpacing.md,
		backgroundColor: AppColors.background,
		paddingHorizontal: AppSpacing.md,
		paddingVertical: AppSpacing.sm,
	},
	recipeTextArea: {
		flex: 1,
		minWidth: 0,
	},
	recipeAction: {
		width: 32,
		height: 32,
		alignItems: "center",
		justifyContent: "center",
		borderRadius: 999,
	},
});
