import { UnderlineTabMenu, type UnderlineTabItem } from "@/components/ui/underline-tab-menu";

export type FindTabId = "material" | "pos";

export type FindTabMenuProps = {
	activeId: FindTabId;
	onChange: (id: FindTabId) => void;
};

const findTabs: UnderlineTabItem<FindTabId>[] = [
	{ id: "material", label: "재료" },
	{ id: "pos", label: "POS" },
];

export function FindTabMenu({ activeId, onChange }: FindTabMenuProps) {
	return <UnderlineTabMenu activeId={activeId} items={findTabs} onChange={onChange} />;
}

export default FindTabMenu;
