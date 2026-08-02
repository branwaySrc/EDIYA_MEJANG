import { useLocalSearchParams, useRouter } from "expo-router";

import { TutorialContentView } from "@/components/features/tutorial/tutorial-content-view";
import { AppLayout } from "@/components/global/app-layout";
import { appRoutes } from "@/constants/route";

export default function ManualTutorialContentScreen() {
	const router = useRouter();
	const { topic } = useLocalSearchParams<{ topic?: string | string[] }>();
	const topicSlug = Array.isArray(topic) ? topic[0] : topic;

	return (
		<AppLayout
			activeDrawerId="manual"
			leadingMode="back"
			onPressBack={() => router.back()}
			title={appRoutes.manual.label}
			type="scrollview"
		>
			<TutorialContentView topicSlug={topicSlug} />
		</AppLayout>
	);
}
