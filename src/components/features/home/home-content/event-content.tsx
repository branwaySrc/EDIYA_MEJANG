import { RecipeGroupList } from "@/components/features/home/recipe-group-list";
import { eventSubCategories, type Recipe, sampleRecipes } from "@/database/recipe/recipe";

const eventRecipes = sampleRecipes.filter(recipe => recipe.category === "이벤트");

export type EventContentProps = {
	contentBottomInset?: number;
	onPressRecipe?: (recipe: Recipe) => void;
};

export function EventContent({ contentBottomInset = 0, onPressRecipe }: EventContentProps) {
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
