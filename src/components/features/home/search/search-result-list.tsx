import { useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { AppSpacer } from "@/components/base/app-spacer";
import { AppText } from "@/components/base/app-text";
import { Item } from "@/components/ui/item";
import { AppColors, AppSpacing } from "@/constants/theme";
import { type Recipe, sampleRecipes } from "@/database/recipe/recipe";
import { chosungSearchWithMatches } from "@/lib/chosung-search";
import { useSavedRecipesStore } from "@/store/saved-recipes-store";

export type SearchResultListProps = {
	keyword?: string;
	onPressRecipe?: (recipe: Recipe) => void;
	results?: Recipe[];
};

export function SearchResultList({ keyword = "", onPressRecipe, results = sampleRecipes }: SearchResultListProps) {
	const savedRecipeIds = useSavedRecipesStore(state => state.savedRecipeIds);
	const toggleRecipe = useSavedRecipesStore(state => state.toggleRecipe);
	const hasKeyword = keyword.trim().length > 0;
	const filteredResults = useMemo(
		() =>
			hasKeyword
				? chosungSearchWithMatches(
						{
							getChosungText: recipe => recipe.chosung,
							getText: recipe => recipe.name,
							limit: 4,
							query: keyword,
						},
						results,
					)
				: [],
		[hasKeyword, keyword, results],
	);

	return (
		<View style={styles.container}>
			<View style={styles.sectionHeader}>
				<AppText.Sm bold color={AppColors.primary}>
					검색결과
				</AppText.Sm>
			</View>

			<View style={styles.list}>
				{filteredResults.length === 0 ? (
					<View style={styles.emptyResult}>
						<AppText.Base color={AppColors.placeholder}>검색 결과가 없습니다.</AppText.Base>
					</View>
				) : (
					filteredResults.map(({ highlightRange, item: result }, index) => (
						<View key={result.id}>
							{index > 0 && <AppSpacer style={styles.itemSpacer} />}
							<Item.SearchResult
								category={`${result.category} · ${result.subCategory}`}
								highlightRange={highlightRange}
								onPress={() => onPressRecipe?.(result)}
								onToggle={() => toggleRecipe(result)}
								selected={savedRecipeIds.includes(result.id)}
								title={result.name}
							/>
						</View>
					))
				)}
			</View>
		</View>
	);
}

export default SearchResultList;

const styles = StyleSheet.create({
	container: {
		width: "100%",
		backgroundColor: "#f4f4f4",
	},
	sectionHeader: {
		width: "100%",
		paddingHorizontal: AppSpacing.md,
		paddingVertical: AppSpacing.sm,
		backgroundColor: "#f4f4f4",
	},
	list: {
		width: "100%",
	},
	emptyResult: {
		minHeight: 64,
		justifyContent: "center",
		alignItems: "center",
		paddingVertical: 100,
		backgroundColor: AppColors.background,
	},
	itemSpacer: {
		opacity: 0.32,
	},
});
