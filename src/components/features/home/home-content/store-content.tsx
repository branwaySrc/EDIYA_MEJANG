import LottieView from "lottie-react-native";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/base/app-text";
import { RecipeSectionList } from "@/components/features/home/recipe-section-list";
import { AppColors, AppSpacing } from "@/constants/theme";
import type { Recipe } from "@/database/recipe/recipe.type";
import { useSavedRecipesStore } from "@/store/saved-recipes-store";

const coffeeMachineAnimation = require("../../../../../assets/animate-icon/coffee-machine.json");

export type StoreContentProps = {
	contentBottomInset?: number;
	onPressRecipe?: (recipe: Recipe) => void;
};

export function StoreContent({ contentBottomInset = 0, onPressRecipe }: StoreContentProps) {
	const recipes = useSavedRecipesStore(state => state.recipes);
	const removeRecipe = useSavedRecipesStore(state => state.removeRecipe);

	if (recipes.length === 0) {
		return (
			<View style={styles.emptyContainer}>
				<View style={styles.emptyAnimationFrame}>
					<LottieView
						autoPlay
						loop
						resizeMode="contain"
						source={coffeeMachineAnimation}
						style={styles.emptyAnimation}
					/>
				</View>
				<View style={styles.emptyTextArea}>
					<AppText.Lg bold style={styles.centerText}>
						저장된 레시피가 없어요!
					</AppText.Lg>
					<AppText.Base color={AppColors.placeholder} style={styles.centerText}>
						여러개를 저장해서 편안하게 볼 수 있어요.
					</AppText.Base>
				</View>
			</View>
		);
	}

	return (
		<View style={styles.listContainer}>
			<RecipeSectionList
				contentBottomInset={contentBottomInset}
				recipes={recipes}
				onPressRecipe={onPressRecipe}
				getAction={recipe => ({
					accessibilityLabel: `${recipe.name} 저장 삭제`,
					color: "#DC2626",
					icon: "remove",
					onPress: () => removeRecipe(recipe.id),
				})}
			/>
		</View>
	);
}

export default StoreContent;

const styles = StyleSheet.create({
	emptyContainer: {
		flex: 1,
		minHeight: 400,
		alignItems: "center",
		justifyContent: "center",
		gap: AppSpacing.md,
		paddingVertical: AppSpacing.xl,
	},
	emptyAnimationFrame: {
		width: 184,
		height: 184,
	},
	emptyAnimation: {
		width: "100%",
		height: "100%",
	},
	emptyTextArea: {
		alignItems: "center",
		gap: AppSpacing.sm,
	},
	centerText: {
		textAlign: "center",
	},
	listContainer: {
		flex: 1,
		width: "100%",
	},
});
