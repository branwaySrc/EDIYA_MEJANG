import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type SupabaseEnvStatus = {
	hasPublishableKey: boolean;
	hasUrl: boolean;
};

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseEnvStatus(): SupabaseEnvStatus {
	return {
		hasPublishableKey: Boolean(getSupabasePublishableKey()),
		hasUrl: Boolean(getSupabaseUrl()),
	};
}

export function isSupabaseConfigured() {
	const status = getSupabaseEnvStatus();

	return status.hasPublishableKey && status.hasUrl;
}

export function getSupabaseClientOrNull(): SupabaseClient | null {
	const supabaseUrl = getSupabaseUrl();
	const supabasePublishableKey = getSupabasePublishableKey();

	if (!supabaseUrl || !supabasePublishableKey) {
		return null;
	}

	supabaseClient ??= createClient(supabaseUrl, supabasePublishableKey, {
		auth: {
			autoRefreshToken: false,
			detectSessionInUrl: false,
			persistSession: false,
		},
	});

	return supabaseClient;
}

function getSupabaseUrl() {
	return normalizeEnvValue(process.env.EXPO_PUBLIC_SUPABASE_URL);
}

function getSupabasePublishableKey() {
	return (
		normalizeEnvValue(process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY) ??
		normalizeEnvValue(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) ??
		normalizeEnvValue(process.env.EXPO_PUBLIC_SUPABASE_KEY)
	);
}

function normalizeEnvValue(value: string | undefined) {
	const trimmedValue = value?.trim();

	return trimmedValue ? trimmedValue : undefined;
}
