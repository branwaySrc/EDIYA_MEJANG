import { type Href, useRouter } from "expo-router";
import { StyleSheet } from "react-native";

import { AppIcon } from "@/components/base/app-icon";
import { AppPressable } from "@/components/base/app-pressable";
import { AppText } from "@/components/base/app-text";
import { SajangHomeGrid } from "@/components/features/sajang/sajang-home-grid";
import { AppLayout } from "@/components/global/app-layout";
import { appRoutes } from "@/constants/route";
import { AppColors, AppSpacing } from "@/constants/theme";
import { useSajangAuthStore } from "@/store/sajang-auth-store";

export default function SajangHomeScreen() {
	const router = useRouter();
	const lock = useSajangAuthStore(state => state.lock);

	const logout = () => {
		lock();
		router.replace("/sajang" as Href);
	};

	return (
		<AppLayout activeDrawerId="owner-space" title={appRoutes["owner-space"].label} type="view" contentContainerStyle={styles.container}>
			<SajangHomeGrid />
			<AppPressable
				accessibilityLabel="사장님 공간 로그아웃하기"
				accessibilityRole="button"
				onPress={logout}
				pressedColor="#FEE2E2"
				radius="base"
				style={styles.logoutButton}
			>
				<AppIcon.Sm color="#B91C1C" name="log-out-outline" pressable={false} />
				<AppText.Base bold color="#B91C1C">
					로그아웃하기
				</AppText.Base>
			</AppPressable>
		</AppLayout>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: AppSpacing.lg,
		gap: AppSpacing.md,
	},
	logoutButton: {
		minHeight: 52,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: AppSpacing.xs,
		borderWidth: 1,
		borderColor: "rgba(185, 28, 28, 0.32)",
		backgroundColor: AppColors.background,
		paddingHorizontal: AppSpacing.md,
	},
});
