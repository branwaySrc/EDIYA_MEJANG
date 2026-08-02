import { useLocalSearchParams, useRouter } from "expo-router";

import { EmployeeDetailView } from "@/components/features/sajang/employee-management/employee-detail-view";
import { AppLayout } from "@/components/global/app-layout";

export default function SajangEmployeeDetailScreen() {
	const router = useRouter();
	const params = useLocalSearchParams<{ employeeId?: string | string[] }>();
	const employeeId = Array.isArray(params.employeeId) ? params.employeeId[0] : params.employeeId ?? "";

	return (
		<AppLayout
			activeDrawerId="owner-space"
			leadingMode="back"
			onPressBack={() => router.back()}
			scrollViewProps={{ keyboardShouldPersistTaps: "handled" }}
			title="직원 상세"
			type="scrollview"
		>
			<EmployeeDetailView employeeId={employeeId} />
		</AppLayout>
	);
}
