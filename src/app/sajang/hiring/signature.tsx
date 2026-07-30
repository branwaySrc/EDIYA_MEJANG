import { useRouter } from "expo-router";

import { HiringSignatureView } from "@/components/features/sajang/hiring/hiring-signature-view";
import { AppLayout } from "@/components/global/app-layout";

export default function HiringSignatureScreen() {
	const router = useRouter();

	return (
		<AppLayout drawerEnabled={false} leadingMode="back" onPressBack={() => router.back()} title="직원 서명" type="scrollview">
			<HiringSignatureView />
		</AppLayout>
	);
}
