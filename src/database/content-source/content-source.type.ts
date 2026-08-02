import type { FindEntry, FindEntryKind } from "@/database/find/find.type";
import type { RecipeDetail } from "@/database/recipe/recipe-details.type";
import type { Recipe } from "@/database/recipe/recipe.type";

export type ContentStatus = "archived" | "draft" | "published";

export type SupabaseRecipeRow = {
	category: string;
	chosung: string | null;
	created_at: string;
	id: string;
	name: string;
	sort_order: number;
	status: ContentStatus;
	sub_category: string;
	updated_at: string;
};

export type SupabaseRecipeDetailRow = {
	created_at: string;
	delivery: RecipeDetail["delivery"];
	hero_visuals: RecipeDetail["heroVisuals"];
	packaging: RecipeDetail["packaging"];
	recipe_id: string;
	steps: RecipeDetail["steps"];
	store_serving: RecipeDetail["storeServing"];
	updated_at: string;
};

export type SupabaseFindEntryRow = {
	chosung: string | null;
	created_at: string;
	id: string;
	kind: FindEntryKind;
	notes: string | null;
	payload: FindEntry;
	recipe_id: string;
	sort_order: number;
	status: ContentStatus;
	summary: string;
	title: string;
	updated_at: string;
};

export type SupabaseFindEntryKeywordRow = {
	entry_id: string;
	keyword: string;
	sort_order: number;
};

export type SupabaseRecipeBundle = {
	detail: RecipeDetail;
	recipe: Recipe;
	status: ContentStatus;
};

export type SupabaseFindEntryBundle = {
	entry: FindEntry;
	status: ContentStatus;
};
