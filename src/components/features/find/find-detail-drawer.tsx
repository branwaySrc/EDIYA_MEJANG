import { type ReactNode, useEffect, useMemo, useState } from "react";
import { Animated, Easing, Image, Pressable, ScrollView, StyleSheet, View, type ImageSourcePropType } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { AppIcon } from "@/components/base/app-icon";
import { AppText } from "@/components/base/app-text";
import { RecipeDetailSection } from "@/components/features/home/recipe-detail/recipe-detail-section";
import { AppColors, AppSpacing } from "@/constants/theme";
import { findEntryDetailTitleLabels, type FindEntry, type FindMaterialDetailBlock, type FindMaterialDetailImage } from "@/database/find/find";

export type FindDetailDrawerProps = {
	entry?: FindEntry | null;
	footer?: ReactNode;
	onClose: () => void;
	open: boolean;
};

const drawerWidth = 500;
const fallbackFindImage = require("../../../../assets/images/skeleton/fallbackImg.jpg") as ImageSourcePropType;

function getFindImageSource(image: FindMaterialDetailImage) {
	return image.image ?? image.source ?? fallbackFindImage;
}

function FindImageGrid({ emptyMessage, images }: { emptyMessage?: string; images: FindMaterialDetailImage[] }) {
	if (images.length === 0) {
		return (
			<View style={styles.imagePlaceholder}>
				<AppIcon.Lg color={AppColors.primary} name="image-outline" pressable={false} />
				<AppText.Sm color={AppColors.sub}>{emptyMessage ?? "이미지를 등록할 수 있습니다."}</AppText.Sm>
			</View>
		);
	}

	return (
		<View style={styles.imageGrid}>
			{images.map(image => {
				const imageSource = getFindImageSource(image);
				const accessibilityLabel = image.alt ?? image.title;

				return (
					<View key={image.id} style={styles.imageGridCard}>
						<Image accessibilityLabel={accessibilityLabel} resizeMode="cover" source={imageSource} style={styles.imageGridImage} />
						<View style={styles.imageGridTextArea}>
							{image.title && (
								<AppText.Sm bold numberOfLines={1} style={styles.imageGridTitle}>
									{image.title}
								</AppText.Sm>
							)}
							{image.desc && <AppText.Sm color={AppColors.sub}>{image.desc}</AppText.Sm>}
						</View>
					</View>
				);
			})}
		</View>
	);
}

function MaterialBlockList({ blocks }: { blocks: FindMaterialDetailBlock[] }) {
	return (
		<View style={styles.materialBlockList}>
			{blocks.map(block => (
				<View key={block.id} style={styles.materialBlock}>
					<View style={styles.materialBlockText}>
						<AppText.Base bold>{block.title}</AppText.Base>
					</View>
					<FindImageGrid images={block.images ?? []} />
				</View>
			))}
		</View>
	);
}

function PosPath({ path }: { path: string[] }) {
	return (
		<View style={styles.pathList}>
			{path.map((pathItem, index) => (
				<View key={`${pathItem}-${index}`} style={styles.pathRow}>
					<View style={styles.pathIndex}>
						<AppText.Xs bold color={AppColors.textOnPrimary}>
							{index + 1}
						</AppText.Xs>
					</View>
					<AppText.Base style={styles.pathText}>{pathItem}</AppText.Base>
				</View>
			))}
		</View>
	);
}

export function FindDetailDrawer({ entry, footer, onClose, open }: FindDetailDrawerProps) {
	const insets = useSafeAreaInsets();
	const [progress] = useState(() => new Animated.Value(open ? 1 : 0));

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

	if (!open || !entry) {
		return null;
	}

	return (
		<View style={styles.layer} pointerEvents="box-none">
			<Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
				<Pressable accessibilityLabel="통합검색 상세 닫기" onPress={onClose} style={styles.backdropPressable} />
			</Animated.View>

			<Animated.View style={[styles.drawerFrame, { transform: [{ translateX: drawerTranslateX }] }]}>
				<SafeAreaView style={styles.drawer} edges={["top", "right", "bottom"]}>
					<View style={styles.header}>
						<View style={styles.headerTextArea}>
							<AppText.Xl bold numberOfLines={2}>
								{entry.title} - {findEntryDetailTitleLabels[entry.kind]}
							</AppText.Xl>
							<AppText.Sm color={AppColors.sub} numberOfLines={2}>
								{entry.summary}
							</AppText.Sm>
						</View>
						<AppIcon.Base accessibilityLabel="통합검색 상세 닫기" name="close" onPress={onClose} />
					</View>

					<ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + AppSpacing.xl }]} showsVerticalScrollIndicator={false}>
						{entry.kind === "material" ? (
							<>
								<RecipeDetailSection title="분류">
									<MaterialBlockList blocks={entry.materialGroups} />
								</RecipeDetailSection>
								<RecipeDetailSection title="위치">
									<MaterialBlockList blocks={entry.storageLocations} />
								</RecipeDetailSection>
								{entry.notes && (
									<RecipeDetailSection title="Memo">
										<View style={styles.sectionInner}>
											<AppText.Base>{entry.notes}</AppText.Base>
										</View>
									</RecipeDetailSection>
								)}
							</>
						) : (
							<>
								<RecipeDetailSection title="POS 위치">
									<View style={styles.sectionInner}>
										<FindImageGrid emptyMessage="POS 이미지를 등록할 수 있습니다." images={entry.posImages} />
									</View>
								</RecipeDetailSection>
								<RecipeDetailSection title="누르는 순서">
									<View style={styles.sectionInner}>
										<PosPath path={entry.posPath} />
									</View>
								</RecipeDetailSection>
								{entry.notes && (
									<RecipeDetailSection title="Memo">
										<View style={styles.sectionInner}>
											<AppText.Base>{entry.notes}</AppText.Base>
										</View>
									</RecipeDetailSection>
								)}
							</>
						)}
						{footer}
					</ScrollView>
				</SafeAreaView>
			</Animated.View>
		</View>
	);
}

export default FindDetailDrawer;

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
		minHeight: 108,
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
		alignItems: "flex-start",
		gap: AppSpacing.xs,
	},
	content: {
		backgroundColor: "#f4f4f4",
	},
	sectionInner: {
		width: "100%",
		gap: AppSpacing.md,
		padding: AppSpacing.md,
	},
	materialBlockList: {
		width: "100%",
		gap: AppSpacing.sm,
		padding: AppSpacing.md,
	},
	materialBlock: {
		width: "100%",
		gap: AppSpacing.sm,
		backgroundColor: AppColors.background,
	},
	materialBlockText: {
		gap: AppSpacing.xs,
	},
	imageGrid: {
		width: "100%",
		flexDirection: "row",
		flexWrap: "wrap",
		gap: AppSpacing.sm,
	},
	imageGridCard: {
		width: "48%",
		minWidth: 0,
		borderWidth: 1,
		borderColor: "#E2E8F0",
		backgroundColor: AppColors.background,
	},
	imageGridImage: {
		width: "100%",
		aspectRatio: 1,
		backgroundColor: "rgba(71, 85, 105, 0.1)",
	},
	imageGridTextArea: {
		gap: AppSpacing.xs,
		paddingHorizontal: AppSpacing.sm,
		paddingVertical: AppSpacing.sm,
	},
	imageGridTitle: {
		textAlign: "left",
	},
	imagePlaceholder: {
		width: "48%",
		aspectRatio: 1,
		alignItems: "center",
		justifyContent: "center",
		gap: AppSpacing.sm,
		backgroundColor: "rgba(0, 75, 147, 0.04)",
	},
	pathList: {
		width: "100%",
		gap: AppSpacing.sm,
	},
	pathRow: {
		minHeight: 40,
		flexDirection: "row",
		alignItems: "center",
		gap: AppSpacing.sm,
	},
	pathIndex: {
		width: 24,
		height: 24,
		alignItems: "center",
		justifyContent: "center",
		borderRadius: 999,
		backgroundColor: AppColors.primary,
	},
	pathText: {
		flex: 1,
		minWidth: 0,
	},
});
