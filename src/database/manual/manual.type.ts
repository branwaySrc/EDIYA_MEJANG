import type { ImageSourcePropType } from "react-native";

import type { AppIconProps } from "@/components/base/app-icon";

export type ManualCategorySlug = "open" | "middle" | "close" | "delivery" | "claim";

export type ManualCategory = {
	description: string;
	icon: AppIconProps["name"];
	slug: ManualCategorySlug;
	title: string;
};

export type ManualContentBlock =
	| {
			body: string;
			id: string;
			type: "text";
	  }
	| {
			alt: string;
			id: string;
			source: ImageSourcePropType;
			type: "image";
	  };

export type ManualEntry = {
	blocks: ManualContentBlock[];
	categorySlug: ManualCategorySlug;
	id: string;
	title: string;
};

export type ManualCategoryRecord = {
	description: string;
	icon_name: AppIconProps["name"];
	id: string;
	is_active: boolean;
	slug: ManualCategorySlug;
	sort_order: number;
	title: string;
};

export type ManualEntryRecord = {
	category_slug: ManualCategorySlug;
	id: string;
	is_published: boolean;
	sort_order: number;
	title: string;
};

export type ManualEntryBlockRecord = {
	alt_text: string | null;
	block_type: "text" | "image";
	body: string | null;
	entry_id: string;
	id: string;
	sort_order: number;
	storage_path: string | null;
};
