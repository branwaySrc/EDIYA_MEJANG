import { type Href, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { NoticeItem } from "@/components/features/notices/notice-item";
import { AppSpacing } from "@/constants/theme";
import { fetchNotices, getNoticesSnapshot, type Notice } from "@/database/notices/notice";

export type NoticeListProps = {
	notices?: Notice[];
};

export function NoticeList({ notices }: NoticeListProps) {
	const router = useRouter();
	const [noticeList, setNoticeList] = useState(notices ?? getNoticesSnapshot());
	const currentNotices = notices ?? noticeList;

	useEffect(() => {
		if (notices) {
			return;
		}

		let mounted = true;

		void fetchNotices().then(nextNotices => {
			if (mounted) {
				setNoticeList(nextNotices);
			}
		});

		return () => {
			mounted = false;
		};
	}, [notices]);

	return (
		<View style={styles.container}>
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
});
