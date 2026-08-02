import type { ContentPackManifest, LocalContentPackMetadata } from "@/database/content-pack/content-pack";
import { getLocalContentPackMetadataAsync } from "@/lib/content-pack/local-content-pack";
import { fetchLatestContentPackManifestAsync } from "@/lib/content-pack/remote-content-pack";
import { getSupabaseEnvStatus } from "@/lib/supabase/supabase-client";

export type ContentPackHealth =
	| {
			local: LocalContentPackMetadata;
			remote: null;
			reason: "no-published-pack" | "supabase-not-configured";
			status: "offline" | "unpublished";
	  }
	| {
			local: LocalContentPackMetadata;
			remote: ContentPackManifest;
			status: "needs-update" | "ready";
	  };

export async function getContentPackHealthAsync(): Promise<ContentPackHealth> {
	const local = await getLocalContentPackMetadataAsync();
	const envStatus = getSupabaseEnvStatus();

	if (!envStatus.hasUrl || !envStatus.hasPublishableKey) {
		return {
			local,
			reason: "supabase-not-configured",
			remote: null,
			status: "offline",
		};
	}

	const remote = await fetchLatestContentPackManifestAsync();

	if (!remote) {
		return {
			local,
			reason: "no-published-pack",
			remote: null,
			status: "unpublished",
		};
	}

	return {
		local,
		remote,
		status: remote.packVersion === local.packVersion ? "ready" : "needs-update",
	};
}
