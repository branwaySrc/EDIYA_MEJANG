import * as FileSystem from "expo-file-system/legacy";
import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";

import type { HiringContractRecord, HiringContractResult, HiringDocumentKey, HiringDraft } from "@/components/features/sajang/hiring/hiring-types";
import { initialHiringDraft } from "@/components/features/sajang/hiring/hiring-types";
import type { HiringWorkplace } from "@/database/sajang/workplace";

const fallbackMemoryStorage = new Map<string, string>();
const localStorageDirectory = FileSystem.documentDirectory ? `${FileSystem.documentDirectory}local-storage/` : null;

async function ensureLocalStorageDirectory() {
	if (!localStorageDirectory) {
		return null;
	}

	await FileSystem.makeDirectoryAsync(localStorageDirectory, { intermediates: true });

	return localStorageDirectory;
}

function getStorageFileUri(name: string) {
	return localStorageDirectory ? `${localStorageDirectory}${encodeURIComponent(name)}.json` : null;
}

const fileSystemStateStorage: StateStorage = {
	getItem: async name => {
		const fileUri = getStorageFileUri(name);

		if (!fileUri) {
			return fallbackMemoryStorage.get(name) ?? null;
		}

		try {
			await ensureLocalStorageDirectory();
			const fileInfo = await FileSystem.getInfoAsync(fileUri);

			if (!fileInfo.exists) {
				return null;
			}

			return await FileSystem.readAsStringAsync(fileUri);
		} catch {
			return fallbackMemoryStorage.get(name) ?? null;
		}
	},
	removeItem: async name => {
		const fileUri = getStorageFileUri(name);

		fallbackMemoryStorage.delete(name);

		if (!fileUri) {
			return;
		}

		await FileSystem.deleteAsync(fileUri, { idempotent: true });
	},
	setItem: async (name, value) => {
		const fileUri = getStorageFileUri(name);

		fallbackMemoryStorage.set(name, value);

		if (!fileUri) {
			return;
		}

		await ensureLocalStorageDirectory();
		await FileSystem.writeAsStringAsync(fileUri, value);
	},
};

type HiringContractStore = {
	contracts: HiringContractRecord[];
	draft: HiringDraft;
	result: HiringContractResult | null;
	addContract: (record: HiringContractRecord) => void;
	removeContract: (id: string) => void;
	resetDraft: () => void;
	selectWorkplace: (workplace: HiringWorkplace) => void;
	setDocumentChecked: (key: HiringDocumentKey, checked: boolean) => void;
	setDraft: (draft: HiringDraft) => void;
	setField: <Key extends keyof HiringDraft>(key: Key, value: HiringDraft[Key]) => void;
	setResult: (result: HiringContractResult | null) => void;
};

type LegacyHiringDraft = Partial<HiringDraft> & {
	workTime?: string;
};

type PersistedHiringContractState = Partial<Omit<HiringContractStore, "draft">> & {
	draft?: LegacyHiringDraft;
};

function parseLegacyWorkTime(workTime?: string) {
	const match = workTime?.match(/(\d{1,2}):(\d{2})\s*[-~]\s*(\d{1,2}):(\d{2})/);

	if (!match) {
		return { end: null, start: null };
	}

	return {
		end: Number(match[3]) * 60 + Number(match[4]),
		start: Number(match[1]) * 60 + Number(match[2]),
	};
}

export const useHiringContractStore = create<HiringContractStore>()(
	persist(
		set => ({
			draft: initialHiringDraft,
			result: null,
			contracts: [],
			addContract: record =>
				set(state => ({
					contracts: [record, ...state.contracts.filter(item => item.id !== record.id)],
				})),
			removeContract: id =>
				set(state => ({
					contracts: state.contracts.filter(contract => contract.id !== id),
				})),
			resetDraft: () =>
				set({
					draft: initialHiringDraft,
					result: null,
				}),
			selectWorkplace: workplace =>
				set(state => ({
					draft: {
						...state.draft,
						selectedWorkplaceId: workplace.id,
						storeName: workplace.name,
						storeAddress: workplace.address,
						storePhone: workplace.phone,
					},
				})),
			setDocumentChecked: (key, checked) =>
				set(state => ({
					draft: {
						...state.draft,
						documents: {
							...state.draft.documents,
							[key]: checked,
						},
					},
				})),
			setDraft: draft => set({ draft }),
			setField: (key, value) =>
				set(state => ({
					draft: {
						...state.draft,
						[key]: value,
					},
				})),
			setResult: result => set({ result }),
		}),
		{
			migrate: persistedState => {
				const state = persistedState as PersistedHiringContractState;
				const legacyTime = parseLegacyWorkTime(state.draft?.workTime);

				return {
					...state,
					contracts: state.contracts ?? [],
					draft: {
						...initialHiringDraft,
						...state.draft,
						documents: {
							...initialHiringDraft.documents,
							...state.draft?.documents,
						},
						phonePublic: state.draft?.phonePublic ?? false,
						workEndMinutes: state.draft?.workEndMinutes ?? legacyTime.end,
						workStartMinutes: state.draft?.workStartMinutes ?? legacyTime.start,
					},
					result: state.result ?? null,
				} satisfies Partial<HiringContractStore>;
			},
			name: "ediya-mejang:hiring-contracts",
			storage: createJSONStorage(() => fileSystemStateStorage),
			partialize: state => ({
				contracts: state.contracts,
				draft: state.draft,
				result: state.result,
			}),
			version: 2,
		},
	),
);
