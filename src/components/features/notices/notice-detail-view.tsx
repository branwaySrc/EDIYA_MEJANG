import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { AppBadge } from "@/components/base/app-badge";
import { AppText } from "@/components/base/app-text";
import { AppColors, AppSpacing } from "@/constants/theme";
import { fetchNotice, getNoticeSnapshot, type Notice } from "@/database/notices/notice";

export type NoticeDetailViewProps = {
	noticeId?: string;
};

export function NoticeDetailView({ noticeId }: NoticeDetailViewProps) {
	const [notice, setNotice] = useState<Notice | undefined>(() => getNoticeSnapshot(noticeId));

	useEffect(() => {
		let mounted = true;

		void fetchNotice(noticeId).then(nextNotice => {
			if (mounted) {
				setNotice(nextNotice);
			}
		});

		return () => {
			mounted = false;
		};
	}, [noticeId]);

	if (!notice) {
		return (
			<View style={styles.container}>
				<AppText.Xl bold color={AppColors.primary}>
					공지사항을 찾을 수 없습니다
				</AppText.Xl>
				<AppText.Sm color={AppColors.sub}>선택한 공지가 삭제되었거나 아직 등록되지 않았습니다.</AppText.Sm>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<AppText.Xl bold color={AppColors.primary}>
					{notice.title}
				</AppText.Xl>
				<AppText.Sm color={AppColors.sub}>{notice.uploadedAt}</AppText.Sm>
				<View style={styles.keywordList}>
					{notice.keywords.map(keyword => (
						<AppBadge key={keyword} tone="primary">
							{keyword}
						</AppBadge>
					))}
				</View>
			</View>

			<View style={styles.body}>
				{notice.body.map(paragraph => (
					<AppText.Base key={paragraph} style={styles.paragraph}>
						{paragraph}
					</AppText.Base>
				))}
			</View>
		</View>
	);
}

export default NoticeDetailView;

const styles = StyleSheet.create({
	container: {
		gap: AppSpacing.lg,
		padding: AppSpacing.md,
		paddingBottom: AppSpacing.xl,
	},
	header: {
		gap: AppSpacing.sm,
	},
	keywordList: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: AppSpacing.xs,
	},
	body: {
		gap: AppSpacing.md,
	},
	paragraph: {
		lineHeight: 25,
	},
});
