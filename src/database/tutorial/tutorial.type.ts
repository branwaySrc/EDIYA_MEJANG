import type { ImageSourcePropType } from "react-native";

import type { AppIconProps } from "@/components/base/app-icon";
import type {
	ManagedContentSection,
	ManagedContentShiftGroup,
} from "@/database/manual/manual.type";

export type TutorialTopicSlug =
	| "store-dispatch"
	| "close-kiosk"
	| "close-pos"
	| "popcorn"
	| "bill-paper"
	| "awning"
	| "return-kiosk"
	| "return-pos";

export type TutorialTopic = {
	description: string;
	icon: AppIconProps["name"];
	slug: TutorialTopicSlug;
	title: string;
};

export type TutorialContentBlock =
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

export type TutorialEntry = {
	blocks: TutorialContentBlock[];
	description?: string;
	id: string;
	sections?: ManagedContentSection[];
	shiftGroup?: ManagedContentShiftGroup;
	title: string;
	topicSlug?: TutorialTopicSlug;
};

export type TutorialTopicRecord = {
	description: string;
	icon_name: AppIconProps["name"];
	id: string;
	is_active: boolean;
	slug: TutorialTopicSlug;
	sort_order: number;
	title: string;
};

export type TutorialEntryRecord = {
	id: string;
	is_published: boolean;
	sort_order: number;
	title: string;
	topic_slug: TutorialTopicSlug;
};

export type TutorialEntryBlockRecord = {
	alt_text: string | null;
	block_type: "text" | "image";
	body: string | null;
	entry_id: string;
	id: string;
	sort_order: number;
	storage_path: string | null;
};
