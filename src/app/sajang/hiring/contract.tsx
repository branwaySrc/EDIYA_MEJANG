import { useRouter } from "expo-router";

import { HiringContractPreview } from "@/components/features/sajang/hiring/hiring-contract-preview";
import { AppLayout } from "@/components/global/app-layout";

export default function HiringContractScreen() {
	const router = useRouter();

	return (
		<AppLayout drawerEnabled={false} leadingMode="back" onPressBack={() => router.back()} title="계약서 작성" type="scrollview">
			<HiringContractPreview />
		</AppLayout>
	);
}
