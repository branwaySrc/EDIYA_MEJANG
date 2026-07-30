import { OwnerPasscodeView } from "@/components/features/sajang/owner-passcode-view";
import { AppLayout } from "@/components/global/app-layout";
import { appRoutes } from "@/constants/route";

export default function SajangPasscodeScreen() {
	return (
		<AppLayout activeDrawerId="owner-space" title={appRoutes["owner-space"].label} type="view">
			<OwnerPasscodeView />
		</AppLayout>
	);
}
