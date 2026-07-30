import { type Href, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/base/app-text";
import { TutorialItem } from "@/components/features/tutorial/tutorial-item";
import { AppColors, AppSpacing } from "@/constants/theme";
import { fetchTutorialTopics, getTutorialTopicsSnapshot } from "@/database/tutorial/tutorial";
import type { TutorialTopic } from "@/database/tutorial/tutorial.type";

export type TutorialListProps = {
	topics?: TutorialTopic[];
};

export function TutorialList({ topics }: TutorialListProps) {
	const router = useRouter();
	const [tutorialTopics, setTutorialTopics] = useState(topics ?? getTutorialTopicsSnapshot());
	const currentTopics = topics ?? tutorialTopics;

	useEffect(() => {
		if (topics) {
			return;
		}

		let mounted = true;

		void fetchTutorialTopics().then(nextTopics => {
			if (mounted) {
				setTutorialTopics(nextTopics);
			}
		});

		return () => {
			mounted = false;
		};
	}, [topics]);

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<AppText.Xl bold color={AppColors.primary}>
					튜토리얼
				</AppText.Xl>
				<AppText.Sm color={AppColors.sub}>기기 조작과 처리 방법을 순서대로 확인하세요.</AppText.Sm>
			</View>

			<View style={styles.list}>
				{currentTopics.map(topic => (
					<TutorialItem key={topic.slug} onPress={() => router.push(`/tutorial/${topic.slug}` as Href)} topic={topic} />
				))}
			</View>
		</View>
	);
}

export default TutorialList;

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
