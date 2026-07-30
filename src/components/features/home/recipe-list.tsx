import { FlatList, StyleSheet, View } from "react-native";

import { AppSpacer } from "@/components/base/app-spacer";
import { AppText } from "@/components/base/app-text";
import { Item, type RecipeItemAction } from "@/components/ui/item";
import { AppColors, AppSpacing } from "@/constants/theme";
import type { Recipe } from "@/database/recipe/recipe.type";
import { useSavedRecipesStore } from "@/store/saved-recipes-store";

export type RecipeListProps = {
	contentBottomInset?: number;
	emptyMessage?: string;
	getAction?: (recipe: Recipe) => RecipeItemAction | undefined;
	onPressRecipe?: (recipe: Recipe) => void;
	recipes: Recipe[];
	saveActionEnabled?: boolean;
};

export function RecipeList({
	contentBottomInset = 0,
	emptyMessage = "표시할 레시피가 없습니다.",
	getAction,
	onPressRecipe,
	recipes,
	saveActionEnabled = false,
}: RecipeListProps) {
	const savedRecipeIds = useSavedRecipesStore(state => state.savedRecipeIds);
	const toggleRecipe = useSavedRecipesStore(state => state.toggleRecipe);

	if (recipes.length === 0) {
		return (
			<View style={styles.empty}>
				<AppText.Base color={AppColors.placeholder}>{emptyMessage}</AppText.Base>
			</View>
		);
	}

	return (
		<FlatList
			contentContainerStyle={contentBottomInset > 0 && { paddingBottom: contentBottomInset }}
			data={recipes}
			ItemSeparatorComponent={() => <AppSpacer style={styles.itemSpacer} />}
			keyExtractor={recipe => recipe.id}
			renderItem={({ item: recipe }) => (
				<Item.Recipe
					action={
						saveActionEnabled
							? {
									accessibilityLabel: `${recipe.name} ${savedRecipeIds.includes(recipe.id) ? "저장 삭제" : "저장 추가"}`,
									color: savedRecipeIds.includes(recipe.id) ? "#DC2626" : AppColors.primary,
									icon: savedRecipeIds.includes(recipe.id) ? "remove" : "add",
									onPress: () => toggleRecipe(recipe),
								}
							: getAction?.(recipe)
					}
					category={recipe.subCategory}
					onPress={() => onPressRecipe?.(recipe)}
					title={recipe.name}
				/>
			)}
			showsVerticalScrollIndicator={false}
			style={styles.list}
		/>
	);
}

export default RecipeList;

const styles = StyleSheet.create({
	list: {
		flex: 1,
		width: "100%",
		backgroundColor: AppColors.background,
	},
	empty: {
		flex: 1,
		minHeight: 120,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: AppColors.background,
		paddingHorizontal: AppSpacing.md,
	},
	itemSpacer: {
		opacity: 0.32,
	},
});
