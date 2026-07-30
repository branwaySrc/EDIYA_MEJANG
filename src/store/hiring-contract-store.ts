import { create } from "zustand";

import type { HiringContractResult, HiringDraft } from "@/components/features/sajang/hiring/hiring-types";
import { initialHiringDraft } from "@/components/features/sajang/hiring/hiring-types";

type HiringContractStore = {
	draft: HiringDraft;
	result: HiringContractResult | null;
	resetDraft: () => void;
	setDraft: (draft: HiringDraft) => void;
	setField: <Key extends keyof HiringDraft>(key: Key, value: HiringDraft[Key]) => void;
	setResult: (result: HiringContractResult | null) => void;
};

export const useHiringContractStore = create<HiringContractStore>(set => ({
	draft: initialHiringDraft,
	result: null,
	resetDraft: () =>
		set({
			draft: initialHiringDraft,
			result: null,
		}),
	setDraft: draft => set({ draft }),
	setField: (key, value) =>
		set(state => ({
			draft: {
				...state.draft,
				[key]: value,
			},
		})),
	setResult: result => set({ result }),
}));
