import type { ContentPackManifest, LocalContentPackMetadata } from "@/database/content-pack/content-pack";
import {
	downloadContentPackDatabaseAsync,
	getLocalContentPackMetadataAsync,
	replaceLocalContentPackDatabaseAsync,
} from "@/lib/content-pack/local-content-pack";
import { checkRemoteContentPackUpdateAsync } from "@/lib/content-pack/remote-content-pack";

export type ApplyContentPackUpdateResult =
	| {
			metadata: LocalContentPackMetadata;
			status: "applied";
	  }
	| {
			metadata: LocalContentPackMetadata;
			status: "up-to-date";
	  }
	| {
			metadata: LocalContentPackMetadata;
			reason: "no-published-pack" | "supabase-not-configured";
			status: "unavailable";
	  }
	| {
			manifest: ContentPackManifest;
			metadata: LocalContentPackMetadata;
			reason: "app-version-not-supported" | "schema-version-not-supported";
			status: "incompatible";
	  };

export async function applyLatestContentPackUpdateAsync(): Promise<ApplyContentPackUpdateResult> {
	const metadata = await getLocalContentPackMetadataAsync();
	const updateCheck = await checkRemoteContentPackUpdateAsync(metadata);

	if (updateCheck.status === "unavailable") {
		return {
			metadata,
			reason: updateCheck.reason,
			status: "unavailable",
		};
	}

	if (updateCheck.status === "incompatible") {
		return {
			manifest: updateCheck.manifest,
			metadata,
			reason: updateCheck.reason,
			status: "incompatible",
		};
	}

	if (updateCheck.status === "up-to-date") {
		return {
			metadata,
			status: "up-to-date",
		};
	}

	const downloadedDatabaseUri = await downloadContentPackDatabaseAsync(updateCheck.manifest);
	const nextMetadata = await replaceLocalContentPackDatabaseAsync(updateCheck.manifest, downloadedDatabaseUri);

	return {
		metadata: nextMetadata,
		status: "applied",
	};
}
