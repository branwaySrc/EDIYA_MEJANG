import { type Href, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";

import { AppSpacer } from "@/components/base/app-spacer";
import { AppText } from "@/components/base/app-text";
import { FindDetailDrawer } from "@/components/features/find/find-detail-drawer";
import { RecipeDetailDrawer } from "@/components/features/home/recipe-detail/recipe-detail-drawer";
import { ManagementDetailActions } from "@/components/features/sajang/management/management-detail-actions";
import {
	ManagementHeaderAddButton,
	ManagementItemRow,
	ManagementOptionSelector,
} from "@/components/features/sajang/management/management-ui";
import { AppLayout } from "@/components/global/app-layout";
import { SearchBox } from "@/components/ui/search/search-box";
import { UnderlineTabMenu, type UnderlineTabItem } from "@/components/ui/underline-tab-menu";
import { AppColors, AppSpacing } from "@/constants/theme";
import type { FindEntry, FindEntryKind } from "@/database/find/find.type";
import type { Recipe } from "@/database/recipe/recipe.type";
import { chosungSearch } from "@/lib/chosung-search";
import {
	deleteSupabaseFindEntryAsync,
	deleteSupabaseRecipeBundleAsync,
	listSupabaseFindEntriesAsync,
	listSupabaseRecipeBundlesAsync,
} from "@/lib/sajang-content/supabase-content-repository";
import { useAppToastStore } from "@/store/app-toast-store";
import { useSajangMenuContentStore } from "@/store/sajang-menu-content-store";
import { useSavedRecipesStore } from "@/store/saved-recipes-store";

type ManagementTabId = "menu" | "find";

const managementTabs: UnderlineTabItem<ManagementTabId>[] = [
	{ id: "menu", label: "메뉴관리" },
	{ id: "find", label: "통합관리" },
];

const kindOptions: readonly { label: string; value: FindEntryKind }[] = [
	{ label: "재료", value: "material" },
	{ label: "POS", value: "pos" },
];

function EmptyManagementList() {
	return (
		<View style={styles.empty}>
			<AppText.Base color={AppColors.placeholder}>표시할 항목이 없습니다.</AppText.Base>
		</View>
	);
}

export default function SajangMenuAddScreen() {
	const router = useRouter();
	const recipes = useSajangMenuContentStore(state => state.recipes);
	const recipeDetails = useSajangMenuContentStore(state => state.recipeDetails);
	const findEntries = useSajangMenuContentStore(state => state.findEntries);
	const deleteFindEntry = useSajangMenuContentStore(state => state.deleteFindEntry);
	const deleteRecipe = useSajangMenuContentStore(state => state.deleteRecipe);
	const replaceContent = useSajangMenuContentStore(state => state.replaceContent);
	const removeSavedRecipe = useSavedRecipesStore(state => state.removeRecipe);
	const showToast = useAppToastStore(state => state.showToast);
	const [activeTabId, setActiveTabId] = useState<ManagementTabId>("menu");
	const [activeKind, setActiveKind] = useState<FindEntryKind>("material");
	const [keyword, setKeyword] = useState("");
	const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
	const [selectedFindEntry, setSelectedFindEntry] = useState<FindEntry | null>(null);

	const loadSupabaseContent = useCallback(async () => {
		try {
			const [recipeBundles, findEntryBundles] = await Promise.all([
				listSupabaseRecipeBundlesAsync(),
				listSupabaseFindEntriesAsync(),
			]);

			replaceContent({
				findEntries: findEntryBundles.map(bundle => bundle.entry),
				recipeDetails: Object.fromEntries(
					recipeBundles.map(bundle => [bundle.recipe.id, bundle.detail]),
				),
				recipes: recipeBundles.map(bundle => bundle.recipe),
			});
		} catch (error) {
			console.error("Failed to load Sajang menu content from Supabase.", error);
			showToast("Supabase 메뉴 데이터를 불러오지 못했습니다");
		}
	}, [replaceContent, showToast]);

	useEffect(() => {
		loadSupabaseContent();
	}, [loadSupabaseContent]);

	const visibleRecipes = useMemo(
		() =>
			chosungSearch(
				{
					getChosungText: recipe => recipe.chosung,
					getText: recipe => recipe.name,
					query: keyword,
				},
				recipes,
			),
		[keyword, recipes],
	);
	const visibleFindEntries = useMemo(() => {
		const entriesForKind = findEntries.filter(entry => entry.kind === activeKind);

		return chosungSearch(
			{
				getChosungText: entry => entry.chosung,
				getText: entry => [entry.title, ...entry.keywords].join(" "),
				query: keyword,
			},
			entriesForKind,
		);
	}, [activeKind, findEntries, keyword]);

	const openCreate = useCallback(() => {
		router.push({
			pathname: "/sajang/menu-editor",
			params: {
				type: activeTabId === "menu" ? "recipe" : "find",
				kind: activeKind,
			},
		} as Href);
	}, [activeKind, activeTabId, router]);

	const openEdit = useCallback(
		(type: "recipe" | "find", id: string) => {
			router.push({
				pathname: "/sajang/menu-editor",
				params: { id, type },
			} as Href);
		},
		[router],
	);

	const handleTabChange = (nextTabId: ManagementTabId) => {
		setActiveTabId(nextTabId);
		setKeyword("");
	};

	const handleDeleteRecipe = async () => {
		if (!selectedRecipe) {
			return;
		}

		try {
			await deleteSupabaseRecipeBundleAsync(selectedRecipe.id);
			deleteRecipe(selectedRecipe.id);
			removeSavedRecipe(selectedRecipe.id);
			setSelectedRecipe(null);
			showToast("삭제되었습니다.");
		} catch (error) {
			console.error("Failed to delete recipe from Supabase.", error);
			showToast("Supabase 메뉴 삭제에 실패했습니다");
		}
	};

	const handleEditRecipe = () => {
		if (!selectedRecipe) {
			return;
		}

		const recipeId = selectedRecipe.id;
		setSelectedRecipe(null);
		openEdit("recipe", recipeId);
	};

	const handleEditFindEntry = () => {
		if (!selectedFindEntry) {
			return;
		}

		const entryId = selectedFindEntry.id;
		setSelectedFindEntry(null);
		openEdit("find", entryId);
	};

	const handleDeleteFindEntry = async () => {
		if (!selectedFindEntry) {
			return;
		}

		try {
			await deleteSupabaseFindEntryAsync(selectedFindEntry.id);
			deleteFindEntry(selectedFindEntry.id);
			setSelectedFindEntry(null);
			showToast("삭제되었습니다.");
		} catch (error) {
			console.error("Failed to delete find entry from Supabase.", error);
			showToast("Supabase 통합검색 삭제에 실패했습니다");
		}
	};

	return (
		<>
			<AppLayout
				activeDrawerId="owner-space"
				aside={<ManagementHeaderAddButton onPress={openCreate} />}
				contentStyle={styles.content}
				leadingMode="back"
				onPressBack={() => router.back()}
				title="메뉴추가"
				topSlot={<UnderlineTabMenu activeId={activeTabId} items={managementTabs} onChange={handleTabChange} />}
				type="view"
			>
				<View style={styles.controls}>
					<SearchBox
						onChangeText={setKeyword}
						onSubmit={() => undefined}
						placeholder={activeTabId === "menu" ? "메뉴명 검색" : "재료 또는 POS 아이템 검색"}
						showSubmitButton={false}
						value={keyword}
					/>
					{activeTabId === "find" ? (
						<ManagementOptionSelector
							label="통합관리 구분"
							onChange={setActiveKind}
							options={kindOptions}
							value={activeKind}
						/>
					) : null}
				</View>

				{activeTabId === "menu" ? (
					<FlatList
						contentContainerStyle={visibleRecipes.length === 0 ? styles.emptyContent : styles.listContent}
						data={visibleRecipes}
						ItemSeparatorComponent={() => <AppSpacer style={styles.separator} />}
						keyExtractor={recipe => recipe.id}
						keyboardShouldPersistTaps="handled"
						ListEmptyComponent={<EmptyManagementList />}
						renderItem={({ item: recipe }) => (
							<ManagementItemRow
								badge={recipe.category}
								onPress={() => setSelectedRecipe(recipe)}
								subtitle={recipe.subCategory}
								title={recipe.name}
							/>
						)}
						style={styles.list}
					/>
				) : (
					<FlatList
						contentContainerStyle={visibleFindEntries.length === 0 ? styles.emptyContent : styles.listContent}
						data={visibleFindEntries}
						ItemSeparatorComponent={() => <AppSpacer style={styles.separator} />}
						keyExtractor={entry => entry.id}
						keyboardShouldPersistTaps="handled"
						ListEmptyComponent={<EmptyManagementList />}
						renderItem={({ item: entry }) => (
							<ManagementItemRow
								badge={entry.kind === "material" ? "재료" : "POS"}
								onPress={() => setSelectedFindEntry(entry)}
								subtitle={entry.summary}
								title={entry.title}
							/>
						)}
						style={styles.list}
					/>
				)}
			</AppLayout>

			<RecipeDetailDrawer
				detail={selectedRecipe ? recipeDetails[selectedRecipe.id] : undefined}
				footer={
					selectedRecipe ? (
						<ManagementDetailActions
							onDelete={handleDeleteRecipe}
							onEdit={handleEditRecipe}
						/>
					) : null
				}
				onClose={() => setSelectedRecipe(null)}
				open={selectedRecipe !== null}
				recipe={selectedRecipe}
			/>
			<FindDetailDrawer
				entry={selectedFindEntry}
				footer={
					selectedFindEntry ? (
						<ManagementDetailActions
							onDelete={handleDeleteFindEntry}
							onEdit={handleEditFindEntry}
						/>
					) : null
				}
				onClose={() => setSelectedFindEntry(null)}
				open={selectedFindEntry !== null}
			/>
		</>
	);
}

const styles = StyleSheet.create({
	content: {
		flex: 1,
	},
	controls: {
		gap: AppSpacing.md,
		borderBottomWidth: 1,
		borderBottomColor: "rgba(71, 85, 105, 0.16)",
		padding: AppSpacing.md,
	},
	list: {
		flex: 1,
		width: "100%",
	},
	listContent: {
		paddingBottom: AppSpacing.xl,
	},
	emptyContent: {
		flexGrow: 1,
	},
	separator: {
		opacity: 0.32,
	},
	empty: {
		flex: 1,
		minHeight: 180,
		alignItems: "center",
		justifyContent: "center",
		padding: AppSpacing.md,
	},
});
