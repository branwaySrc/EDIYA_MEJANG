import { Image, StyleSheet, View } from "react-native";

import { AppText } from "@/components/base/app-text";
import { Accordion } from "@/components/ui/accordion";
import { AppColors, AppSpacing } from "@/constants/theme";
import type { ManagedContentSection } from "@/database/manual/manual.type";
import type { TutorialContentBlock } from "@/database/tutorial/tutorial.type";
import { useContentManagementStore } from "@/store/content-management-store";

export type TutorialContentViewProps = {
	topicSlug?: string;
};

function renderBlocks(blocks: TutorialContentBlock[]) {
	return blocks.map(block => {
		if (block.type === "image") {
			return (
				<Image
					key={block.id}
					accessibilityLabel={block.alt}
					accessibilityRole="image"
					resizeMode="cover"
					source={block.source}
					style={styles.image}
				/>
			);
		}

		return (
			<AppText.Sm key={block.id} color={AppColors.sub} style={styles.body}>
				{block.body}
			</AppText.Sm>
		);
	});
}

function renderSection(section: ManagedContentSection) {
	return (
		<>
			{section.desc ? (
				<AppText.Sm color={AppColors.sub} style={styles.body}>
					{section.desc}
				</AppText.Sm>
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

export function TutorialContentView({ topicSlug }: TutorialContentViewProps) {
	const topics = useContentManagementStore(state => state.tutorialTopics);
	const allEntries = useContentManagementStore(state => state.tutorialEntries);
	const directEntry = allEntries.find(entry => entry.id === topicSlug);
	const topic = topics.find(item => item.slug === topicSlug);
	const entries = allEntries.filter(entry => entry.topicSlug === topicSlug);

	if (directEntry) {
		return (
			<View style={styles.container}>
				<View style={styles.header}>
					<AppText.Xl bold color={AppColors.primary}>
						{directEntry.title}
					</AppText.Xl>
					{directEntry.description || directEntry.shiftGroup ? (
						<AppText.Sm color={AppColors.sub}>
							{[directEntry.description, directEntry.shiftGroup].filter(Boolean).join(" · ")}
						</AppText.Sm>
					) : null}
				</View>

				<Accordion.List>
					{directEntry.sections?.length ? (
						directEntry.sections.map((section, index) => (
							<Accordion.Item key={section.id} defaultOpen={index === 0} title={section.title || `내용 ${index + 1}`}>
								{renderSection(section)}
							</Accordion.Item>
						))
					) : (
						<Accordion.Item defaultOpen title={directEntry.title}>
							{renderBlocks(directEntry.blocks)}
						</Accordion.Item>
					)}
				</Accordion.List>
			</View>
		);
	}

	if (!topic) {
		return (
			<View style={styles.container}>
				<AppText.Xl bold color={AppColors.primary}>
					튜토리얼을 찾을 수 없습니다
				</AppText.Xl>
				<AppText.Sm color={AppColors.sub}>선택한 튜토리얼이 없거나 아직 등록되지 않았습니다.</AppText.Sm>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<AppText.Xl bold color={AppColors.primary}>
					{topic.title}
				</AppText.Xl>
				<AppText.Sm color={AppColors.sub}>{topic.description}</AppText.Sm>
			</View>

			<Accordion.List>
				{entries.map((entry, index) => (
					<Accordion.Item key={entry.id} defaultOpen={index === 0} title={entry.title}>
						{renderBlocks(entry.blocks)}
					</Accordion.Item>
				))}
			</Accordion.List>
		</View>
	);
}

export default TutorialContentView;

const styles = StyleSheet.create({
	container: {
		gap: AppSpacing.lg,
		padding: AppSpacing.md,
		paddingBottom: AppSpacing.xl,
	},
	header: {
		gap: AppSpacing.xs,
	},
	body: {
		lineHeight: 22,
	},
	image: {
		width: "100%",
		aspectRatio: 16 / 9,
		borderRadius: 4,
		backgroundColor: "rgba(71, 85, 105, 0.1)",
	},
});
