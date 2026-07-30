import { TutorialList } from "@/components/features/tutorial/tutorial-list";
import { AppLayout } from "@/components/global/app-layout";
import { appRoutes } from "@/constants/route";

export default function TutorialScreen() {
	return (
		<AppLayout activeDrawerId="tutorial" title={appRoutes.tutorial.label} type="scrollview">
			<TutorialList />
		</AppLayout>
	);
}
