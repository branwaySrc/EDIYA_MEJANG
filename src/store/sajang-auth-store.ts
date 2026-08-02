import Constants from "expo-constants";
import { create } from "zustand";

export type SajangPasscodeValidationResult = "invalid" | "missing" | "valid";

type SajangAuthState = {
	lock: () => void;
	unlock: () => void;
	unlocked: boolean;
};

function getConfiguredSajangPasscode() {
	const publicPasscode = process.env.EXPO_PUBLIC_SAJANG_PASSCODE;
	const configPasscode = Constants.expoConfig?.extra?.sajangPasscode;
	const passcode = typeof publicPasscode === "string" && publicPasscode.trim() ? publicPasscode : configPasscode;

	return typeof passcode === "string" ? passcode.trim() : "";
}

export function validateSajangPasscode(passcode: string): SajangPasscodeValidationResult {
	const configuredSajangPasscode = getConfiguredSajangPasscode();

	if (!configuredSajangPasscode) {
		return "missing";
	}

	return passcode.trim() === configuredSajangPasscode ? "valid" : "invalid";
}

export const useSajangAuthStore = create<SajangAuthState>(set => ({
	unlocked: false,
	lock: () => set({ unlocked: false }),
	unlock: () => set({ unlocked: true }),
}));
