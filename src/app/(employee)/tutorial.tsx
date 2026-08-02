import { TutorialList } from "@/components/features/tutorial/tutorial-list";
import { AppLayout } from "@/components/global/app-layout";
import { appRoutes } from "@/constants/route";

export default function TutorialScreen() {
	return (
		<AppLayout activeDrawerId="manual" title={appRoutes.manual.label} type="scrollview">
			<TutorialList detailRoutePrefix="/manual/tutorial" />
		</AppLayout>
	);
}
