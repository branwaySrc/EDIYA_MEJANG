import { useIsFocused } from "expo-router";
import { useEffect, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";

export function useActiveRoute() {
	const isFocused = useIsFocused();
	const [appActive, setAppActive] = useState(true);

	useEffect(() => {
		const updateAppState = (state: AppStateStatus) => {
			setAppActive(state === "active");
		};

		updateAppState(AppState.currentState);
		const subscription = AppState.addEventListener("change", updateAppState);

		return () => {
			subscription.remove();
		};
	}, []);

	return isFocused && appActive;
}
