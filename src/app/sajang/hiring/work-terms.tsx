import { useRouter } from "expo-router";

import { HiringWorkTermsStep } from "@/components/features/sajang/hiring/hiring-work-terms-step";
import { AppLayout } from "@/components/global/app-layout";

export default function HiringWorkTermsScreen() {
	const router = useRouter();

	return (
		<AppLayout drawerEnabled={false} leadingMode="back" onPressBack={() => router.back()} title="근로 시간 및 임금" type="scrollview">
			<HiringWorkTermsStep />
		</AppLayout>
	);
}
