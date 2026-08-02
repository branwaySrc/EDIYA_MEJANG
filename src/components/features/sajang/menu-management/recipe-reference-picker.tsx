import { useMemo, useState } from "react";
import { FlatList, Modal, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppIcon } from "@/components/base/app-icon";
import { AppPressable } from "@/components/base/app-pressable";
import { AppSpacer } from "@/components/base/app-spacer";
import { AppText } from "@/components/base/app-text";
import { SearchBox } from "@/components/ui/search/search-box";
import { AppColors, AppSpacing } from "@/constants/theme";
import type { Recipe } from "@/database/recipe/recipe.type";
import { chosungSearchWithMatches } from "@/lib/chosung-search";

export function RecipeReferencePicker({
	onChange,
	recipes,
	value,
}: {
	onChange: (recipeId: string) => void;
	recipes: Recipe[];
	value: string;
}) {
	const [open, setOpen] = useState(false);
	const [keyword, setKeyword] = useState("");
	const selectedRecipe = recipes.find(recipe => recipe.id === value);
	const visibleRecipes = useMemo(() => {
		if (!keyword.trim()) {
			return recipes;
		}

		return chosungSearchWithMatches(
			{
				getChosungText: recipe => recipe.chosung,
				getText: recipe => recipe.name,
				limit: recipes.length,
				query: keyword,
			},
			recipes,
		).map(result => result.item);
	}, [keyword, recipes]);

	return (
		<>
			<View style={styles.field}>
				<AppText.Sm bold color={AppColors.sub}>
					연결 메뉴
				</AppText.Sm>
				<AppPressable
					accessibilityLabel="연결 메뉴 선택"
					onPress={() => setOpen(true)}
					pressedColor="rgba(0, 75, 147, 0.08)"
					radius="base"
					style={styles.selectButton}
				>
					<AppText.Base color={selectedRecipe ? AppColors.text : AppColors.placeholder} numberOfLines={1} style={styles.selectedText}>
						{selectedRecipe?.name ?? "메뉴를 선택해 주세요"}
					</AppText.Base>
					<AppIcon.Sm color={AppColors.primary} name="chevron-forward" pressable={false} />
				</AppPressable>
			</View>

			<Modal animationType="slide" onRequestClose={() => setOpen(false)} visible={open}>
				<SafeAreaView style={styles.modal}>
					<View style={styles.modalHeader}>
						<AppIcon.Lg
							accessibilityLabel="메뉴 선택 닫기"
							color={AppColors.textOnPrimary}
							name="arrow-back"
							onPress={() => setOpen(false)}
							pressedColor="rgba(255, 255, 255, 0.14)"
						/>
						<AppText.Lg bold color={AppColors.textOnPrimary}>
							연결 메뉴 선택
						</AppText.Lg>
					</View>
					<View style={styles.searchArea}>
						<SearchBox
							onChangeText={setKeyword}
							onSubmit={() => undefined}
							placeholder="메뉴명 검색"
							showSubmitButton={false}
							value={keyword}
						/>
					</View>
					<FlatList
						data={visibleRecipes}
						ItemSeparatorComponent={() => <AppSpacer style={styles.separator} />}
						keyExtractor={recipe => recipe.id}
						keyboardShouldPersistTaps="handled"
						renderItem={({ item: recipe }) => (
							<AppPressable
								accessibilityLabel={`${recipe.name} 선택`}
								onPress={() => {
									onChange(recipe.id);
									setOpen(false);
									setKeyword("");
								}}
								pressedColor="rgba(0, 75, 147, 0.04)"
								radius="idle"
								style={styles.recipeRow}
							>
								<View style={styles.recipeText}>
									<AppText.Base bold numberOfLines={1}>
										{recipe.name}
									</AppText.Base>
									<AppText.Sm color={AppColors.sub} numberOfLines={1}>
										{recipe.category} · {recipe.subCategory}
									</AppText.Sm>
								</View>
								{recipe.id === value ? (
									<AppIcon.Base color={AppColors.primary} name="checkmark-circle" pressable={false} />
								) : null}
							</AppPressable>
						)}
						style={styles.list}
					/>
				</SafeAreaView>
			</Modal>
		</>
	);
}

const styles = StyleSheet.create({
	field: {
		width: "100%",
		gap: AppSpacing.xs,
	},
	selectButton: {
		minHeight: 48,
		flexDirection: "row",
		alignItems: "center",
		gap: AppSpacing.sm,
		borderWidth: 1,
		borderColor: "rgba(71, 85, 105, 0.36)",
		paddingHorizontal: AppSpacing.sm,
	},
	selectedText: {
		flex: 1,
		minWidth: 0,
	},
	modal: {
		flex: 1,
		backgroundColor: AppColors.background,
	},
	modalHeader: {
		minHeight: 56,
		flexDirection: "row",
		alignItems: "center",
		gap: AppSpacing.sm,
		backgroundColor: AppColors.primary,
		paddingHorizontal: AppSpacing.md,
	},
	searchArea: {
		padding: AppSpacing.md,
	},
	list: {
		flex: 1,
	},
	recipeRow: {
		minHeight: 70,
		flexDirection: "row",
		alignItems: "center",
		gap: AppSpacing.sm,
		paddingHorizontal: AppSpacing.md,
		paddingVertical: AppSpacing.sm,
	},
	recipeText: {
		flex: 1,
		minWidth: 0,
	},
	separator: {
		opacity: 0.32,
	},
});
