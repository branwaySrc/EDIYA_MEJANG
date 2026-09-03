import type {
	ContentStatus,
	SupabaseFindEntryBundle,
	SupabaseFindEntryKeywordRow,
	SupabaseFindEntryRow,
	SupabaseRecipeBundle,
	SupabaseRecipeDetailRow,
	SupabaseRecipeRow,
} from "@/database/content-source/content-source.type";
import type { FindEntry } from "@/database/find/find.type";
import type { RecipeDetail } from "@/database/recipe/recipe-details.type";
import type { Recipe } from "@/database/recipe/recipe.type";
import {
	getFindEntryStoragePaths,
	getRecipeDetailStoragePaths,
	removeContentImagesBestEffortAsync,
	toStoredFindEntry,
	toStoredRecipeDetail,
	withPublicFindEntryImageUrls,
	withPublicRecipeDetailImageUrls,
} from "@/lib/sajang-content/supabase-content-images";
import { getSupabaseClientOrNull } from "@/lib/supabase/supabase-client";

type ListContentOptions = {
	includeArchived?: boolean;
	status?: ContentStatus;
};

type UpsertRecipeBundleInput = {
	detail: RecipeDetail;
	recipe: Recipe;
	status?: ContentStatus;
};

type UpsertFindEntryInput = {
	entry: FindEntry;
	status?: ContentStatus;
};

const defaultContentStatus: ContentStatus = "published";

export async function listSupabaseRecipeBundlesAsync({
	includeArchived = false,
	status,
}: ListContentOptions = {}): Promise<SupabaseRecipeBundle[]> {
	const supabase = getConfiguredSupabaseClient();
	let query = supabase.from("recipes").select("*, recipe_details(*)").order("sort_order", { ascending: true });

	if (status) {
		query = query.eq("status", status);
	} else if (!includeArchived) {
		query = query.neq("status", "archived");
	}

	const { data, error } = await query.returns<(SupabaseRecipeRow & { recipe_details: SupabaseRecipeDetailRow | null })[]>();

	if (error) {
		throw error;
	}

	return data.map(rowToRecipeBundle);
}

export async function listSupabaseFindEntriesAsync({
	includeArchived = false,
	status,
}: ListContentOptions = {}): Promise<SupabaseFindEntryBundle[]> {
	const supabase = getConfiguredSupabaseClient();
	let query = supabase.from("find_entries").select("*").order("sort_order", { ascending: true });

	if (status) {
		query = query.eq("status", status);
	} else if (!includeArchived) {
		query = query.neq("status", "archived");
	}

	const { data, error } = await query.returns<SupabaseFindEntryRow[]>();

	if (error) {
		throw error;
	}

	return data.map(row => ({
		entry: withPublicFindEntryImageUrls(row.payload),
		status: row.status,
	}));
}

export async function upsertSupabaseRecipeBundleAsync({
	detail,
	recipe,
	status = defaultContentStatus,
}: UpsertRecipeBundleInput): Promise<void> {
	const supabase = getConfiguredSupabaseClient();
	const recipeRow = recipeToRow(recipe, status);
	const detailRow = recipeDetailToRow(recipe.id, detail, recipe.updatedAt);
	const recipeResult = await supabase.from("recipes").upsert(recipeRow, { onConflict: "id" });

	if (recipeResult.error) {
		throw recipeResult.error;
	}

	const detailResult = await supabase.from("recipe_details").upsert(detailRow, { onConflict: "recipe_id" });

	if (detailResult.error) {
		throw detailResult.error;
	}
}

export async function upsertSupabaseFindEntryAsync({
	entry,
	status = defaultContentStatus,
}: UpsertFindEntryInput): Promise<void> {
	const supabase = getConfiguredSupabaseClient();
	const entryRow = findEntryToRow(entry, status);
	const entryResult = await supabase.from("find_entries").upsert(entryRow, { onConflict: "id" });

	if (entryResult.error) {
		throw entryResult.error;
	}

	const keywordRows = entry.keywords.map((keyword, index): SupabaseFindEntryKeywordRow => ({
		entry_id: entry.id,
		keyword,
		sort_order: index,
	}));

	const deleteResult = await supabase.from("find_entry_keywords").delete().eq("entry_id", entry.id);

	if (deleteResult.error) {
		throw deleteResult.error;
	}

	if (keywordRows.length === 0) {
		return;
	}

	const keywordResult = await supabase.from("find_entry_keywords").insert(keywordRows);

	if (keywordResult.error) {
		throw keywordResult.error;
	}
}

export async function deleteSupabaseRecipeBundleAsync(recipeId: string): Promise<void> {
	const supabase = getConfiguredSupabaseClient();
	const detailResult = await supabase
		.from("recipe_details")
		.select("*")
		.eq("recipe_id", recipeId)
		.maybeSingle<SupabaseRecipeDetailRow>();

	if (detailResult.error) {
		throw detailResult.error;
	}

	const { error } = await supabase.from("recipes").delete().eq("id", recipeId);

	if (error) {
		throw error;
	}

	if (detailResult.data) {
		await removeContentImagesBestEffortAsync(
			getRecipeDetailStoragePaths(recipeDetailRowToDetail(detailResult.data)),
		);
	}
}

export async function deleteSupabaseFindEntryAsync(entryId: string): Promise<void> {
	const supabase = getConfiguredSupabaseClient();
	const entryResult = await supabase
		.from("find_entries")
		.select("payload")
		.eq("id", entryId)
		.maybeSingle<Pick<SupabaseFindEntryRow, "payload">>();

	if (entryResult.error) {
		throw entryResult.error;
	}

	const { error } = await supabase.from("find_entries").delete().eq("id", entryId);

	if (error) {
		throw error;
	}

	if (entryResult.data) {
		await removeContentImagesBestEffortAsync(
			getFindEntryStoragePaths(entryResult.data.payload),
		);
	}
}

function getConfiguredSupabaseClient() {
	const supabase = getSupabaseClientOrNull();

	if (!supabase) {
		throw new Error("Supabase is not configured. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_KEY.");
	}

	return supabase;
}

function rowToRecipeBundle(row: SupabaseRecipeRow & { recipe_details: SupabaseRecipeDetailRow | null }): SupabaseRecipeBundle {
	return {
		detail: row.recipe_details
			? withPublicRecipeDetailImageUrls(recipeDetailRowToDetail(row.recipe_details))
			: {
					delivery: [],
					heroVisuals: [],
					packaging: [],
					steps: [],
					storeServing: [],
				},
		recipe: {
			category: row.category as Recipe["category"],
			chosung: row.chosung ?? undefined,
			createdAt: row.created_at,
			id: row.id,
			name: row.name,
			subCategory: row.sub_category as Recipe["subCategory"],
			updatedAt: row.updated_at,
		},
		status: row.status,
	};
}

function recipeDetailRowToDetail(row: SupabaseRecipeDetailRow): RecipeDetail {
	return {
		delivery: row.delivery,
		heroVisuals: row.hero_visuals,
		packaging: row.packaging,
		steps: row.steps,
		storeServing: row.store_serving,
	};
}

function recipeToRow(recipe: Recipe, status: ContentStatus): SupabaseRecipeRow {
	return {
		category: recipe.category,
		chosung: recipe.chosung ?? null,
		created_at: recipe.createdAt,
		id: recipe.id,
		name: recipe.name,
		sort_order: 0,
		status,
		sub_category: recipe.subCategory,
		updated_at: recipe.updatedAt,
	};
}

function recipeDetailToRow(recipeId: string, detail: RecipeDetail, updatedAt: string): SupabaseRecipeDetailRow {
	const storedDetail = toStoredRecipeDetail(detail);

	return {
		created_at: updatedAt,
		delivery: storedDetail.delivery,
		hero_visuals: storedDetail.heroVisuals,
		packaging: storedDetail.packaging,
		recipe_id: recipeId,
		steps: storedDetail.steps,
		store_serving: storedDetail.storeServing,
		updated_at: updatedAt,
	};
}

function findEntryToRow(entry: FindEntry, status: ContentStatus): SupabaseFindEntryRow {
	const storedEntry = toStoredFindEntry(entry);

	return {
		chosung: storedEntry.chosung ?? null,
		created_at: storedEntry.updatedAt,
		id: storedEntry.id,
		kind: storedEntry.kind,
		notes: storedEntry.notes ?? null,
		payload: storedEntry,
		recipe_id: storedEntry.recipeId,
		sort_order: 0,
		status,
		summary: storedEntry.summary,
		title: storedEntry.title,
		updated_at: storedEntry.updatedAt,
	};
}
