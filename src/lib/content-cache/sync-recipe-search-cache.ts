import type { RecipeDetail } from "@/database/recipe/recipe-details.type";
import {
	replaceRecipeSearchCacheAsync,
	type RecipeSearchCacheSnapshot,
} from "@/lib/content-cache/recipe-search-cache";
import {
	listSupabaseFindEntriesAsync,
	listSupabaseRecipeBundlesAsync,
} from "@/lib/sajang-content/supabase-content-repository";

export async function syncRecipeSearchCacheFromSupabaseAsync(): Promise<RecipeSearchCacheSnapshot> {
	const [recipeBundles, findEntryBundles] = await Promise.all([
		listSupabaseRecipeBundlesAsync({ status: "published" }),
		listSupabaseFindEntriesAsync({ status: "published" }),
	]);

	return await replaceRecipeSearchCacheAsync({
		findEntries: findEntryBundles.map(bundle => bundle.entry),
		recipeDetails: Object.fromEntries(
			recipeBundles.map(bundle => [bundle.recipe.id, bundle.detail]),
		) as Record<string, RecipeDetail>,
		recipes: recipeBundles.map(bundle => bundle.recipe),
	});
}
