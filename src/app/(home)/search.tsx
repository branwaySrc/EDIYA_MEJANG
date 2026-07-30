import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { StyleSheet } from "react-native";

import { RecipeDetailDrawer } from "@/components/features/home/recipe-detail/recipe-detail-drawer";
import { SearchView } from "@/components/features/home/search/search-view";
import { AppLayout } from "@/components/global/app-layout";
import { AppSpacing } from "@/constants/theme";
import type { Recipe } from "@/database/recipe/recipe.type";

export default function SearchScreen() {
	const router = useRouter();
	const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
	const [recipeDrawerOpen, setRecipeDrawerOpen] = useState(false);

	const openRecipeDrawer = useCallback((recipe: Recipe) => {
		setSelectedRecipe(recipe);
		setRecipeDrawerOpen(true);
	}, []);

	const closeRecipeDrawer = useCallback(() => {
		setRecipeDrawerOpen(false);
	}, []);

	return (
		<>
		<AppLayout
			drawerEnabled={false}
			leadingMode="back"
			onPressBack={() => {
				if (router.canGoBack()) {
					router.back();
					return;
				}

				router.replace("/");
			}}
			title="레시피 검색"
			type="scrollview"
			contentContainerStyle={styles.content}
		>
			<SearchView onPressRecipe={openRecipeDrawer} />
		</AppLayout>
			<RecipeDetailDrawer onClose={closeRecipeDrawer} open={recipeDrawerOpen} recipe={selectedRecipe} />
		</>
	);
}

const styles = StyleSheet.create({
	content: {
		paddingVertical: AppSpacing.md,
	},
});
