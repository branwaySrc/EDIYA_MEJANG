import { StyleSheet } from "react-native";
import { useRouter } from "expo-router";

import { SettingView } from "@/components/features/home/settings/setting-view";
import { AppLayout } from "@/components/global/app-layout";
import { AppSpacing } from "@/constants/theme";

export default function SettingsScreen() {
	const router = useRouter();

	return (
		<AppLayout
			drawerEnabled={false}
			leadingMode="back"
			onPressBack={() => {
				if (router.canGoBack()) {
					router.back();
					return;
				}

				router.replace("/");
			}}
			title="설정"
			type="scrollview"
			contentContainerStyle={styles.content}
		>
			<SettingView />
		</AppLayout>
	);
}

const styles = StyleSheet.create({
	content: {
		padding: AppSpacing.md,
	},
});
