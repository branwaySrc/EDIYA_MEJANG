import { SectionList, StyleSheet } from "react-native";

import { AppSpacer } from "@/components/base/app-spacer";
import { AppText } from "@/components/base/app-text";
import { Item, type RecipeItemAction } from "@/components/ui/item";
import { AppColors, AppSpacing } from "@/constants/theme";
import type { Recipe, RecipeCategory } from "@/database/recipe/recipe.type";

export type RecipeSectionListProps = {
	contentBottomInset?: number;
	getAction?: (recipe: Recipe) => RecipeItemAction | undefined;
	onPressRecipe?: (recipe: Recipe) => void;
	recipes: Recipe[];
};

const recipeCategories: RecipeCategory[] = ["음료", "베이커리", "이벤트"];

export function RecipeSectionList({ contentBottomInset = 0, getAction, onPressRecipe, recipes }: RecipeSectionListProps) {
	const sections = recipeCategories
		.map(category => ({
			data: recipes.filter(recipe => recipe.category === category),
			title: category,
		}))
		.filter(section => section.data.length > 0);

	return (
		<SectionList
			contentContainerStyle={[styles.content, contentBottomInset > 0 && { paddingBottom: contentBottomInset }]}
			ItemSeparatorComponent={() => <AppSpacer style={styles.itemSpacer} />}
			keyExtractor={recipe => recipe.id}
			renderItem={({ item: recipe }) => (
				<Item.Recipe
					action={getAction?.(recipe)}
					category={recipe.subCategory}
					onPress={() => onPressRecipe?.(recipe)}
					title={recipe.name}
				/>
			)}
			renderSectionHeader={({ section }) => (
				<AppText.Sm bold color={AppColors.primary} style={styles.sectionHeader}>
					{section.title}
				</AppText.Sm>
			)}
			sections={sections}
			showsVerticalScrollIndicator={false}
			stickySectionHeadersEnabled={false}
			style={styles.container}
		/>
	);
}

export default RecipeSectionList;

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
	itemSpacer: {
		opacity: 0.32,
	},
});
