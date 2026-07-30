import { create } from "zustand";

type SajangAuthState = {
	lock: () => void;
	unlock: () => void;
	unlocked: boolean;
};

export const useSajangAuthStore = create<SajangAuthState>(set => ({
	unlocked: false,
	lock: () => set({ unlocked: false }),
	unlock: () => set({ unlocked: true }),
}));
