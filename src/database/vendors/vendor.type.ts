export type Vendor = {
	address?: string;
	contactName: string;
	id: string;
	items: string[];
	memo?: string;
	name: string;
	phone: string;
	storeId?: string;
	updatedAt: string;
};

export type VendorRecord = {
	address: string | null;
	contact_name: string;
	created_at: string;
	id: string;
	items: string[];
	memo: string | null;
	name: string;
	phone: string;
	status: "active" | "archived";
	store_id: string;
	updated_at: string;
};
