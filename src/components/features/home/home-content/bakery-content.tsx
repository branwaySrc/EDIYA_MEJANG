import { useMemo } from "react";

import { RecipeGroupList } from "@/components/features/home/recipe-group-list";
import { bakerySubCategories, type Recipe } from "@/database/recipe/recipe";
import { useContentManagementStore } from "@/store/content-management-store";

export type BakeryContentProps = {
	contentBottomInset?: number;
	onPressRecipe?: (recipe: Recipe) => void;
};

export function BakeryContent({ contentBottomInset = 0, onPressRecipe }: BakeryContentProps) {
	const recipes = useContentManagementStore(state => state.recipes);
	const bakeryRecipes = useMemo(() => recipes.filter(recipe => recipe.category === "베이커리"), [recipes]);

	return (
		<RecipeGroupList
			contentBottomInset={contentBottomInset}
			recipes={bakeryRecipes}
			sectionTitles={bakerySubCategories}
			getSectionTitle={recipe => recipe.subCategory}
			emptyMessage="베이커리 레시피가 없습니다."
			onPressRecipe={onPressRecipe}
			saveActionEnabled
		/>
	);
}

export default BakeryContent;
