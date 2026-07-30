import { memo } from "react";

import { UnderlineTabMenu, type UnderlineTabItem } from "@/components/ui/underline-tab-menu";
import { deliverySiteIds, deliverySites } from "@/database/delivery/delivery-site";
import type { DeliverySiteId } from "@/database/delivery/delivery-site.type";

export type AdminTabMenuProps = {
	activeId: DeliverySiteId;
	onChange: (id: DeliverySiteId) => void;
};

const adminTabs: UnderlineTabItem<DeliverySiteId>[] = deliverySiteIds.map(id => ({
	id,
	label: deliverySites[id].tabLabel,
	accessibilityLabel: `${deliverySites[id].title} 열기`,
}));

export const AdminTabMenu = memo(function AdminTabMenu({ activeId, onChange }: AdminTabMenuProps) {
	return <UnderlineTabMenu activeId={activeId} items={adminTabs} onChange={onChange} />;
});

export default AdminTabMenu;
