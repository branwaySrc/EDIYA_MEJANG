import { type Href, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/base/app-text";
import { ManualItem } from "@/components/features/manual/manual-item";
import { AppColors, AppSpacing } from "@/constants/theme";
import { fetchManualCategories, getManualCategoriesSnapshot } from "@/database/manual/manual";
import type { ManualCategory } from "@/database/manual/manual.type";

export type ManualListProps = {
	categories?: ManualCategory[];
};

export function ManualList({ categories }: ManualListProps) {
	const router = useRouter();
	const [manualCategories, setManualCategories] = useState(categories ?? getManualCategoriesSnapshot());
	const currentCategories = categories ?? manualCategories;

	useEffect(() => {
		if (categories) {
			return;
		}

		let mounted = true;

		void fetchManualCategories().then(nextCategories => {
			if (mounted) {
				setManualCategories(nextCategories);
			}
		});

		return () => {
			mounted = false;
		};
	}, [categories]);

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<AppText.Xl bold color={AppColors.primary}>
					직원 메뉴얼
				</AppText.Xl>
				<AppText.Sm color={AppColors.sub}>근무 구분별로 필요한 내용을 확인하세요.</AppText.Sm>
			</View>

			<View style={styles.list}>
				{currentCategories.map(category => (
					<ManualItem
						key={category.slug}
						category={category}
						onPress={() => router.push(`/manual/${category.slug}` as Href)}
					/>
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
});
