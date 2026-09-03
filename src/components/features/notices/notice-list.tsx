import { type Href, useRouter } from "expo-router";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/base/app-text";
import { NoticeItem } from "@/components/features/notices/notice-item";
import { AppColors, AppSpacing } from "@/constants/theme";
import type { Notice } from "@/database/notices/notice";
import { useContentManagementStore } from "@/store/content-management-store";

export type NoticeListProps = {
	notices?: Notice[];
};

export function NoticeList({ notices }: NoticeListProps) {
	const router = useRouter();
	const contentSyncErrorMessage = useContentManagementStore(state => state.contentSyncErrorMessage);
	const contentSyncing = useContentManagementStore(state => state.contentSyncing);
	const hydrateManagedContentFromRemote = useContentManagementStore(state => state.hydrateManagedContentFromRemote);
	const managedNotices = useContentManagementStore(state => state.notices);
	const currentNotices = notices ?? managedNotices;

	useEffect(() => {
		void hydrateManagedContentFromRemote();
	}, [hydrateManagedContentFromRemote]);

	return (
		<View style={styles.container}>
			{contentSyncing ? (
				<View style={styles.loadingBox}>
					<AppText.Sm color={AppColors.sub}>데이터를 불러오고 있습니다</AppText.Sm>
				</View>
			) : null}
			{contentSyncErrorMessage ? (
				<AppText.Sm color="#B91C1C">{contentSyncErrorMessage}</AppText.Sm>
			) : null}
			{currentNotices.map((notice, index) => (
				<NoticeItem
					key={notice.id}
					notice={notice}
					onPress={() =>
						router.push({
							pathname: "/notices/detail",
							params: { id: notice.id },
						} as Href)
					}
					showKeywords={index === 0}
				/>
			))}
		</View>
	);
}

export default NoticeList;

const styles = StyleSheet.create({
	container: {
		gap: AppSpacing.sm,
		padding: AppSpacing.md,
		paddingBottom: AppSpacing.xl,
	},
	loadingBox: {
		minHeight: 64,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "#F4F9FF",
	},
});
