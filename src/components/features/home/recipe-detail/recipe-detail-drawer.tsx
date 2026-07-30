import { useEffect, useMemo, useState } from "react";
import { Animated, Easing, Image, Pressable, ScrollView, StyleSheet, View, type ImageSourcePropType } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { AppIcon } from "@/components/base/app-icon";
import { AppPressable } from "@/components/base/app-pressable";
import { AppText } from "@/components/base/app-text";
import { RecipeDetailSection } from "@/components/features/home/recipe-detail/recipe-detail-section";
import { RecipeStepAccordion } from "@/components/features/home/recipe-detail/recipe-step-accordion";
import { AppColors, AppSpacing } from "@/constants/theme";
import type { Recipe } from "@/database/recipe/recipe.type";
import { getRecipeDetail, type RecipeStep, type RecipeVisual } from "@/database/recipe/recipe-details";

export type RecipeDetailDrawerProps = {
	onClose: () => void;
	open: boolean;
	recipe?: Recipe | null;
};

const drawerWidth = 500;
const fallbackRecipeImage = require("../../../../../assets/images/skeleton/fallbackImg.jpg") as ImageSourcePropType;

function RecipeVisualCard({ visual, large = false }: { large?: boolean; visual: RecipeVisual }) {
	const imageSource = visual.imageUri ? { uri: visual.imageUri } : fallbackRecipeImage;

	return (
		<View style={styles.visualCard}>
			<Image accessibilityLabel={visual.title} resizeMode="cover" source={imageSource} style={[styles.visualImage, large && styles.largeVisualImage]} />
		</View>
	);
}

function VisualList({ large = false, visuals }: { large?: boolean; visuals: RecipeVisual[] }) {
	return (
		<View style={styles.visualList}>
			{visuals.map(visual => (
				<RecipeVisualCard key={visual.id} large={large} visual={visual} />
			))}
		</View>
	);
}

function HeroVisualList({ visuals }: { visuals: RecipeVisual[] }) {
	return (
		<View style={styles.heroVisualList}>
			{visuals.map(visual => {
				const imageSource = visual.imageUri ? { uri: visual.imageUri } : fallbackRecipeImage;

				return (
					<View key={visual.id} style={styles.heroVisualCard}>
						<Image accessibilityLabel={visual.title} resizeMode="cover" source={imageSource} style={styles.heroVisualImage} />
						<View style={styles.heroVisualTextArea}>
							<AppText.Sm color={AppColors.sub} style={styles.heroVisualDescription}>
								{visual.description}
							</AppText.Sm>
						</View>
					</View>
				);
			})}
		</View>
	);
}

function RecipeServiceAccordion({ steps, title, visuals }: { steps: RecipeStep[]; title: string; visuals: RecipeVisual[] }) {
	const [expanded, setExpanded] = useState(false);

	return (
		<View style={styles.serviceSection}>
			<AppPressable
				accessibilityLabel={`${title} ${expanded ? "닫기" : "열기"}`}
				accessibilityRole="button"
				onPress={() => setExpanded(current => !current)}
				pressedColor="rgba(0, 75, 147, 0.04)"
				style={styles.serviceHeader}
			>
				<AppText.Sm bold color={AppColors.primary}>
					{title}
				</AppText.Sm>
				<AppIcon.Sm color={AppColors.sub} name={expanded ? "chevron-up" : "chevron-down"} pressable={false} />
			</AppPressable>

			{expanded && (
				<View style={styles.serviceBody}>
					<View style={styles.sectionInner}>
						<VisualList visuals={visuals} />
					</View>
					<View style={styles.stepList}>
						{steps.map(step => (
							<RecipeStepAccordion key={step.id} step={step} />
						))}
					</View>
				</View>
			)}
		</View>
	);
}

export function RecipeDetailDrawer({ onClose, open, recipe }: RecipeDetailDrawerProps) {
	const insets = useSafeAreaInsets();
	const [progress] = useState(() => new Animated.Value(open ? 1 : 0));
	const detail = recipe ? getRecipeDetail(recipe) : null;

	useEffect(() => {
		Animated.timing(progress, {
			duration: open ? 240 : 180,
			easing: open ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
			toValue: open ? 1 : 0,
			useNativeDriver: true,
		}).start();
	}, [open, progress]);

	const drawerTranslateX = useMemo(
		() =>
			progress.interpolate({
				inputRange: [0, 1],
				outputRange: [drawerWidth, 0],
			}),
		[progress],
	);
	const backdropOpacity = useMemo(
		() =>
			progress.interpolate({
				inputRange: [0, 1],
				outputRange: [0, 0.3],
			}),
		[progress],
	);

	if (!open || !recipe || !detail) {
		return null;
	}

	return (
		<View style={styles.layer} pointerEvents="box-none">
			<Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
				<Pressable accessibilityLabel="레시피 상세 닫기" onPress={onClose} style={styles.backdropPressable} />
			</Animated.View>

			<Animated.View style={[styles.drawerFrame, { transform: [{ translateX: drawerTranslateX }] }]}>
				<SafeAreaView style={styles.drawer} edges={["top", "right", "bottom"]}>
					<View style={styles.header}>
						<View style={styles.headerTextArea}>
							<AppText.Sm bold color={AppColors.primary}>
								{recipe.category} / {recipe.subCategory}
							</AppText.Sm>
							<AppText.Xl bold numberOfLines={2}>
								{recipe.name}
							</AppText.Xl>
						</View>
						<AppIcon.Base accessibilityLabel="레시피 상세 닫기" name="close" onPress={onClose} />
					</View>

					<ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + AppSpacing.xl }]} showsVerticalScrollIndicator={false}>
						<RecipeDetailSection title="완성된 이미지">
							<View style={styles.sectionInner}>
								<HeroVisualList visuals={detail.heroVisuals} />
							</View>
						</RecipeDetailSection>

						<RecipeDetailSection title="제조순서">
							<View style={styles.stepList}>
								{detail.steps.map(step => (
									<RecipeStepAccordion key={step.id} step={step} />
								))}
							</View>
						</RecipeDetailSection>

						<RecipeServiceAccordion title="매장으로 준비하기" visuals={detail.storeServing} steps={detail.steps} />
						<RecipeServiceAccordion title="포장으로 준비하기" visuals={detail.packaging} steps={detail.steps} />
						<RecipeServiceAccordion title="배달로 준비하기" visuals={detail.delivery} steps={detail.steps} />
					</ScrollView>
				</SafeAreaView>
			</Animated.View>
		</View>
	);
}

export default RecipeDetailDrawer;

const styles = StyleSheet.create({
	layer: {
		position: "absolute",
		top: 0,
		right: 0,
		bottom: 0,
		left: 0,
		zIndex: 200,
	},
	backdrop: {
		position: "absolute",
		top: 0,
		right: 0,
		bottom: 0,
		left: 0,
		backgroundColor: AppColors.text,
	},
	backdropPressable: {
		flex: 1,
	},
	drawerFrame: {
		position: "absolute",
		top: 0,
		right: 0,
		bottom: 0,
		width: "85%",
		maxWidth: drawerWidth,
		shadowColor: AppColors.text,
		shadowOffset: { width: -4, height: 0 },
		shadowOpacity: 0.14,
		shadowRadius: 14,
	},
	drawer: {
		flex: 1,
		backgroundColor: AppColors.background,
	},
	header: {
		width: "100%",
		minHeight: 88,
		flexDirection: "row",
		alignItems: "center",
		gap: AppSpacing.sm,
		borderBottomWidth: 1,
		borderBottomColor: "#E2E8F0",
		paddingHorizontal: AppSpacing.md,
		paddingVertical: AppSpacing.md,
	},
	headerTextArea: {
		flex: 1,
		minWidth: 0,
		gap: AppSpacing.xs,
	},
	content: {
		backgroundColor: "#f4f4f4",
	},
	serviceSection: {
		width: "100%",
		backgroundColor: "#f4f4f4",
	},
	serviceHeader: {
		width: "100%",
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		backgroundColor: "#f4f4f4",
		paddingHorizontal: AppSpacing.md,
		paddingTop: AppSpacing.md,
		paddingBottom: AppSpacing.sm,
	},
	serviceBody: {
		width: "100%",
		backgroundColor: AppColors.background,
	},
	sectionInner: {
		width: "100%",
		padding: AppSpacing.md,
	},
	visualList: {
		gap: AppSpacing.sm,
	},
	heroVisualList: {
		width: "100%",
		flexDirection: "row",
		flexWrap: "wrap",
		gap: AppSpacing.sm,
	},
	heroVisualCard: {
		width: "48%",
		minWidth: 0,
		borderWidth: 1,
		borderColor: "#E2E8F0",
		backgroundColor: AppColors.background,
	},
	heroVisualImage: {
		width: "100%",
		aspectRatio: 1,
		backgroundColor: "#EAF3FC",
	},
	heroVisualTextArea: {
		paddingHorizontal: AppSpacing.sm,
		paddingVertical: AppSpacing.sm,
	},
	heroVisualDescription: {
		textAlign: "left",
	},
	visualCard: {
		width: "100%",
		borderWidth: 1,
		borderColor: "#E2E8F0",
		backgroundColor: AppColors.background,
	},
	visualImage: {
		width: "100%",
		aspectRatio: 16 / 9,
		backgroundColor: "#EAF3FC",
	},
	largeVisualImage: {
		aspectRatio: 4 / 3,
	},
	visualCardTextArea: {
		gap: AppSpacing.xs,
		padding: AppSpacing.md,
	},
	stepList: {
		width: "100%",
	},
});
