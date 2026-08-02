import Constants from "expo-constants";

import {
	contentPackScope,
	contentPackTable,
	type ContentPackManifest,
	type ContentPackManifestRow,
	type LocalContentPackMetadata,
} from "@/database/content-pack/content-pack";
import { getSupabaseClientOrNull } from "@/lib/supabase/supabase-client";

export type ContentPackUpdateCheckResult =
	| {
			reason: "supabase-not-configured";
			status: "unavailable";
	  }
	| {
			reason: "no-published-pack";
			status: "unavailable";
	  }
	| {
			manifest: ContentPackManifest;
			status: "up-to-date";
	  }
	| {
			manifest: ContentPackManifest;
			reason: "app-version-not-supported" | "schema-version-not-supported";
			status: "incompatible";
	  }
	| {
			manifest: ContentPackManifest;
			status: "update-available";
	  };

const supportedContentPackSchemaVersion = 1;

export async function checkRemoteContentPackUpdateAsync(
	localMetadata: LocalContentPackMetadata,
): Promise<ContentPackUpdateCheckResult> {
	const manifest = await fetchLatestContentPackManifestAsync();

	if (!manifest) {
		return {
			reason: getSupabaseClientOrNull() ? "no-published-pack" : "supabase-not-configured",
			status: "unavailable",
		};
	}

	if (manifest.schemaVersion > supportedContentPackSchemaVersion) {
		return {
			manifest,
			reason: "schema-version-not-supported",
			status: "incompatible",
		};
	}

	if (!isAppVersionSupported(manifest.minAppVersion)) {
		return {
			manifest,
			reason: "app-version-not-supported",
			status: "incompatible",
		};
	}

	if (manifest.packVersion === localMetadata.packVersion) {
		return {
			manifest,
			status: "up-to-date",
		};
	}

	return {
		manifest,
		status: "update-available",
	};
}

export async function fetchLatestContentPackManifestAsync(): Promise<ContentPackManifest | null> {
	const supabase = getSupabaseClientOrNull();

	if (!supabase) {
		return null;
	}

	const columns = [
		contentPackTable.columns.id,
		contentPackTable.columns.scope,
		contentPackTable.columns.status,
		contentPackTable.columns.packVersion,
		contentPackTable.columns.schemaVersion,
		contentPackTable.columns.createdAt,
		contentPackTable.columns.checksum,
		contentPackTable.columns.checksumAlgorithm,
		contentPackTable.columns.downloadUrl,
		contentPackTable.columns.minAppVersion,
	].join(", ");

	const { data, error } = await supabase
		.from(contentPackTable.name)
		.select(columns)
		.eq(contentPackTable.columns.scope, contentPackScope)
		.eq(contentPackTable.columns.status, "published")
		.order(contentPackTable.columns.createdAt, { ascending: false })
		.limit(1)
		.maybeSingle<ContentPackManifestRow>();

	if (error) {
		throw error;
	}

	return data ? rowToContentPackManifest(data) : null;
}

function rowToContentPackManifest(row: ContentPackManifestRow): ContentPackManifest {
	return {
		checksum: row.checksum,
		checksumAlgorithm: row.checksum_algorithm ?? "md5",
		createdAt: row.created_at,
		downloadUrl: row.download_url,
		id: row.id,
		minAppVersion: row.min_app_version,
		packVersion: row.pack_version,
		schemaVersion: row.schema_version,
		scope: row.scope,
		status: row.status,
	};
}

function isAppVersionSupported(minAppVersion: string | null) {
	if (!minAppVersion) {
		return true;
	}

	const currentVersion = Constants.expoConfig?.version ?? "0.0.0";

	return compareSemverLike(currentVersion, minAppVersion) >= 0;
}

function compareSemverLike(left: string, right: string) {
	const leftParts = parseVersionParts(left);
	const rightParts = parseVersionParts(right);
	const maxLength = Math.max(leftParts.length, rightParts.length);

	for (let index = 0; index < maxLength; index += 1) {
		const diff = (leftParts[index] ?? 0) - (rightParts[index] ?? 0);

		if (diff !== 0) {
			return diff;
		}
	}

	return 0;
}

function parseVersionParts(version: string) {
	return version
		.split(".")
		.map(part => Number.parseInt(part, 10))
		.map(part => (Number.isNaN(part) ? 0 : part));
}
