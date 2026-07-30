import { useLocalSearchParams, useRouter } from "expo-router";

import { ManualContentView } from "@/components/features/manual/manual-content-view";
import { AppLayout } from "@/components/global/app-layout";
import { appRoutes } from "@/constants/route";

export default function ManualContentScreen() {
	const router = useRouter();
	const { category } = useLocalSearchParams<{ category?: string | string[] }>();
	const categorySlug = Array.isArray(category) ? category[0] : category;

	return (
		<AppLayout
			activeDrawerId="manual"
			leadingMode="back"
			onPressBack={() => router.back()}
			title={appRoutes.manual.label}
			type="scrollview"
		>
			<ManualContentView categorySlug={categorySlug} />
		</AppLayout>
	);
}
