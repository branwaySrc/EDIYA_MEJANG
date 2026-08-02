import { useState } from "react";
import { Image, StyleSheet, View, type ImageSourcePropType } from "react-native";

import { AppIcon } from "@/components/base/app-icon";
import { AppPressable } from "@/components/base/app-pressable";
import { AppText } from "@/components/base/app-text";
import { AppColors, AppSpacing } from "@/constants/theme";
import type { RecipeStep, RecipeVisual } from "@/database/recipe/recipe-details.type";

const fallbackRecipeImage = require("../../../../../assets/images/skeleton/fallbackImg.jpg") as ImageSourcePropType;

export type RecipeStepAccordionProps = {
	stepNumber: number;
	step: RecipeStep;
};

function getStepTitle(title: string) {
	return title.replace(/^\s*\d+\.\s*/, "");
}

function getVisualDescription(visual: RecipeVisual) {
	return visual.desc ?? visual.description;
}

function getVisualImageSource(visual: RecipeVisual) {
	const imageUri = visual.image ?? visual.imageUri;

	return imageUri ? { uri: imageUri } : fallbackRecipeImage;
}

function RecipeVisualBlock({ visual }: { visual: RecipeVisual }) {
	const imageSource = getVisualImageSource(visual);
	const visualDescription = getVisualDescription(visual);

	return (
		<View style={styles.visualBlock}>
			<Image accessibilityLabel={visual.title} resizeMode="cover" source={imageSource} style={styles.visualImage} />
			<View style={styles.visualTextArea}>
				<AppText.Sm bold numberOfLines={1} style={styles.visualTitle}>
					{visual.title}
				</AppText.Sm>
				{visualDescription && <AppText.Sm color={AppColors.sub}>{visualDescription}</AppText.Sm>}
			</View>
		</View>
	);
}

export function RecipeStepAccordion({ step, stepNumber }: RecipeStepAccordionProps) {
	const [expanded, setExpanded] = useState(false);
	const stepTitle = getStepTitle(step.title);

	return (
		<View style={styles.container}>
			<AppPressable
				accessibilityLabel={`${stepNumber}. ${stepTitle} ${expanded ? "접기" : "열기"}`}
				accessibilityRole="button"
				onPress={() => setExpanded(current => !current)}
				pressedColor="rgba(0, 75, 147, 0.04)"
				style={styles.row}
			>
				<View style={styles.stepNumberBadge}>
					<AppText.Sm bold color={AppColors.textOnPrimary}>
						{stepNumber}
					</AppText.Sm>
				</View>
				<View style={styles.rowTextArea}>
					<AppText.Base bold numberOfLines={1}>
						{stepTitle}
					</AppText.Base>
				</View>
				<AppIcon.Sm color={AppColors.sub} name={expanded ? "chevron-up" : "chevron-down"} pressable={false} />
			</AppPressable>

			{expanded && (
				<View style={styles.expandedArea}>
					<View style={styles.detailList}>
						{step.details.map(detail => (
							<View key={detail} style={styles.detailRow}>
								<View style={styles.detailDot} />
								<AppText.Sm color={AppColors.text} style={styles.detailText}>
									{detail}
								</AppText.Sm>
							</View>
						))}
					</View>

					<View style={styles.visualList}>
						{step.visuals.map(visual => (
							<RecipeVisualBlock key={visual.id} visual={visual} />
						))}
					</View>
				</View>
			)}
		</View>
	);
}

export default RecipeStepAccordion;

const styles = StyleSheet.create({
	container: {
		width: "100%",
		backgroundColor: AppColors.background,
	},
	row: {
		minHeight: 56,
		width: "100%",
		flexDirection: "row",
		alignItems: "center",
		gap: AppSpacing.md,
		backgroundColor: AppColors.background,
		paddingHorizontal: AppSpacing.md,
		paddingVertical: AppSpacing.sm,
	},
	rowTextArea: {
		flex: 1,
		minWidth: 0,
	},
	stepNumberBadge: {
		width: 28,
		height: 28,
		alignItems: "center",
		justifyContent: "center",
		borderRadius: 999,
		backgroundColor: AppColors.primary,
	},
	expandedArea: {
		width: "100%",
		gap: AppSpacing.md,
		backgroundColor: "#F8FAFC",
		paddingHorizontal: AppSpacing.md,
		paddingTop: AppSpacing.md,
		paddingBottom: AppSpacing.lg,
	},
	detailList: {
		gap: AppSpacing.sm,
	},
	detailRow: {
		flexDirection: "row",
		gap: AppSpacing.sm,
	},
	detailDot: {
		width: 5,
		height: 5,
		marginTop: 8,
		borderRadius: 999,
		backgroundColor: AppColors.primary,
	},
	detailText: {
		flex: 1,
		minWidth: 0,
	},
	visualList: {
		width: "100%",
		flexDirection: "row",
		flexWrap: "wrap",
		gap: AppSpacing.sm,
	},
	visualBlock: {
		width: "48%",
		minWidth: 0,
		gap: AppSpacing.sm,
		borderWidth: 1,
		borderColor: "#E2E8F0",
		backgroundColor: AppColors.background,
	},
	visualImage: {
		width: "100%",
		aspectRatio: 1,
		backgroundColor: "#EAF3FC",
	},
	visualTextArea: {
		gap: AppSpacing.xs,
		paddingHorizontal: AppSpacing.md,
		paddingBottom: AppSpacing.md,
	},
	visualTitle: {
		flex: 1,
		minWidth: 0,
	},
});
