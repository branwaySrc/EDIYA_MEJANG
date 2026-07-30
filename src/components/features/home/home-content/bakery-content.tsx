import { RecipeGroupList } from "@/components/features/home/recipe-group-list";
import { bakerySubCategories, type Recipe, sampleRecipes } from "@/database/recipe/recipe";

const bakeryRecipes = sampleRecipes.filter(recipe => recipe.category === "베이커리");

export type BakeryContentProps = {
	contentBottomInset?: number;
	onPressRecipe?: (recipe: Recipe) => void;
};

export function BakeryContent({ contentBottomInset = 0, onPressRecipe }: BakeryContentProps) {
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
