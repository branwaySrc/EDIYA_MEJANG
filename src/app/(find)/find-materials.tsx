import { useCallback, useState } from "react";
import { StyleSheet } from "react-native";

import { FindDetailDrawer } from "@/components/features/find/find-detail-drawer";
import { FindTabMenu, type FindTabId } from "@/components/features/find/find-tab-menu";
import { FindView } from "@/components/features/find/find-view";
import { AppLayout } from "@/components/global/app-layout";
import { appRoutes } from "@/constants/route";
import type { FindEntry } from "@/database/find/find";

export default function FindMaterialsScreen() {
	const [activeTabId, setActiveTabId] = useState<FindTabId>("material");
	const [selectedEntry, setSelectedEntry] = useState<FindEntry | null>(null);
	const [drawerOpen, setDrawerOpen] = useState(false);

	const openDrawer = useCallback((entry: FindEntry) => {
		setSelectedEntry(entry);
		setDrawerOpen(true);
	}, []);

	const closeDrawer = useCallback(() => {
		setDrawerOpen(false);
	}, []);

	return (
		<>
			<AppLayout
				activeDrawerId="find-materials"
				contentStyle={styles.content}
				title={appRoutes["find-materials"].label}
				type="view"
				topSlot={<FindTabMenu activeId={activeTabId} onChange={setActiveTabId} />}
			>
				<FindView activeKind={activeTabId} onOpenEntry={openDrawer} />
			</AppLayout>
			<FindDetailDrawer entry={selectedEntry} onClose={closeDrawer} open={drawerOpen} />
		</>
	);
}

const styles = StyleSheet.create({
	content: {
		flex: 1,
	},
});
