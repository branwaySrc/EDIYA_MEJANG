import type { Vendor, VendorRecord } from "@/database/vendors/vendor.type";

export type { Vendor } from "@/database/vendors/vendor.type";

export const sampleVendors: Vendor[] = [];

export function mapVendorRecord(record: VendorRecord): Vendor {
	return {
		address: record.address ?? undefined,
		contactName: record.contact_name,
		id: record.id,
		items: record.items ?? [],
		memo: record.memo ?? undefined,
		name: record.name,
		phone: record.phone,
		storeId: record.store_id,
		updatedAt: record.updated_at,
	};
}
