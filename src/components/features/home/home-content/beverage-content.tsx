import { useMemo } from "react";

import { RecipeGroupList } from "@/components/features/home/recipe-group-list";
import { beverageSubCategories, type Recipe } from "@/database/recipe/recipe";
import { useContentManagementStore } from "@/store/content-management-store";

export type BeverageContentProps = {
	contentBottomInset?: number;
	onPressRecipe?: (recipe: Recipe) => void;
};

export function BeverageContent({ contentBottomInset = 0, onPressRecipe }: BeverageContentProps) {
	const recipes = useContentManagementStore(state => state.recipes);
	const beverageRecipes = useMemo(() => recipes.filter(recipe => recipe.category === "음료"), [recipes]);

	return (
		<RecipeGroupList
			contentBottomInset={contentBottomInset}
			recipes={beverageRecipes}
			sectionTitles={beverageSubCategories}
			getSectionTitle={recipe => recipe.subCategory}
			emptyMessage="음료 레시피가 없습니다."
			onPressRecipe={onPressRecipe}
			saveActionEnabled
		/>
	);
}

export default BeverageContent;
