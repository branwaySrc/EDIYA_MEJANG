import { StyleSheet } from "react-native";

import { SajangHomeGrid } from "@/components/features/sajang/hiring/sajang-home-grid";
import { AppLayout } from "@/components/global/app-layout";
import { appRoutes } from "@/constants/route";
import { AppSpacing } from "@/constants/theme";

export default function SajangHomeScreen() {
	return (
		<AppLayout activeDrawerId="owner-space" title={appRoutes["owner-space"].label} type="view" contentContainerStyle={styles.container}>
				<SajangHomeGrid />
		</AppLayout>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: AppSpacing.lg,
	},
});
