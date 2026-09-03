import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { ManagedContentType } from "@/database/managed-content/managed-content.type";
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
import {
	archiveSupabaseManagedContentAsync,
	fetchSupabaseManagedContentAsync,
	upsertSupabaseManualEntryAsync,
	upsertSupabaseNoticeAsync,
	upsertSupabaseTutorialEntryAsync,
} from "@/lib/managed-content/supabase-managed-content-repository";
import {
	fetchSupabaseVendorsAsync,
	upsertSupabaseVendorAsync,
} from "@/lib/vendors/supabase-vendors-repository";

type RecipeBundle = {
	detail: RecipeDetail;
	recipe: Recipe;
};

type ContentManagementState = {
	contentSyncErrorMessage: string | null;
	contentSyncing: boolean;
	deleteFindEntry: (id: string) => void;
	deleteManualEntry: (id: string) => Promise<void>;
	deleteNotice: (id: string) => Promise<void>;
	deleteRecipe: (id: string) => void;
	deleteTutorialEntry: (id: string) => Promise<void>;
	findEntries: FindEntry[];
	hydrateManagedContentFromRemote: () => Promise<void>;
	hydrateVendorsFromRemote: () => Promise<void>;
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
	upsertManualEntry: (entry: ManualEntry) => Promise<void>;
	upsertNotice: (notice: Notice) => Promise<void>;
	upsertRecipeBundle: (bundle: RecipeBundle) => void;
	upsertTutorialEntry: (entry: TutorialEntry) => Promise<void>;
	upsertVendor: (vendor: Vendor) => Promise<void>;
	vendorSyncErrorMessage: string | null;
	vendorSyncing: boolean;
	vendors: Vendor[];
};

type ContentManagementSet = (partial: Partial<ContentManagementState>) => void;

const initialManualCategories = getManualCategoriesSnapshot();
const initialTutorialTopics = getTutorialTopicsSnapshot();
const initialRecipeDetails: Record<string, RecipeDetail> = {};
const contentManagementStoreVersion = 3;

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
			contentSyncErrorMessage: null,
			contentSyncing: false,
			deleteFindEntry: id =>
				set(state => ({
					findEntries: state.findEntries.filter(entry => entry.id !== id),
				})),
			deleteManualEntry: async id => {
				set(state => ({
					manualEntries: state.manualEntries.filter(entry => entry.id !== id),
					contentSyncErrorMessage: null,
				}));
				await archiveManagedContentBestEffortAsync("manual", id, set);
			},
			deleteNotice: async id => {
				set(state => ({
					notices: state.notices.filter(notice => notice.id !== id),
					contentSyncErrorMessage: null,
				}));
				await archiveManagedContentBestEffortAsync("notice", id, set);
			},
			deleteRecipe: id =>
				set(state => ({
					findEntries: state.findEntries.filter(entry => entry.recipeId !== id),
					recipeDetails: Object.fromEntries(
						Object.entries(state.recipeDetails).filter(([recipeId]) => recipeId !== id),
					) as Record<string, RecipeDetail>,
					recipes: state.recipes.filter(recipe => recipe.id !== id),
				})),
			deleteTutorialEntry: async id => {
				set(state => ({
					tutorialEntries: state.tutorialEntries.filter(entry => entry.id !== id),
					contentSyncErrorMessage: null,
				}));
				await archiveManagedContentBestEffortAsync("tutorial", id, set);
			},
			findEntries: [],
			hydrateManagedContentFromRemote: async () => {
				set({ contentSyncing: true, contentSyncErrorMessage: null });

				try {
					const remoteContent = await fetchSupabaseManagedContentAsync();

					if (remoteContent) {
						set({
							manualEntries: remoteContent.manualEntries,
							notices: remoteContent.notices,
							tutorialEntries: remoteContent.tutorialEntries,
						});
					}
				} catch (error) {
					console.error("Failed to hydrate managed content from Supabase.", error);
					set({ contentSyncErrorMessage: "데이터를 Supabase에서 불러오지 못했습니다." });
				} finally {
					set({ contentSyncing: false });
				}
			},
			hydrateVendorsFromRemote: async () => {
				set({ vendorSyncing: true, vendorSyncErrorMessage: null });

				try {
					const remoteVendors = await fetchSupabaseVendorsAsync();

					if (remoteVendors) {
						set({ vendors: remoteVendors });
					}
				} catch (error) {
					console.error("Failed to hydrate vendors from Supabase.", error);
					set({ vendorSyncErrorMessage: "거래처 정보를 Supabase에서 불러오지 못했습니다." });
				} finally {
					set({ vendorSyncing: false });
				}
			},
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
			upsertManualEntry: async entry => {
				set(state => ({
					manualEntries: upsertById(state.manualEntries, entry),
					contentSyncErrorMessage: null,
				}));

				try {
					const remoteEntry = await upsertSupabaseManualEntryAsync(entry);

					if (remoteEntry) {
						set(state => ({
							manualEntries: upsertById(state.manualEntries, remoteEntry),
						}));
					}
				} catch (error) {
					console.error("Failed to sync manual entry to Supabase.", error);
					set({ contentSyncErrorMessage: "직원메뉴를 Supabase에 저장하지 못했습니다. 로컬 화면에는 임시 반영되었습니다." });
					throw error;
				}
			},
			upsertNotice: async notice => {
				set(state => ({
					notices: upsertById(state.notices, notice),
					contentSyncErrorMessage: null,
				}));

				try {
					const remoteNotice = await upsertSupabaseNoticeAsync(notice);

					if (remoteNotice) {
						set(state => ({
							notices: upsertById(state.notices, remoteNotice),
						}));
					}
				} catch (error) {
					console.error("Failed to sync notice to Supabase.", error);
					set({ contentSyncErrorMessage: "공지사항을 Supabase에 저장하지 못했습니다. 로컬 화면에는 임시 반영되었습니다." });
					throw error;
				}
			},
			upsertRecipeBundle: ({ detail, recipe }) =>
				set(state => ({
					recipeDetails: {
						...state.recipeDetails,
						[recipe.id]: detail,
					},
					recipes: upsertById(state.recipes, recipe),
				})),
			upsertTutorialEntry: async entry => {
				set(state => ({
					tutorialEntries: upsertById(state.tutorialEntries, entry),
					contentSyncErrorMessage: null,
				}));

				try {
					const remoteEntry = await upsertSupabaseTutorialEntryAsync(entry);

					if (remoteEntry) {
						set(state => ({
							tutorialEntries: upsertById(state.tutorialEntries, remoteEntry),
						}));
					}
				} catch (error) {
					console.error("Failed to sync tutorial entry to Supabase.", error);
					set({ contentSyncErrorMessage: "튜토리얼을 Supabase에 저장하지 못했습니다. 로컬 화면에는 임시 반영되었습니다." });
					throw error;
				}
			},
			upsertVendor: async vendor => {
				set(state => ({
					vendors: upsertById(state.vendors, vendor),
					vendorSyncErrorMessage: null,
				}));

				try {
					const remoteVendor = await upsertSupabaseVendorAsync(vendor);

					if (remoteVendor) {
						set(state => ({
							vendors: upsertById(state.vendors, remoteVendor),
						}));
					}
				} catch (error) {
					console.error("Failed to sync vendor to Supabase.", error);
					set({ vendorSyncErrorMessage: "거래처 정보를 Supabase에 저장하지 못했습니다. 로컬 화면에는 임시 반영되었습니다." });
				}
			},
			vendorSyncErrorMessage: null,
			vendorSyncing: false,
		}),
		{
			migrate: migrateContentManagementState,
			name: "ediya-mejang:managed-content",
			partialize: state => ({
				manualCategories: state.manualCategories,
				manualEntries: state.manualEntries,
				notices: state.notices,
				tutorialEntries: state.tutorialEntries,
				tutorialTopics: state.tutorialTopics,
				vendors: state.vendors,
			}),
			skipHydration: true,
			storage: createJSONStorage(() => createFileStateStorage("managed-content")),
			version: contentManagementStoreVersion,
		},
	),
);

async function archiveManagedContentBestEffortAsync(
	contentType: ManagedContentType,
	id: string,
	set: ContentManagementSet,
) {
	try {
		await archiveSupabaseManagedContentAsync(contentType, id);
	} catch (error) {
		console.error("Failed to archive managed content in Supabase.", error);
		set({ contentSyncErrorMessage: "콘텐츠 삭제 상태를 Supabase에 반영하지 못했습니다. 로컬 화면에서는 삭제되었습니다." });
	}
}
