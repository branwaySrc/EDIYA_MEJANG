import { useEffect, useState } from "react";
import { Image, StyleSheet, View } from "react-native";

import { AppText } from "@/components/base/app-text";
import { Accordion } from "@/components/ui/accordion";
import { AppColors, AppSpacing } from "@/constants/theme";
import {
	fetchTutorialEntriesByTopic,
	fetchTutorialTopic,
	getTutorialEntriesByTopicSnapshot,
	getTutorialTopicSnapshot,
} from "@/database/tutorial/tutorial";
import type { TutorialEntry, TutorialTopic } from "@/database/tutorial/tutorial.type";

export type TutorialContentViewProps = {
	topicSlug?: string;
};

export function TutorialContentView({ topicSlug }: TutorialContentViewProps) {
	const [topic, setTopic] = useState<TutorialTopic | undefined>(() => getTutorialTopicSnapshot(topicSlug));
	const [entries, setEntries] = useState<TutorialEntry[]>(() => getTutorialEntriesByTopicSnapshot(topicSlug));

	useEffect(() => {
		let mounted = true;

		void Promise.all([fetchTutorialTopic(topicSlug), fetchTutorialEntriesByTopic(topicSlug)]).then(([nextTopic, nextEntries]) => {
			if (mounted) {
				setTopic(nextTopic);
				setEntries(nextEntries);
			}
		});

		return () => {
			mounted = false;
		};
	}, [topicSlug]);

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
						{entry.blocks.map(block => {
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
						})}
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
