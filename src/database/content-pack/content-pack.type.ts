export const contentPackScope = "recipe_search";

export type ContentPackScope = typeof contentPackScope;
export type ContentPackStatus = "archived" | "draft" | "published";
export type ContentPackChecksumAlgorithm = "md5";

export type ContentPackManifest = {
	checksum: string;
	checksumAlgorithm: ContentPackChecksumAlgorithm;
	createdAt: string;
	downloadUrl: string;
	id: string;
	minAppVersion: string | null;
	packVersion: string;
	schemaVersion: number;
	scope: ContentPackScope;
	status: ContentPackStatus;
};

export type ContentPackManifestRow = {
	checksum: string;
	checksum_algorithm: ContentPackChecksumAlgorithm | null;
	created_at: string;
	download_url: string;
	id: string;
	min_app_version: string | null;
	pack_version: string;
	schema_version: number;
	scope: ContentPackScope;
	status: ContentPackStatus;
};

export type LocalContentPackMetadata = {
	appliedAt: string | null;
	packVersion: string | null;
	schemaVersion: number | null;
};

export type LocalRecipeDetailRow = {
	detail_json: string;
	recipe_id: string;
	updated_at: string;
};

export type LocalFindEntryRow = {
	chosung: string | null;
	entry_json: string;
	id: string;
	keywords_json: string;
	kind: string;
	recipe_id: string;
	summary: string;
	title: string;
	updated_at: string;
};
