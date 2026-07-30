import { UnderlineTabMenu, type UnderlineTabItem } from "@/components/ui/underline-tab-menu";

export type HomeTabId = "store" | "beverage" | "bakery" | "event";

export type HomeTabMenuProps = {
	activeId: HomeTabId;
	onChange: (id: HomeTabId) => void;
};

const homeTabs: UnderlineTabItem<HomeTabId>[] = [
	{ id: "store", label: "저장" },
	{ id: "beverage", label: "음료" },
	{ id: "bakery", label: "베이커리" },
	{ id: "event", label: "이벤트" },
];

export function HomeTabMenu({ activeId, onChange }: HomeTabMenuProps) {
	return <UnderlineTabMenu activeId={activeId} items={homeTabs} onChange={onChange} />;
}

export default HomeTabMenu;
