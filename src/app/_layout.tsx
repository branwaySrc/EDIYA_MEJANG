import { Inter_400Regular, Inter_700Bold, useFonts } from "@expo-google-fonts/inter";
import Ionicons from "@expo/vector-icons/Ionicons";
import { DefaultTheme, Stack, ThemeProvider, usePathname, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useRef } from "react";
import { BackHandler, Platform, StyleSheet, ToastAndroid, View } from "react-native";

import { AppToast } from "@/components/ui/app-toast";
import { AppColors } from "@/constants/theme";
import { initializeLocalContentPackDatabaseAsync } from "@/lib/content-pack/local-content-pack";

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
	const [fontsLoaded, fontError] = useFonts({
		Inter_400Regular,
		Inter_700Bold,
		...Ionicons.font,
	});

	useEffect(() => {
		if (fontsLoaded || fontError) {
			SplashScreen.hideAsync();
		}
	}, [fontsLoaded, fontError]);

	useEffect(() => {
		initializeLocalContentPackDatabaseAsync().catch(error => {
			console.error("Failed to initialize local content pack database.", error);
		});
	}, []);

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

	if (!fontsLoaded && !fontError) {
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
