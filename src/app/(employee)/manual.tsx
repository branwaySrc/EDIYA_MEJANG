import { ManualList } from "@/components/features/manual/manual-list";
import { AppLayout } from "@/components/global/app-layout";
import { appRoutes } from "@/constants/route";

export default function ManualScreen() {
	return (
		<AppLayout activeDrawerId="manual" title={appRoutes.manual.label} type="scrollview">
			<ManualList />
		</AppLayout>
	);
}
