import { Inter_400Regular, Inter_700Bold, useFonts } from "@expo-google-fonts/inter";
import Ionicons from "@expo/vector-icons/Ionicons";
import { DefaultTheme, Stack, ThemeProvider, usePathname, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useRef, useState } from "react";
import { BackHandler, Platform, StyleSheet, ToastAndroid, View } from "react-native";

import { AppToast } from "@/components/ui/app-toast";
import { AppColors } from "@/constants/theme";
import { readActiveRecipeSearchCacheAsync } from "@/lib/content-cache/recipe-search-cache";
import { useAttendanceStore } from "@/store/attendance-store";
import { useContentManagementStore } from "@/store/content-management-store";
import { useEmployeeManagementStore } from "@/store/employee-management-store";

SplashScreen.preventAutoHideAsync();

const androidExitConfirmationWindowMs = 2000;
const androidExitToastMessage = "한 번 더 누르면 앱이 종료 됩니다";

const appTheme = {
	...DefaultTheme,
	colors: {
		...DefaultTheme.colors,
		primary: AppColors.primary,
		background: AppColors.background,
		card: AppColors.background,
		text: AppColors.text,
		border: AppColors.sub,
		notification: AppColors.primary,
	},
};

export default function RootLayout() {
	const pathname = usePathname();
	const router = useRouter();
	const lastAndroidBackPressRef = useRef(0);
	const [contentCacheHydrated, setContentCacheHydrated] = useState(false);
	const hydrateAttendanceFromRemote = useAttendanceStore(state => state.hydrateFromRemote);
	const hydrateEmployeesFromRemote = useEmployeeManagementStore(state => state.hydrateFromRemote);
	const [fontsLoaded, fontError] = useFonts({
		Inter_400Regular,
		Inter_700Bold,
		...Ionicons.font,
	});

	useEffect(() => {
		if ((fontsLoaded || fontError) && contentCacheHydrated) {
			SplashScreen.hideAsync();
		}
	}, [contentCacheHydrated, fontsLoaded, fontError]);

	useEffect(() => {
		let mounted = true;

		const hydrateContentCache = async () => {
			try {
				await useContentManagementStore.persist.rehydrate();
				const snapshot = await readActiveRecipeSearchCacheAsync();

				if (snapshot) {
					useContentManagementStore.getState().replaceRecipeSearchContent({
						findEntries: snapshot.findEntries,
						recipeDetails: snapshot.recipeDetails,
						recipes: snapshot.recipes,
					});
				}
			} catch (error) {
				console.error("Failed to hydrate the recipe/search device cache.", error);
			} finally {
				if (mounted) {
					setContentCacheHydrated(true);
				}
			}
		};

		void hydrateContentCache();

		return () => {
			mounted = false;
		};
	}, []);

	useEffect(() => {
		const hydrateEmployeesAndAttendance = async () => {
			await useEmployeeManagementStore.persist.rehydrate();
			await hydrateEmployeesFromRemote();
			await hydrateAttendanceFromRemote();
		};

		void hydrateEmployeesAndAttendance();
	}, [hydrateAttendanceFromRemote, hydrateEmployeesFromRemote]);

	useEffect(() => {
		lastAndroidBackPressRef.current = 0;
	}, [pathname]);

	useEffect(() => {
		if (Platform.OS !== "android") {
			return;
		}

		const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
			if (router.canGoBack()) {
				return false;
			}

			const pressedAt = Date.now();

			if (pressedAt - lastAndroidBackPressRef.current <= androidExitConfirmationWindowMs) {
				BackHandler.exitApp();
				return true;
			}

			lastAndroidBackPressRef.current = pressedAt;
			ToastAndroid.show(androidExitToastMessage, ToastAndroid.SHORT);
			return true;
		});

		return () => subscription.remove();
	}, [router]);

	if ((!fontsLoaded && !fontError) || !contentCacheHydrated) {
		return null;
	}

	return (
		<ThemeProvider value={appTheme}>
			<View style={styles.root}>
				<Stack
					screenOptions={{
						contentStyle: { backgroundColor: AppColors.background },
						headerShown: false,
					}}
				/>
				<AppToast />
			</View>
		</ThemeProvider>
	);
}

const styles = StyleSheet.create({
	root: {
		flex: 1,
	},
});
