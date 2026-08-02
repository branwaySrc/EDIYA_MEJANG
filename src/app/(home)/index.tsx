import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { StyleSheet } from "react-native";

import { AppIcon } from "@/components/base/app-icon";
import { BakeryContent } from "@/components/features/home/home-content/bakery-content";
import { BeverageContent } from "@/components/features/home/home-content/beverage-content";
import { EventContent } from "@/components/features/home/home-content/event-content";
import { StoreContent } from "@/components/features/home/home-content/store-content";
import { HomeTabMenu, type HomeTabId } from "@/components/features/home/home-tab-menu";
import { RecipeDetailDrawer } from "@/components/features/home/recipe-detail/recipe-detail-drawer";
import { FloatingSearch } from "@/components/features/home/search/floating-search";
import { AppLayout } from "@/components/global/app-layout";
import { AppColors, AppSpacing } from "@/constants/theme";
import type { Recipe } from "@/database/recipe/recipe.type";
import { useContentManagementStore } from "@/store/content-management-store";

const floatingSearchButtonSize = 64;
const floatingSearchBottomOffset = 64;
const floatingSearchClearance = floatingSearchBottomOffset + floatingSearchButtonSize + AppSpacing.xl;

const pageTitle = "EDIYA-월피동점";

export default function HomeScreen() {
	const router = useRouter();
	const [activeTabId, setActiveTabId] = useState<HomeTabId>("store");
	const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
	const [recipeDrawerOpen, setRecipeDrawerOpen] = useState(false);
	const recipeDetails = useContentManagementStore(state => state.recipeDetails);

	const openRecipeDrawer = useCallback((recipe: Recipe) => {
		setSelectedRecipe(recipe);
		setRecipeDrawerOpen(true);
	}, []);

	const closeRecipeDrawer = useCallback(() => {
		setRecipeDrawerOpen(false);
	}, []);

	const activeContent = useMemo(() => {
		switch (activeTabId) {
			case "beverage":
				return <BeverageContent contentBottomInset={floatingSearchClearance} onPressRecipe={openRecipeDrawer} />;
			case "bakery":
				return <BakeryContent contentBottomInset={floatingSearchClearance} onPressRecipe={openRecipeDrawer} />;
			case "event":
				return <EventContent contentBottomInset={floatingSearchClearance} onPressRecipe={openRecipeDrawer} />;
			case "store":
			default:
				return <StoreContent contentBottomInset={floatingSearchClearance} onPressRecipe={openRecipeDrawer} />;
		}
	}, [activeTabId, openRecipeDrawer]);

	return (
		<>
			<AppLayout
				title={pageTitle}
				type="view"
				aside={
					<>
						<AppIcon.Base
							accessibilityLabel="검색 화면 열기"
							color={AppColors.textOnPrimary}
							name="search"
							onPress={() => router.push("/search")}
							pressedColor="rgba(255, 255, 255, 0.14)"
						/>
						<AppIcon.Base
							accessibilityLabel="설정 화면 열기"
							color={AppColors.textOnPrimary}
							name="settings-outline"
							onPress={() => router.push("/settings")}
							pressedColor="rgba(255, 255, 255, 0.14)"
						/>
					</>
				}
				contentStyle={styles.content}
				floatingSlot={<FloatingSearch />}
				topSlot={<HomeTabMenu activeId={activeTabId} onChange={setActiveTabId} />}
			>
				{activeContent}
			</AppLayout>
			<RecipeDetailDrawer
				detail={selectedRecipe ? recipeDetails[selectedRecipe.id] : undefined}
				onClose={closeRecipeDrawer}
				open={recipeDrawerOpen}
				recipe={selectedRecipe}
			/>
		</>
	);
}

const styles = StyleSheet.create({
	content: {
		flex: 1,
	},
});
