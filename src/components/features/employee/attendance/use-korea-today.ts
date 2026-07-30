import { useEffect, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";

import { getKoreaTodayKey, getMillisecondsUntilNextKoreaDay } from "@/lib/korea-date";

export function useKoreaToday() {
	const [todayKey, setTodayKey] = useState(getKoreaTodayKey);

	useEffect(() => {
		let refreshTimer: ReturnType<typeof setTimeout> | undefined;

		const scheduleNextDayRefresh = () => {
			if (refreshTimer) {
				clearTimeout(refreshTimer);
			}

			refreshTimer = setTimeout(() => {
				setTodayKey(getKoreaTodayKey());
				scheduleNextDayRefresh();
			}, getMillisecondsUntilNextKoreaDay() + 1000);
		};

		const handleAppStateChange = (state: AppStateStatus) => {
			if (state === "active") {
				setTodayKey(getKoreaTodayKey());
				scheduleNextDayRefresh();
			}
		};
		const subscription = AppState.addEventListener("change", handleAppStateChange);
		scheduleNextDayRefresh();

		return () => {
			if (refreshTimer) {
				clearTimeout(refreshTimer);
			}
			subscription.remove();
		};
	}, []);

	return todayKey;
}
