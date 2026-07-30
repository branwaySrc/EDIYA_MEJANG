import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/base/app-text";
import { AppLayout } from "@/components/global/app-layout";
import type { DrawerMenuId } from "@/components/global/navigation-drawer";
import { AppColors, AppSpacing } from "@/constants/theme";

export type RoutePlaceholderScreenProps = {
	activeDrawerId: DrawerMenuId;
	description?: string;
	title: string;
};

export function RoutePlaceholderScreen({ activeDrawerId, description = "추후 구성될 화면입니다.", title }: RoutePlaceholderScreenProps) {
	return (
		<AppLayout activeDrawerId={activeDrawerId} title={title} type="scrollview">
			<View style={styles.content}>
				<AppText.Xl bold color={AppColors.primary}>
					{title}
				</AppText.Xl>
				<AppText.Base color={AppColors.sub} style={styles.description}>
					{description}
				</AppText.Base>
			</View>
		</AppLayout>
	);
}

export default RoutePlaceholderScreen;

const styles = StyleSheet.create({
	content: {
		padding: AppSpacing.lg,
	},
	description: {
		marginTop: AppSpacing.sm,
	},
});
