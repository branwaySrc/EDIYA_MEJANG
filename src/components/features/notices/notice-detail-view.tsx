import { useEffect } from "react";
import { Image, StyleSheet, View } from "react-native";

import { AppBadge } from "@/components/base/app-badge";
import { AppText } from "@/components/base/app-text";
import { Accordion } from "@/components/ui/accordion";
import { AppColors, AppSpacing } from "@/constants/theme";
import type { ManagedContentSection } from "@/database/manual/manual.type";
import { useContentManagementStore } from "@/store/content-management-store";

export type NoticeDetailViewProps = {
	noticeId?: string;
};

function renderSection(section: ManagedContentSection) {
	return (
		<>
			{section.desc ? (
				<AppText.Base style={styles.paragraph}>
					{section.desc}
				</AppText.Base>
			) : null}
			{section.imageSource ? (
				<Image
					accessibilityLabel={section.imageAlt ?? section.title}
					accessibilityRole="image"
					resizeMode="cover"
					source={section.imageSource}
					style={styles.image}
				/>
			) : null}
		</>
	);
}

function normalizeNoticeKeywords(keywords: unknown) {
	if (!Array.isArray(keywords)) {
		return [];
	}

	return keywords
		.flatMap(keyword => (typeof keyword === "string" ? keyword : []))
		.map(keyword => keyword.trim())
		.filter(Boolean);
}

export function NoticeDetailView({ noticeId }: NoticeDetailViewProps) {
	const contentSyncing = useContentManagementStore(state => state.contentSyncing);
	const hydrateManagedContentFromRemote = useContentManagementStore(state => state.hydrateManagedContentFromRemote);
	const notices = useContentManagementStore(state => state.notices);
	const notice = notices.find(item => item.id === noticeId);

	useEffect(() => {
		void hydrateManagedContentFromRemote();
	}, [hydrateManagedContentFromRemote]);

	if (!notice) {
		return (
			<View style={styles.container}>
				{contentSyncing ? (
					<AppText.Sm color={AppColors.sub}>데이터를 불러오고 있습니다</AppText.Sm>
				) : null}
				<AppText.Xl bold color={AppColors.primary}>
					공지사항을 찾을 수 없습니다
				</AppText.Xl>
				<AppText.Sm color={AppColors.sub}>선택한 공지가 삭제되었거나 아직 등록되지 않았습니다.</AppText.Sm>
			</View>
		);
	}

	const keywords = normalizeNoticeKeywords(notice.keywords);

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<AppText.Xl bold color={AppColors.primary}>
					{notice.title}
				</AppText.Xl>
				<AppText.Sm color={AppColors.sub}>
					{[notice.shiftGroup, notice.description, notice.uploadedAt].filter(Boolean).join(" · ")}
				</AppText.Sm>
				{keywords.length > 0 ? (
					<View style={styles.keywordList}>
						{keywords.map((keyword, index) => (
							<AppBadge key={`${keyword}-${index}`} tone="primary">
								{keyword}
							</AppBadge>
						))}
					</View>
				) : null}
			</View>

			{notice.sections?.length ? (
				<Accordion.List>
					{notice.sections.map((section, index) => (
						<Accordion.Item key={section.id} defaultOpen={index === 0} title={section.title}>
							{renderSection(section)}
						</Accordion.Item>
					))}
				</Accordion.List>
			) : (
				<View style={styles.body}>
					{notice.body.map(paragraph => (
						<AppText.Base key={paragraph} style={styles.paragraph}>
							{paragraph}
						</AppText.Base>
					))}
				</View>
			)}
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
	image: {
		width: "100%",
		aspectRatio: 16 / 9,
		borderRadius: 4,
		backgroundColor: "rgba(71, 85, 105, 0.1)",
	},
});
