import { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";

import { SearchResultList } from "@/components/features/home/search/search-result-list";
import { SearchBox } from "@/components/ui/search/search-box";
import { AppSpacing } from "@/constants/theme";
import type { Recipe } from "@/database/recipe/recipe.type";

export type SearchViewProps = {
	onPressRecipe?: (recipe: Recipe) => void;
};

export function SearchView({ onPressRecipe }: SearchViewProps) {
	const [keyword, setKeyword] = useState("");

	const handleSubmit = useCallback(() => {
		const trimmedKeyword = keyword.trim();

		if (!trimmedKeyword) {
			return;
		}
	}, [keyword]);

	return (
		<View style={styles.container}>
			<View style={styles.searchBoxArea}>
				<SearchBox autoFocus value={keyword} onChangeText={setKeyword} onSubmit={handleSubmit} />
			</View>
			<SearchResultList keyword={keyword} onPressRecipe={onPressRecipe} />
		</View>
	);
}

export default SearchView;

const styles = StyleSheet.create({
	container: {
		width: "100%",
	},
	searchBoxArea: {
		paddingHorizontal: AppSpacing.md,
		paddingBottom: AppSpacing.lg,
	},
});
