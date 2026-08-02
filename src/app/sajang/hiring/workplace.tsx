import { useRouter } from "expo-router";

import { HiringWorkplaceStep } from "@/components/features/sajang/hiring/hiring-workplace-step";
import { AppLayout } from "@/components/global/app-layout";

export default function HiringWorkplaceScreen() {
	const router = useRouter();

	return (
		<AppLayout drawerEnabled={false} leadingMode="back" onPressBack={() => router.back()} title="근무지 선택" type="scrollview">
			<HiringWorkplaceStep />
		</AppLayout>
	);
}
