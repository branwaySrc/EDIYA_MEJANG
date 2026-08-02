import { Redirect } from "expo-router";

import { OwnerPasscodeView } from "@/components/features/sajang/owner-passcode-view";
import { AppLayout } from "@/components/global/app-layout";
import { appRoutes } from "@/constants/route";
import { useSajangAuthStore } from "@/store/sajang-auth-store";

export default function SajangPasscodeScreen() {
	const unlocked = useSajangAuthStore(state => state.unlocked);

	if (unlocked) {
		return <Redirect href="/sajang/home" />;
	}

	return (
		<AppLayout activeDrawerId="owner-space" title={appRoutes["owner-space"].label} type="view">
			<OwnerPasscodeView />
		</AppLayout>
	);
}
