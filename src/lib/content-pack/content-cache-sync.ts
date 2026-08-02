import type { LocalContentPackMetadata } from "@/database/content-pack/content-pack";
import type { RecipeDetail } from "@/database/recipe/recipe-details.type";
import { localContentPackSchema } from "@/database/content-pack/content-pack";
import { replaceLocalRecipeSearchContentAsync } from "@/lib/content-pack/local-content-pack";
import {
	listSupabaseFindEntriesAsync,
	listSupabaseRecipeBundlesAsync,
} from "@/lib/sajang-content/supabase-content-repository";

export type RecipeSearchCacheSyncResult = {
	findEntryCount: number;
	metadata: LocalContentPackMetadata;
	recipeCount: number;
};

export async function syncRecipeSearchCacheFromSupabaseAsync(): Promise<RecipeSearchCacheSyncResult> {
	const [recipeBundles, findEntryBundles] = await Promise.all([
		listSupabaseRecipeBundlesAsync({ status: "published" }),
		listSupabaseFindEntriesAsync({ status: "published" }),
	]);
	const appliedAt = new Date().toISOString();
	const metadata = await replaceLocalRecipeSearchContentAsync({
		findEntries: findEntryBundles.map(bundle => bundle.entry),
		metadata: {
			appliedAt,
			packVersion: createCacheVersion(appliedAt),
			schemaVersion: localContentPackSchema.currentSchemaVersion,
		},
		recipeDetails: Object.fromEntries(
			recipeBundles.map(bundle => [bundle.recipe.id, bundle.detail]),
		) as Record<string, RecipeDetail>,
		recipes: recipeBundles.map(bundle => bundle.recipe),
	});

	return {
		findEntryCount: findEntryBundles.length,
		metadata,
		recipeCount: recipeBundles.length,
	};
}

function createCacheVersion(appliedAt: string) {
	return `cache-${appliedAt.replace(/\D/g, "").slice(0, 14)}`;
}
