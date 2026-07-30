import { useRouter } from "expo-router";

import { PaidCustomerRegistrationView } from "@/components/features/paid/paid-customer-registration-view";
import { AppLayout } from "@/components/global/app-layout";

export default function NewPaidCustomerScreen() {
	const router = useRouter();

	return (
		<AppLayout
			drawerEnabled={false}
			leadingMode="back"
			onPressBack={() => {
				if (router.canGoBack()) {
					router.back();
					return;
				}

				router.replace("/paid-customer");
			}}
			title="선불 신규등록"
			type="scrollview"
		>
			<PaidCustomerRegistrationView />
		</AppLayout>
	);
}
