import { RecipeGroupList } from "@/components/features/home/recipe-group-list";
import { beverageSubCategories, type Recipe, sampleRecipes } from "@/database/recipe/recipe";

const beverageRecipes = sampleRecipes.filter(recipe => recipe.category === "음료");

export type BeverageContentProps = {
	contentBottomInset?: number;
	onPressRecipe?: (recipe: Recipe) => void;
};

export function BeverageContent({ contentBottomInset = 0, onPressRecipe }: BeverageContentProps) {
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
