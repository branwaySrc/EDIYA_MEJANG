import { useRouter } from "expo-router";

import { HiringCompleteView } from "@/components/features/sajang/hiring/hiring-complete-view";
import { AppLayout } from "@/components/global/app-layout";

export default function HiringCompleteScreen() {
	const router = useRouter();

	return (
		<AppLayout drawerEnabled={false} leadingMode="back" onPressBack={() => router.dismissTo("/sajang/home")} title="PDF 저장 완료" type="scrollview">
			<HiringCompleteView />
		</AppLayout>
	);
}
