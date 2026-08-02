import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { getManualCategoriesSnapshot, getManualEntriesByCategorySnapshot } from "@/database/manual/manual";
import type { ManualCategory, ManualEntry } from "@/database/manual/manual.type";
import { getNoticesSnapshot } from "@/database/notices/notice";
import type { Notice } from "@/database/notices/notice.type";
import type { RecipeDetail } from "@/database/recipe/recipe-details.type";
import type { Recipe } from "@/database/recipe/recipe.type";
import type { FindEntry } from "@/database/find/find.type";
import { getTutorialEntriesByTopicSnapshot, getTutorialTopicsSnapshot } from "@/database/tutorial/tutorial";
import type { TutorialEntry, TutorialTopic } from "@/database/tutorial/tutorial.type";
import { sampleVendors } from "@/database/vendors/vendor";
import type { Vendor } from "@/database/vendors/vendor.type";
import { createFileStateStorage } from "@/lib/file-state-storage";

type RecipeBundle = {
	detail: RecipeDetail;
	recipe: Recipe;
};

type ContentManagementState = {
	deleteFindEntry: (id: string) => void;
	deleteManualEntry: (id: string) => void;
	deleteNotice: (id: string) => void;
	deleteRecipe: (id: string) => void;
	deleteTutorialEntry: (id: string) => void;
	findEntries: FindEntry[];
	manualCategories: ManualCategory[];
	manualEntries: ManualEntry[];
	notices: Notice[];
	recipeDetails: Record<string, RecipeDetail>;
	recipes: Recipe[];
	replaceRecipeSearchContent: (content: {
		findEntries: FindEntry[];
		recipeDetails: Record<string, RecipeDetail>;
		recipes: Recipe[];
	}) => void;
	tutorialEntries: TutorialEntry[];
	tutorialTopics: TutorialTopic[];
	upsertFindEntry: (entry: FindEntry) => void;
	upsertManualEntry: (entry: ManualEntry) => void;
	upsertNotice: (notice: Notice) => void;
	upsertRecipeBundle: (bundle: RecipeBundle) => void;
	upsertTutorialEntry: (entry: TutorialEntry) => void;
	upsertVendor: (vendor: Vendor) => void;
	vendors: Vendor[];
};

const initialManualCategories = getManualCategoriesSnapshot();
const initialTutorialTopics = getTutorialTopicsSnapshot();
const initialRecipeDetails: Record<string, RecipeDetail> = {};
const contentManagementStoreVersion = 2;

function migrateContentManagementState(persistedState: unknown, version: number) {
	if (version >= contentManagementStoreVersion || typeof persistedState !== "object" || persistedState === null) {
		return persistedState;
	}

	return {
		...persistedState,
		findEntries: [],
		recipeDetails: {},
		recipes: [],
	};
}

function upsertById<Item extends { id: string }>(items: Item[], nextItem: Item) {
	const existingIndex = items.findIndex(item => item.id === nextItem.id);

	if (existingIndex < 0) {
		return [nextItem, ...items];
	}

	return items.map(item => (item.id === nextItem.id ? nextItem : item));
}

export const useContentManagementStore = create<ContentManagementState>()(
	persist(
		set => ({
			deleteFindEntry: id =>
				set(state => ({
					findEntries: state.findEntries.filter(entry => entry.id !== id),
				})),
			deleteManualEntry: id =>
				set(state => ({
					manualEntries: state.manualEntries.filter(entry => entry.id !== id),
				})),
			deleteNotice: id =>
				set(state => ({
					notices: state.notices.filter(notice => notice.id !== id),
				})),
			deleteRecipe: id =>
				set(state => ({
					findEntries: state.findEntries.filter(entry => entry.recipeId !== id),
					recipeDetails: Object.fromEntries(
						Object.entries(state.recipeDetails).filter(([recipeId]) => recipeId !== id),
					) as Record<string, RecipeDetail>,
					recipes: state.recipes.filter(recipe => recipe.id !== id),
				})),
			deleteTutorialEntry: id =>
				set(state => ({
					tutorialEntries: state.tutorialEntries.filter(entry => entry.id !== id),
				})),
			findEntries: [],
			manualCategories: initialManualCategories,
			manualEntries: initialManualCategories.flatMap(category => getManualEntriesByCategorySnapshot(category.slug)),
			notices: getNoticesSnapshot(),
			recipeDetails: initialRecipeDetails,
			recipes: [],
			replaceRecipeSearchContent: content =>
				set({
					findEntries: content.findEntries,
					recipeDetails: content.recipeDetails,
					recipes: content.recipes,
				}),
			tutorialEntries: initialTutorialTopics.flatMap(topic => getTutorialEntriesByTopicSnapshot(topic.slug)),
			tutorialTopics: initialTutorialTopics,
			vendors: sampleVendors,
			upsertFindEntry: entry =>
				set(state => ({
					findEntries: upsertById(state.findEntries, entry),
				})),
			upsertManualEntry: entry =>
				set(state => ({
					manualEntries: upsertById(state.manualEntries, entry),
				})),
			upsertNotice: notice =>
				set(state => ({
					notices: upsertById(state.notices, notice),
				})),
			upsertRecipeBundle: ({ detail, recipe }) =>
				set(state => ({
					recipeDetails: {
						...state.recipeDetails,
						[recipe.id]: detail,
					},
					recipes: upsertById(state.recipes, recipe),
				})),
			upsertTutorialEntry: entry =>
				set(state => ({
					tutorialEntries: upsertById(state.tutorialEntries, entry),
				})),
			upsertVendor: vendor =>
				set(state => ({
					vendors: upsertById(state.vendors, vendor),
				})),
		}),
		{
			migrate: migrateContentManagementState,
			name: "ediya-mejang:managed-content",
			storage: createJSONStorage(() => createFileStateStorage("managed-content")),
			version: contentManagementStoreVersion,
		},
	),
);
