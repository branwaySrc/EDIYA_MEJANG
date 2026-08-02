import { useState } from "react";

import { ManualList } from "@/components/features/manual/manual-list";
import { TutorialList } from "@/components/features/tutorial/tutorial-list";
import { AppLayout } from "@/components/global/app-layout";
import { UnderlineTabMenu, type UnderlineTabItem } from "@/components/ui/underline-tab-menu";
import { appRoutes } from "@/constants/route";

type ManualTabId = "manual" | "tutorial";

const manualTabs: UnderlineTabItem<ManualTabId>[] = [
	{
		id: "manual",
		label: "직원메뉴",
	},
	{
		id: "tutorial",
		label: "튜토리얼",
	},
];

export default function ManualScreen() {
	const [activeTabId, setActiveTabId] = useState<ManualTabId>("manual");

	return (
		<AppLayout
			activeDrawerId="manual"
			title={appRoutes.manual.label}
			topSlot={<UnderlineTabMenu activeId={activeTabId} items={manualTabs} onChange={setActiveTabId} />}
			type="scrollview"
		>
			{activeTabId === "manual" ? <ManualList /> : <TutorialList detailRoutePrefix="/manual/tutorial" />}
		</AppLayout>
	);
}
