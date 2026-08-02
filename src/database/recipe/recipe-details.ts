import type { Recipe } from "@/database/recipe/recipe.type";
import type { RecipeDetail } from "@/database/recipe/recipe-details.type";

export type { RecipeDetail, RecipeStep, RecipeVisual } from "@/database/recipe/recipe-details.type";

function createEmptyRecipeDetail(): RecipeDetail {
	return {
		delivery: [],
		heroVisuals: [],
		packaging: [],
		storeServing: [],
		steps: [],
	};
}

export function getRecipeDetail(_recipe: Recipe): RecipeDetail {
	return createEmptyRecipeDetail();
}
