import { Stack } from "expo-router";
import { useEffect } from "react";

import { useHiringContractStore } from "@/store/hiring-contract-store";

export default function SajangHiringLayout() {
	const resetDraft = useHiringContractStore(state => state.resetDraft);

	useEffect(() => {
		resetDraft();

		return () => {
			resetDraft();
		};
	}, [resetDraft]);

	return <Stack screenOptions={{ headerShown: false }} />;
}
