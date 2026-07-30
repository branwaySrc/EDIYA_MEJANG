import { create } from "zustand";

import type { Recipe } from "@/database/recipe/recipe.type";

type SavedRecipesState = {
	recipes: Recipe[];
	removeRecipe: (id: string) => void;
	savedRecipeIds: string[];
	toggleRecipe: (recipe: Recipe) => void;
};

export const useSavedRecipesStore = create<SavedRecipesState>(set => ({
	recipes: [],
	savedRecipeIds: [],
	removeRecipe: id =>
		set(state => ({
			recipes: state.recipes.filter(recipe => recipe.id !== id),
			savedRecipeIds: state.savedRecipeIds.filter(savedId => savedId !== id),
		})),
	toggleRecipe: recipe =>
		set(state => {
			const saved = state.savedRecipeIds.includes(recipe.id);

			if (saved) {
				return {
					recipes: state.recipes.filter(savedRecipe => savedRecipe.id !== recipe.id),
					savedRecipeIds: state.savedRecipeIds.filter(savedId => savedId !== recipe.id),
				};
			}

			return {
				recipes: [...state.recipes, recipe],
				savedRecipeIds: [...state.savedRecipeIds, recipe.id],
			};
		}),
}));
