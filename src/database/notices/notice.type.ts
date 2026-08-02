import type {
	ManagedContentSection,
	ManagedContentShiftGroup,
} from "@/database/manual/manual.type";

export type Notice = {
	body: string[];
	description?: string;
	id: string;
	keywords: string[];
	sections?: ManagedContentSection[];
	shiftGroup?: ManagedContentShiftGroup;
	title: string;
	uploadedAt: string;
};
