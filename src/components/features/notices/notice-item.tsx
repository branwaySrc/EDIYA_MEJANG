import { StyleSheet, View } from "react-native";

import { AppBadge } from "@/components/base/app-badge";
import { AppIcon } from "@/components/base/app-icon";
import { AppPressable } from "@/components/base/app-pressable";
import { AppText } from "@/components/base/app-text";
import { AppColors, AppSpacing } from "@/constants/theme";
import type { Notice } from "@/database/notices/notice";

export type NoticeItemProps = {
	notice: Notice;
	onPress: () => void;
	showKeywords?: boolean;
};

export function NoticeItem({ notice, onPress, showKeywords = false }: NoticeItemProps) {
	return (
		<AppPressable
			accessibilityLabel={`${notice.title} 공지사항 보기`}
			accessibilityRole="button"
			onPress={onPress}
			pressedColor="rgba(0, 75, 147, 0.04)"
			radius="base"
			style={styles.item}
		>
			<View style={styles.content}>
				<AppText.Lg bold numberOfLines={1} style={styles.title}>
					{notice.title}
				</AppText.Lg>
				<AppText.Sm color={AppColors.sub} numberOfLines={1} style={styles.date}>
					{notice.uploadedAt}
				</AppText.Sm>

				{showKeywords && notice.keywords.length > 0 && (
					<View style={styles.keywordList}>
						{notice.keywords.map(keyword => (
							<AppBadge key={keyword} tone="primary">
								{keyword}
							</AppBadge>
						))}
					</View>
				)}
			</View>

			<AppIcon.Base color={AppColors.sub} name="chevron-forward" pressable={false} />
		</AppPressable>
	);
}

export default NoticeItem;

const styles = StyleSheet.create({
	item: {
		width: "100%",
		minHeight: 70,
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
	content: {
		flex: 1,
		minWidth: 0,
		alignItems: "flex-start",
	},
	title: {
		width: "100%",
	},
	date: {
		marginTop: AppSpacing.xs,
	},
	keywordList: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: AppSpacing.xs,
		marginTop: AppSpacing.sm,
	},
});
