import { SectionList, StyleSheet, View } from "react-native";

import { AppSpacer } from "@/components/base/app-spacer";
import { AppText } from "@/components/base/app-text";
import { Item, type RecipeItemAction } from "@/components/ui/item";
import { AppColors, AppSpacing } from "@/constants/theme";
import type { Recipe } from "@/database/recipe/recipe.type";
import { useSavedRecipesStore } from "@/store/saved-recipes-store";

export type RecipeGroupListProps = {
	contentBottomInset?: number;
	emptyMessage?: string;
	getAction?: (recipe: Recipe) => RecipeItemAction | undefined;
	getSectionTitle: (recipe: Recipe) => string;
	onPressRecipe?: (recipe: Recipe) => void;
	recipes: Recipe[];
	saveActionEnabled?: boolean;
	sectionTitles: string[];
	showEmptySections?: boolean;
};

export function RecipeGroupList({
	contentBottomInset = 0,
	emptyMessage = "표시할 레시피가 없습니다.",
	getAction,
	getSectionTitle,
	onPressRecipe,
	recipes,
	saveActionEnabled = false,
	sectionTitles,
	showEmptySections = false,
}: RecipeGroupListProps) {
	const savedRecipeIds = useSavedRecipesStore(state => state.savedRecipeIds);
	const toggleRecipe = useSavedRecipesStore(state => state.toggleRecipe);
	const visibleSections = sectionTitles
		.map(title => ({
			data: recipes.filter(recipe => getSectionTitle(recipe) === title),
			title,
		}))
		.filter(section => showEmptySections || section.data.length > 0);

	if (recipes.length === 0) {
		return (
			<View style={styles.empty}>
				<AppText.Base color={AppColors.placeholder}>{emptyMessage}</AppText.Base>
			</View>
		);
	}

	return (
		<SectionList
			contentContainerStyle={[styles.content, contentBottomInset > 0 && { paddingBottom: contentBottomInset }]}
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
			renderSectionHeader={({ section }) => (
				<View style={styles.sectionHeader}>
					<AppText.Sm bold color={AppColors.primary}>
						{section.title}
					</AppText.Sm>
				</View>
			)}
			sections={visibleSections}
			showsVerticalScrollIndicator={false}
			stickySectionHeadersEnabled={false}
			style={styles.container}
		/>
	);
}

export default RecipeGroupList;

const styles = StyleSheet.create({
	container: {
		flex: 1,
		width: "100%",
		backgroundColor: "#f4f4f4",
	},
	content: {
		backgroundColor: AppColors.background,
	},
	sectionHeader: {
		width: "100%",
		paddingHorizontal: AppSpacing.md,
		paddingVertical: AppSpacing.sm,
		backgroundColor: "#f4f4f4",
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
