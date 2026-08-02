import { recipeSchema, recipeTable } from "@/database/recipe/recipe.type";

export {
	contentPackScope,
	type ContentPackChecksumAlgorithm,
	type ContentPackManifest,
	type ContentPackManifestRow,
	type ContentPackScope,
	type ContentPackStatus,
	type LocalContentPackMetadata,
	type LocalFindEntryRow,
	type LocalRecipeDetailRow,
} from "@/database/content-pack/content-pack.type";

export const contentPackTable = {
	name: "content_packs",
	columns: {
		checksum: "checksum",
		checksumAlgorithm: "checksum_algorithm",
		createdAt: "created_at",
		downloadUrl: "download_url",
		id: "id",
		minAppVersion: "min_app_version",
		packVersion: "pack_version",
		schemaVersion: "schema_version",
		scope: "scope",
		status: "status",
	},
} as const;

export const localContentPackSettingKeys = {
	appliedAt: "content_pack_applied_at",
	packVersion: "content_pack_version",
	schemaVersion: "content_pack_schema_version",
} as const;

export const localContentPackSchema = {
	currentSchemaVersion: 1,
	createTableSql: `
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT
);

${recipeSchema.createTableSql}

CREATE TABLE IF NOT EXISTS recipe_details (
  recipe_id TEXT PRIMARY KEY NOT NULL,
  detail_json TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (recipe_id) REFERENCES ${recipeTable.name} (${recipeTable.columns.id}) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS find_entries (
  id TEXT PRIMARY KEY NOT NULL,
  recipe_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  chosung TEXT,
  keywords_json TEXT NOT NULL,
  entry_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE VIRTUAL TABLE IF NOT EXISTS search_index USING fts5(
  id UNINDEXED,
  kind UNINDEXED,
  recipe_id UNINDEXED,
  title,
  summary,
  keywords,
  chosung
);
`.trim(),
} as const;
