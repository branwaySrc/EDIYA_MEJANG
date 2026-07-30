import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/base/app-text";
import { AppColors, AppSpacing } from "@/constants/theme";

export type RecipeDetailSectionProps = {
	children: ReactNode;
	title: string;
};

export function RecipeDetailSection({ children, title }: RecipeDetailSectionProps) {
	return (
		<View style={styles.section}>
			<View style={styles.header}>
				<AppText.Sm bold color={AppColors.primary}>
					{title}
				</AppText.Sm>
			</View>
			<View style={styles.body}>{children}</View>
		</View>
	);
}

export default RecipeDetailSection;

const styles = StyleSheet.create({
	section: {
		width: "100%",
		backgroundColor: "#f4f4f4",
	},
	header: {
		width: "100%",
		backgroundColor: "#f4f4f4",
		paddingHorizontal: AppSpacing.md,
		paddingTop: AppSpacing.md,
		paddingBottom: AppSpacing.sm,
	},
	body: {
		width: "100%",
		backgroundColor: AppColors.background,
	},
});
