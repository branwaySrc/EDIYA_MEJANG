import { UnderlineTabMenu, type UnderlineTabItem } from "@/components/ui/underline-tab-menu";

export type AttendanceTabId = "calendar" | "logs" | "statistics";

export type AttendanceTabMenuProps = {
	activeId: AttendanceTabId;
	onChange: (id: AttendanceTabId) => void;
};

const attendanceTabs: UnderlineTabItem<AttendanceTabId>[] = [
	{ id: "calendar", label: "달력표" },
	{ id: "logs", label: "로그" },
	{ id: "statistics", label: "통계" },
];

export function AttendanceTabMenu({ activeId, onChange }: AttendanceTabMenuProps) {
	return <UnderlineTabMenu activeId={activeId} items={attendanceTabs} onChange={onChange} />;
}

export default AttendanceTabMenu;
