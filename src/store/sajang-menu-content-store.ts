import { create } from "zustand";

import type { FindEntry } from "@/database/find/find.type";
import type { RecipeDetail } from "@/database/recipe/recipe-details.type";
import type { Recipe } from "@/database/recipe/recipe.type";

type RecipeBundle = {
	detail: RecipeDetail;
	recipe: Recipe;
};

type SajangMenuContent = {
	findEntries: FindEntry[];
	recipeDetails: Record<string, RecipeDetail>;
	recipes: Recipe[];
};

type SajangMenuContentState = SajangMenuContent & {
	deleteFindEntry: (id: string) => void;
	deleteRecipe: (id: string) => void;
	replaceContent: (content: SajangMenuContent) => void;
	upsertFindEntry: (entry: FindEntry) => void;
	upsertRecipeBundle: (bundle: RecipeBundle) => void;
};

function upsertById<Item extends { id: string }>(items: Item[], nextItem: Item) {
	const existingIndex = items.findIndex(item => item.id === nextItem.id);

	if (existingIndex < 0) {
		return [nextItem, ...items];
	}

	return items.map(item => (item.id === nextItem.id ? nextItem : item));
}

export const useSajangMenuContentStore = create<SajangMenuContentState>()(set => ({
	deleteFindEntry: id =>
		set(state => ({
			findEntries: state.findEntries.filter(entry => entry.id !== id),
		})),
	deleteRecipe: id =>
		set(state => ({
			findEntries: state.findEntries.filter(entry => entry.recipeId !== id),
			recipeDetails: Object.fromEntries(
				Object.entries(state.recipeDetails).filter(([recipeId]) => recipeId !== id),
			) as Record<string, RecipeDetail>,
			recipes: state.recipes.filter(recipe => recipe.id !== id),
		})),
	findEntries: [],
	recipeDetails: {},
	recipes: [],
	replaceContent: content => set(content),
	upsertFindEntry: entry =>
		set(state => ({
			findEntries: upsertById(state.findEntries, entry),
		})),
	upsertRecipeBundle: ({ detail, recipe }) =>
		set(state => ({
			recipeDetails: {
				...state.recipeDetails,
				[recipe.id]: detail,
			},
			recipes: upsertById(state.recipes, recipe),
		})),
}));
