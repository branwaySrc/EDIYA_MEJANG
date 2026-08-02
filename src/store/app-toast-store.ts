import { create } from "zustand";

type AppToastState = {
	hideToast: () => void;
	message: string | null;
	toastId: number;
	showToast: (message: string) => void;
};

export const useAppToastStore = create<AppToastState>(set => ({
	hideToast: () => set({ message: null }),
	message: null,
	toastId: 0,
	showToast: message =>
		set(state => ({
			message,
			toastId: state.toastId + 1,
		})),
}));
