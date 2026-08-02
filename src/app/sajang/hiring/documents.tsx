import { useRouter } from "expo-router";

import { HiringDocumentsStep } from "@/components/features/sajang/hiring/hiring-documents-step";
import { AppLayout } from "@/components/global/app-layout";

export default function HiringDocumentsScreen() {
	const router = useRouter();

	return (
		<AppLayout drawerEnabled={false} leadingMode="back" onPressBack={() => router.back()} title="필수 서류 등록" type="scrollview">
			<HiringDocumentsStep />
		</AppLayout>
	);
}
