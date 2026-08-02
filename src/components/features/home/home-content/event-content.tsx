import { useMemo } from "react";

import { RecipeGroupList } from "@/components/features/home/recipe-group-list";
import { eventSubCategories, type Recipe } from "@/database/recipe/recipe";
import { useContentManagementStore } from "@/store/content-management-store";

export type EventContentProps = {
	contentBottomInset?: number;
	onPressRecipe?: (recipe: Recipe) => void;
};

export function EventContent({ contentBottomInset = 0, onPressRecipe }: EventContentProps) {
	const recipes = useContentManagementStore(state => state.recipes);
	const eventRecipes = useMemo(() => recipes.filter(recipe => recipe.category === "이벤트"), [recipes]);

	return (
		<RecipeGroupList
			contentBottomInset={contentBottomInset}
			recipes={eventRecipes}
			sectionTitles={eventSubCategories}
			getSectionTitle={recipe => recipe.subCategory}
			emptyMessage="이벤트 레시피가 없습니다."
			onPressRecipe={onPressRecipe}
			saveActionEnabled
		/>
	);
}

export default EventContent;
