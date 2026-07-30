import { EmployeeView } from "@/components/features/employee/employee-view";
import { AppLayout } from "@/components/global/app-layout";
import { appRoutes } from "@/constants/route";

export default function EmployeeInfoScreen() {
	return (
		<AppLayout activeDrawerId="employee-info" title={appRoutes["employee-info"].label} type="scrollview">
			<EmployeeView />
		</AppLayout>
	);
}
