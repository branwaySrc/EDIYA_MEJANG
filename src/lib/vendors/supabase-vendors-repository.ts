import { mapVendorRecord } from "@/database/vendors/vendor";
import type { Vendor, VendorRecord } from "@/database/vendors/vendor.type";
import { getSupabaseClientOrNull } from "@/lib/supabase/supabase-client";

export const defaultVendorStoreId = "wolpi";
const vendorTableName = "vendors";

export async function fetchSupabaseVendorsAsync(storeId = defaultVendorStoreId): Promise<Vendor[] | null> {
	const supabase = getSupabaseClientOrNull();

	if (!supabase) {
		return null;
	}

	const { data, error } = await supabase
		.from(vendorTableName)
		.select("*")
		.eq("store_id", storeId)
		.eq("status", "active")
		.order("updated_at", { ascending: false });

	if (error) {
		throw error;
	}

	return ((data ?? []) as VendorRecord[]).map(mapVendorRecord);
}

export async function upsertSupabaseVendorAsync(vendor: Vendor, storeId = defaultVendorStoreId): Promise<Vendor | null> {
	const supabase = getSupabaseClientOrNull();

	if (!supabase) {
		return null;
	}

	const now = new Date().toISOString();
	const row = {
		address: vendor.address ?? null,
		contact_name: vendor.contactName,
		id: vendor.id,
		items: vendor.items,
		memo: vendor.memo ?? null,
		name: vendor.name,
		phone: vendor.phone,
		status: "active",
		store_id: vendor.storeId ?? storeId,
		updated_at: vendor.updatedAt || now,
	};
	const { data, error } = await supabase.from(vendorTableName).upsert(row, { onConflict: "id" }).select("*").single();

	if (error) {
		throw error;
	}

	return data ? mapVendorRecord(data as VendorRecord) : null;
}
