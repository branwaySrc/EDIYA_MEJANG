import { useRouter } from "expo-router";

import { HiringSummaryView } from "@/components/features/sajang/hiring/hiring-summary-view";
import { AppLayout } from "@/components/global/app-layout";

export default function HiringSummaryScreen() {
	const router = useRouter();

	return (
		<AppLayout drawerEnabled={false} leadingMode="back" onPressBack={() => router.back()} title="주요 요약" type="scrollview">
			<HiringSummaryView />
		</AppLayout>
	);
}
