import type { ImageSourcePropType } from "react-native";

export type FindEntryKind = "material" | "pos";

export type FindEntryBase = {
	chosung?: string;
	id: string;
	keywords: string[];
	kind: FindEntryKind;
	notes?: string;
	recipeId: string;
	summary: string;
	title: string;
	updatedAt: string;
};

export type FindMaterialEntry = FindEntryBase & {
	kind: "material";
	materialGroups: FindMaterialDetailBlock[];
	storageLocations: FindMaterialDetailBlock[];
};

export type FindMaterialDetailImage = {
	alt?: string;
	desc?: string;
	image?: ImageSourcePropType;
	id: string;
	source?: ImageSourcePropType;
	title?: string;
};

export type FindMaterialDetailBlock = {
	description?: string;
	id: string;
	images?: FindMaterialDetailImage[];
	title: string;
};

export type FindPosEntry = FindEntryBase & {
	buttonLabel: string;
	kind: "pos";
	posImages: FindMaterialDetailImage[];
	posPath: string[];
	screenName: string;
};

export type FindEntry = FindMaterialEntry | FindPosEntry;

export const findEntryKindLabels: Record<FindEntryKind, string> = {
	material: "재료",
	pos: "POS",
};

export const findEntryDetailTitleLabels: Record<FindEntryKind, string> = {
	material: "재료정보",
	pos: "POS",
};
