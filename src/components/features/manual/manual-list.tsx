import { type Href, useRouter } from "expo-router";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";

import { AppIcon } from "@/components/base/app-icon";
import { AppPressable } from "@/components/base/app-pressable";
import { AppText } from "@/components/base/app-text";
import { AppColors, AppSpacing } from "@/constants/theme";
import type { ManualCategory, ManualEntry } from "@/database/manual/manual.type";
import { useContentManagementStore } from "@/store/content-management-store";

export type ManualListProps = {
	categories?: ManualCategory[];
};

export function ManualList({ categories }: ManualListProps) {
	const router = useRouter();
	const contentSyncErrorMessage = useContentManagementStore(state => state.contentSyncErrorMessage);
	const contentSyncing = useContentManagementStore(state => state.contentSyncing);
	const hydrateManagedContentFromRemote = useContentManagementStore(state => state.hydrateManagedContentFromRemote);
	const managedCategories = useContentManagementStore(state => state.manualCategories);
	const managedEntries = useContentManagementStore(state => state.manualEntries);
	const currentEntries = categories
		? managedEntries.filter(entry => categories.some(category => category.slug === entry.categorySlug))
		: managedEntries;

	const getSubtitle = (entry: ManualEntry) =>
		entry.description?.trim() || entry.shiftGroup || managedCategories.find(category => category.slug === entry.categorySlug)?.title || "직원메뉴";

	useEffect(() => {
		void hydrateManagedContentFromRemote();
	}, [hydrateManagedContentFromRemote]);

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<AppText.Xl bold color={AppColors.primary}>
					직원 메뉴얼
				</AppText.Xl>
				<AppText.Sm color={AppColors.sub}>등록된 게시글을 열어 세부 내용을 확인하세요.</AppText.Sm>
			</View>

			<View style={styles.list}>
				{contentSyncing ? (
					<View style={styles.loadingBox}>
						<AppText.Sm color={AppColors.sub}>데이터를 불러오고 있습니다</AppText.Sm>
					</View>
				) : null}
				{contentSyncErrorMessage ? (
					<AppText.Sm color="#B91C1C">{contentSyncErrorMessage}</AppText.Sm>
				) : null}
				{currentEntries.map(entry => (
					<AppPressable
						key={entry.id}
						accessibilityLabel={`${entry.title} 메뉴얼 보기`}
						accessibilityRole="button"
						onPress={() => router.push(`/manual/${entry.id}` as Href)}
						pressedColor="rgba(0, 75, 147, 0.04)"
						radius="base"
						style={styles.item}
					>
						<View style={styles.itemText}>
							<AppText.Lg bold numberOfLines={2}>
								{entry.title}
							</AppText.Lg>
							<AppText.Sm color={AppColors.sub} numberOfLines={1}>
								{getSubtitle(entry)}
							</AppText.Sm>
						</View>
						<AppIcon.Base color={AppColors.sub} name="chevron-forward" pressable={false} />
					</AppPressable>
				))}
			</View>
		</View>
	);
}

export default ManualList;

const styles = StyleSheet.create({
	container: {
		gap: AppSpacing.lg,
		padding: AppSpacing.md,
		paddingBottom: AppSpacing.xl,
	},
	header: {
		gap: AppSpacing.xs,
	},
	list: {
		gap: AppSpacing.sm,
	},
	item: {
		width: "100%",
		minHeight: 76,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: AppSpacing.md,
		borderWidth: 1,
		borderColor: "rgba(71, 85, 105, 0.24)",
		backgroundColor: AppColors.background,
		paddingHorizontal: AppSpacing.md,
		paddingVertical: AppSpacing.sm,
	},
	itemText: {
		flex: 1,
		minWidth: 0,
		gap: AppSpacing.xs,
	},
	loadingBox: {
		minHeight: 64,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "#F4F9FF",
	},
});
