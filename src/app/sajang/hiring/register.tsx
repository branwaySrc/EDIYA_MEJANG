import { useRouter } from "expo-router";

import { HiringRegisterForm } from "@/components/features/sajang/hiring/hiring-register-form";
import { AppLayout } from "@/components/global/app-layout";

export default function HiringRegisterScreen() {
	const router = useRouter();

	return (
		<AppLayout drawerEnabled={false} leadingMode="back" onPressBack={() => router.dismissTo("/sajang/home")} title="신규 직원 정보" type="scrollview">
			<HiringRegisterForm />
		</AppLayout>
	);
}
