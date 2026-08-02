import * as FileSystem from "expo-file-system/legacy";
import { openDatabaseAsync, type SQLiteDatabase } from "expo-sqlite";

import {
	localContentPackSchema,
	localContentPackSettingKeys,
	type ContentPackManifest,
	type LocalContentPackMetadata,
	type LocalFindEntryRow,
	type LocalRecipeDetailRow,
} from "@/database/content-pack/content-pack";
import type { FindEntry } from "@/database/find/find.type";
import type { RecipeDetail } from "@/database/recipe/recipe-details.type";
import { recipeTable, type Recipe } from "@/database/recipe/recipe.type";

type AppSettingRow = {
	value: string | null;
};

type CountRow = {
	count: number;
};

type SqliteMasterTableRow = {
	name: string;
};

type UserVersionRow = {
	user_version: number;
};

type LocalContentPackSnapshot = {
	findEntries: FindEntry[];
	metadata: LocalContentPackMetadata;
	recipeDetails: Record<string, RecipeDetail>;
	recipes: Recipe[];
};

type LocalRecipeSearchContent = {
	findEntries: FindEntry[];
	metadata?: LocalContentPackMetadata;
	recipeDetails: Record<string, RecipeDetail>;
	recipes: Recipe[];
};

const deprecatedBundledContentPackVersion = "bundled-v1";
const emptyContentPackVersion = "empty-v1";
const contentPackDirectoryName = "content-packs";
const localContentPackDatabaseName = "ediya_content_pack.db";

let localContentPackDatabasePromise: Promise<SQLiteDatabase> | null = null;

export async function openLocalContentPackDatabaseAsync(): Promise<SQLiteDatabase> {
	await ensureLocalContentPackDirectoryAsync();

	localContentPackDatabasePromise ??= openDatabaseAsync(
		localContentPackDatabaseName,
		undefined,
		getLocalContentPackDirectoryUri() ?? undefined,
	);

	const database = await localContentPackDatabasePromise;

	await initializeLocalContentPackDatabaseAsync(database);

	return database;
}

export async function closeLocalContentPackDatabaseAsync(): Promise<void> {
	if (!localContentPackDatabasePromise) {
		return;
	}

	const database = await localContentPackDatabasePromise;

	localContentPackDatabasePromise = null;
	await database.closeAsync();
}

export async function initializeLocalContentPackDatabaseAsync(db?: SQLiteDatabase): Promise<void> {
	await ensureLocalContentPackDirectoryAsync();

	const database = db ?? (await openDatabaseAsync(
		localContentPackDatabaseName,
		undefined,
		getLocalContentPackDirectoryUri() ?? undefined,
	));

	await database.execAsync(localContentPackSchema.createTableSql);
	await database.execAsync(`PRAGMA user_version = ${localContentPackSchema.currentSchemaVersion};`);
	await initializeEmptyContentPackIfNeededAsync(database);
}

export async function getLocalContentPackMetadataAsync(db?: SQLiteDatabase): Promise<LocalContentPackMetadata> {
	const database = db ?? (await openLocalContentPackDatabaseAsync());
	const [packVersion, appliedAt, schemaVersion] = await Promise.all([
		getSettingAsync(database, localContentPackSettingKeys.packVersion),
		getSettingAsync(database, localContentPackSettingKeys.appliedAt),
		getSettingAsync(database, localContentPackSettingKeys.schemaVersion),
	]);

	return {
		appliedAt,
		packVersion,
		schemaVersion: schemaVersion ? Number(schemaVersion) : null,
	};
}

export async function readLocalContentPackSnapshotAsync(db?: SQLiteDatabase): Promise<LocalContentPackSnapshot> {
	const database = db ?? (await openLocalContentPackDatabaseAsync());
	const [recipes, recipeDetailRows, findEntryRows, metadata] = await Promise.all([
		readLocalRecipesAsync(database),
		database.getAllAsync<LocalRecipeDetailRow>(
			"SELECT recipe_id, detail_json, updated_at FROM recipe_details",
		),
		database.getAllAsync<LocalFindEntryRow>(
			[
				"SELECT id, recipe_id, kind, title, summary, chosung, keywords_json, entry_json, updated_at",
				"FROM find_entries",
				"ORDER BY title ASC",
			].join(" "),
		),
		getLocalContentPackMetadataAsync(database),
	]);

	return {
		findEntries: findEntryRows.map(row => parseJson<FindEntry>(row.entry_json, `find entry "${row.id}"`)),
		metadata,
		recipeDetails: Object.fromEntries(
			recipeDetailRows.map(row => [
				row.recipe_id,
				parseJson<RecipeDetail>(row.detail_json, `recipe detail "${row.recipe_id}"`),
			]),
		) as Record<string, RecipeDetail>,
		recipes,
	};
}

export async function replaceLocalRecipeSearchContentAsync(
	content: LocalRecipeSearchContent,
	db?: SQLiteDatabase,
): Promise<LocalContentPackMetadata> {
	const database = db ?? (await openLocalContentPackDatabaseAsync());
	const appliedAt = content.metadata?.appliedAt ?? new Date().toISOString();
	const metadata = {
		appliedAt,
		packVersion: content.metadata?.packVersion ?? `cache-${appliedAt.replace(/\D/g, "").slice(0, 14)}`,
		schemaVersion: content.metadata?.schemaVersion ?? localContentPackSchema.currentSchemaVersion,
	};

	await database.withTransactionAsync(async () => {
		await database.runAsync("DELETE FROM search_index");
		await database.runAsync("DELETE FROM find_entries");
		await database.runAsync("DELETE FROM recipe_details");
		await database.runAsync(`DELETE FROM ${recipeTable.name}`);

		for (const recipe of content.recipes) {
			await insertRecipeAsync(database, recipe);
			await insertRecipeDetailAsync(
				database,
				recipe.id,
				content.recipeDetails[recipe.id] ?? createEmptyRecipeDetail(),
				recipe.updatedAt,
			);
		}

		for (const entry of content.findEntries) {
			await insertFindEntryAsync(database, entry);
		}

		await setLocalContentPackMetadataAsync(metadata, database);
	});

	return metadata;
}

export async function downloadContentPackDatabaseAsync(manifest: ContentPackManifest): Promise<string> {
	const directoryUri = await ensureLocalContentPackDirectoryAsync();

	if (!directoryUri) {
		throw new Error("Content pack downloads are not available on this platform.");
	}

	const downloadUri = `${directoryUri}download-${Date.now()}-${manifest.packVersion}.db`;
	const result = await FileSystem.downloadAsync(manifest.downloadUrl, downloadUri);

	if (result.status < 200 || result.status >= 300) {
		await FileSystem.deleteAsync(downloadUri, { idempotent: true });
		throw new Error(`Content pack download failed with HTTP ${result.status}.`);
	}

	await verifyContentPackFileAsync(result.uri, manifest);
	await validateDownloadedContentPackDatabaseAsync(result.uri, manifest);

	return result.uri;
}

export async function replaceLocalContentPackDatabaseAsync(
	manifest: ContentPackManifest,
	downloadedDatabaseUri: string,
): Promise<LocalContentPackMetadata> {
	const directoryUri = await ensureLocalContentPackDirectoryAsync();

	if (!directoryUri) {
		throw new Error("Content pack replacement is not available on this platform.");
	}

	await closeLocalContentPackDatabaseAsync();

	const activeDatabaseUri = `${directoryUri}${localContentPackDatabaseName}`;
	const backupDatabaseUri = `${directoryUri}${localContentPackDatabaseName}.bak`;
	let hasBackup = false;

	try {
		await deleteDatabaseSidecarsAsync(activeDatabaseUri);
		await deleteDatabaseSidecarsAsync(backupDatabaseUri);
		await FileSystem.deleteAsync(backupDatabaseUri, { idempotent: true });

		const activeInfo = await FileSystem.getInfoAsync(activeDatabaseUri);

		if (activeInfo.exists) {
			await FileSystem.copyAsync({ from: activeDatabaseUri, to: backupDatabaseUri });
			hasBackup = true;
		}

		await FileSystem.deleteAsync(activeDatabaseUri, { idempotent: true });
		await FileSystem.moveAsync({ from: downloadedDatabaseUri, to: activeDatabaseUri });

		const database = await openLocalContentPackDatabaseAsync();
		const appliedAt = new Date().toISOString();

		await setLocalContentPackMetadataAsync(
			{
				appliedAt,
				packVersion: manifest.packVersion,
				schemaVersion: manifest.schemaVersion,
			},
			database,
		);

		return {
			appliedAt,
			packVersion: manifest.packVersion,
			schemaVersion: manifest.schemaVersion,
		};
	} catch (error) {
		await restoreBackupDatabaseAsync({
			activeDatabaseUri,
			backupDatabaseUri,
			hasBackup,
		});

		throw error;
	}
}

async function initializeEmptyContentPackIfNeededAsync(database: SQLiteDatabase) {
	const currentPackVersion = await getSettingAsync(database, localContentPackSettingKeys.packVersion);

	if (currentPackVersion && currentPackVersion !== deprecatedBundledContentPackVersion) {
		return;
	}

	const initializedAt = new Date().toISOString();

	await database.withTransactionAsync(async () => {
		await database.runAsync("DELETE FROM search_index");
		await database.runAsync("DELETE FROM find_entries");
		await database.runAsync("DELETE FROM recipe_details");
		await database.runAsync(`DELETE FROM ${recipeTable.name}`);

		await setLocalContentPackMetadataAsync(
			{
				appliedAt: initializedAt,
				packVersion: emptyContentPackVersion,
				schemaVersion: localContentPackSchema.currentSchemaVersion,
			},
			database,
		);
	});
}

async function readLocalRecipesAsync(database: SQLiteDatabase): Promise<Recipe[]> {
	return await database.getAllAsync<Recipe>(
		[
			"SELECT",
			"id,",
			"name,",
			"category,",
			"sub_category AS subCategory,",
			"chosung,",
			"created_at AS createdAt,",
			"updated_at AS updatedAt",
			`FROM ${recipeTable.name}`,
			"ORDER BY name ASC",
		].join(" "),
	);
}

async function insertRecipeAsync(database: SQLiteDatabase, recipe: Recipe) {
	await database.runAsync(
		[
			`INSERT INTO ${recipeTable.name} (`,
			"id, name, category, sub_category, chosung, created_at, updated_at",
			") VALUES (?, ?, ?, ?, ?, ?, ?)",
		].join(" "),
		recipe.id,
		recipe.name,
		recipe.category,
		recipe.subCategory,
		recipe.chosung ?? null,
		recipe.createdAt,
		recipe.updatedAt,
	);
}

async function insertRecipeDetailAsync(
	database: SQLiteDatabase,
	recipeId: string,
	detail: RecipeDetail,
	updatedAt: string,
) {
	await database.runAsync(
		"INSERT INTO recipe_details (recipe_id, detail_json, updated_at) VALUES (?, ?, ?)",
		recipeId,
		JSON.stringify(detail),
		updatedAt,
	);
}

async function insertFindEntryAsync(database: SQLiteDatabase, entry: FindEntry) {
	await database.runAsync(
		[
			"INSERT INTO find_entries (",
			"id, recipe_id, kind, title, summary, chosung, keywords_json, entry_json, updated_at",
			") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
		].join(" "),
		entry.id,
		entry.recipeId,
		entry.kind,
		entry.title,
		entry.summary,
		entry.chosung ?? null,
		JSON.stringify(entry.keywords),
		JSON.stringify(entry),
		entry.updatedAt,
	);

	await database.runAsync(
		"INSERT INTO search_index (id, kind, recipe_id, title, summary, keywords, chosung) VALUES (?, ?, ?, ?, ?, ?, ?)",
		entry.id,
		entry.kind,
		entry.recipeId,
		entry.title,
		entry.summary,
		entry.keywords.join(" "),
		entry.chosung ?? "",
	);
}

function createEmptyRecipeDetail(): RecipeDetail {
	return {
		delivery: [],
		heroVisuals: [],
		packaging: [],
		steps: [],
		storeServing: [],
	};
}

async function getSettingAsync(database: SQLiteDatabase, key: string) {
	const row = await database.getFirstAsync<AppSettingRow>("SELECT value FROM app_settings WHERE key = ?", key);

	return row?.value ?? null;
}

async function setLocalContentPackMetadataAsync(metadata: LocalContentPackMetadata, database: SQLiteDatabase) {
	await setSettingAsync(database, localContentPackSettingKeys.packVersion, metadata.packVersion);
	await setSettingAsync(database, localContentPackSettingKeys.appliedAt, metadata.appliedAt);
	await setSettingAsync(
		database,
		localContentPackSettingKeys.schemaVersion,
		metadata.schemaVersion === null ? null : String(metadata.schemaVersion),
	);
}

async function setSettingAsync(database: SQLiteDatabase, key: string, value: string | null) {
	await database.runAsync(
		"INSERT INTO app_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
		key,
		value,
	);
}

async function verifyContentPackFileAsync(fileUri: string, manifest: ContentPackManifest) {
	if (manifest.checksumAlgorithm !== "md5") {
		throw new Error(`Unsupported content pack checksum algorithm: ${manifest.checksumAlgorithm}`);
	}

	const fileInfo = await FileSystem.getInfoAsync(fileUri, { md5: true });

	if (!fileInfo.exists) {
		throw new Error("Downloaded content pack file does not exist.");
	}

	if (!fileInfo.md5 || fileInfo.md5.toLowerCase() !== manifest.checksum.toLowerCase()) {
		throw new Error("Downloaded content pack checksum does not match the manifest.");
	}
}

async function validateDownloadedContentPackDatabaseAsync(fileUri: string, manifest: ContentPackManifest) {
	const directoryUri = getLocalContentPackDirectoryUri();

	if (!directoryUri) {
		throw new Error("Content pack validation is not available on this platform.");
	}

	const databaseName = getDatabaseNameFromUri(fileUri);
	const database = await openDatabaseAsync(databaseName, { useNewConnection: true }, directoryUri);

	try {
		const userVersion = await database.getFirstAsync<UserVersionRow>("PRAGMA user_version");

		if (userVersion?.user_version !== manifest.schemaVersion) {
			throw new Error("Downloaded content pack schema version does not match the manifest.");
		}

		const requiredTables = ["app_settings", "recipes", "recipe_details", "find_entries", "search_index"];
		const tables = await database.getAllAsync<SqliteMasterTableRow>(
			[
				"SELECT name FROM sqlite_master",
				"WHERE type IN ('table', 'virtual table')",
				`AND name IN (${requiredTables.map(() => "?").join(", ")})`,
			].join(" "),
			...requiredTables,
		);
		const tableNames = new Set(tables.map(table => table.name));
		const missingTables = requiredTables.filter(tableName => !tableNames.has(tableName));

		if (missingTables.length > 0) {
			throw new Error(`Downloaded content pack is missing required tables: ${missingTables.join(", ")}.`);
		}

		const recipeCount = await database.getFirstAsync<CountRow>("SELECT COUNT(*) AS count FROM recipes");

		if ((recipeCount?.count ?? 0) <= 0) {
			throw new Error("Downloaded content pack does not contain recipe rows.");
		}
	} finally {
		await database.closeAsync();
	}
}

async function restoreBackupDatabaseAsync({
	activeDatabaseUri,
	backupDatabaseUri,
	hasBackup,
}: {
	activeDatabaseUri: string;
	backupDatabaseUri: string;
	hasBackup: boolean;
}) {
	await FileSystem.deleteAsync(activeDatabaseUri, { idempotent: true });

	if (hasBackup) {
		await FileSystem.copyAsync({ from: backupDatabaseUri, to: activeDatabaseUri });
	}
}

async function deleteDatabaseSidecarsAsync(databaseUri: string) {
	await FileSystem.deleteAsync(`${databaseUri}-shm`, { idempotent: true });
	await FileSystem.deleteAsync(`${databaseUri}-wal`, { idempotent: true });
}

async function ensureLocalContentPackDirectoryAsync() {
	const directoryUri = getLocalContentPackDirectoryUri();

	if (!directoryUri) {
		return null;
	}

	await FileSystem.makeDirectoryAsync(directoryUri, { intermediates: true });

	return directoryUri;
}

function getLocalContentPackDirectoryUri() {
	return FileSystem.documentDirectory ? `${FileSystem.documentDirectory}${contentPackDirectoryName}/` : null;
}

function getDatabaseNameFromUri(fileUri: string) {
	const parts = fileUri.split("/");
	const databaseName = parts.at(-1);

	if (!databaseName) {
		throw new Error("Content pack database filename is invalid.");
	}

	return databaseName;
}

function parseJson<T>(serializedValue: string, label: string): T {
	try {
		return JSON.parse(serializedValue) as T;
	} catch {
		throw new Error(`Invalid JSON stored for ${label}.`);
	}
}
