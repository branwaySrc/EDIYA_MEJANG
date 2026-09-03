import {
	createPaidCustomerId,
	defaultPaidStoreId,
	mapPaidCustomerRecord,
	mapPaidLedgerEntryRecord,
} from "@/database/paid/paid-customer";
import type {
	CreatePaidCustomerInput,
	CreatePaidLedgerEntryInput,
	PaidCustomer,
	PaidCustomerProfileChangeRecord,
	PaidCustomerRecord,
	PaidLedgerEntryRecord,
	UpdatePaidCustomerProfileInput,
} from "@/database/paid/paid-customer.type";
import { getSupabaseClientOrNull } from "@/lib/supabase/supabase-client";

type CreatePaidCustomerRpcResult = PaidCustomerRecord;
type RecordPaidLedgerEntryRpcResult = PaidLedgerEntryRecord;

function isMissingProfileChangesTableError(error: { code?: string } | null): boolean {
	return error?.code === "42P01" || error?.code === "PGRST205";
}

export async function fetchSupabasePaidCustomersAsync(storeId = defaultPaidStoreId): Promise<PaidCustomer[] | null> {
	const supabase = getSupabaseClientOrNull();

	if (!supabase) {
		return null;
	}

	const customerResult = await supabase
		.from("paid_customers")
		.select("*")
		.eq("store_id", storeId)
		.order("updated_at", { ascending: false });

	if (customerResult.error) {
		throw customerResult.error;
	}

	const [ledgerResult, profileChangeResult] = await Promise.all([
		supabase.from("paid_ledger_entries").select("*").eq("store_id", storeId).order("occurred_at", { ascending: true }),
		supabase
			.from("paid_customer_profile_changes")
			.select("*")
			.eq("store_id", storeId)
			.order("occurred_at", { ascending: true }),
	]);

	if (ledgerResult.error) {
		throw ledgerResult.error;
	}

	if (profileChangeResult.error && !isMissingProfileChangesTableError(profileChangeResult.error)) {
		throw profileChangeResult.error;
	}

	const ledgerByCustomerId = new Map<string, PaidLedgerEntryRecord[]>();

	for (const entry of (ledgerResult.data ?? []) as PaidLedgerEntryRecord[]) {
		const entries = ledgerByCustomerId.get(entry.customer_id) ?? [];
		entries.push(entry);
		ledgerByCustomerId.set(entry.customer_id, entries);
	}

	const profileChangesByCustomerId = new Map<string, PaidCustomerProfileChangeRecord[]>();

	for (const change of (profileChangeResult.data ?? []) as PaidCustomerProfileChangeRecord[]) {
		const changes = profileChangesByCustomerId.get(change.customer_id) ?? [];
		changes.push(change);
		profileChangesByCustomerId.set(change.customer_id, changes);
	}

	return ((customerResult.data ?? []) as PaidCustomerRecord[]).map(customer =>
		mapPaidCustomerRecord(
			customer,
			ledgerByCustomerId.get(customer.id) ?? [],
			profileChangesByCustomerId.get(customer.id) ?? [],
		),
	);
}

export async function createSupabasePaidCustomerAsync(input: CreatePaidCustomerInput): Promise<PaidCustomer | null> {
	const supabase = getSupabaseClientOrNull();

	if (!supabase) {
		return null;
	}

	const customerId = input.id ?? createPaidCustomerId(input);
	const storeId = input.storeId ?? defaultPaidStoreId;
	const openingLedgerEntryId = input.openingLedgerEntryId ?? `${customerId}-opening`;
	const receiptUploadedAt = input.openingReceiptStoragePath ? input.openingReceiptUploadedAt ?? new Date().toISOString() : null;
	const { data, error } = await supabase.rpc("create_paid_customer_with_opening_entry", {
		p_affiliation: input.affiliation,
		p_customer_id: customerId,
		p_first_paid_date: input.firstPaidDate,
		p_initial_balance: input.initialBalance,
		p_memo: input.memo ?? null,
		p_name: input.name,
		p_nickname: input.nickname,
		p_opening_ledger_entry_id: openingLedgerEntryId,
		p_phone: input.phone ?? null,
		p_receipt_storage_path: input.openingReceiptStoragePath ?? null,
		p_receipt_uploaded_at: receiptUploadedAt,
		p_store_id: storeId,
	});

	if (error) {
		throw error;
	}

	const customerRecord = data as CreatePaidCustomerRpcResult | null;

	if (!customerRecord) {
		return null;
	}

	return mapPaidCustomerRecord(customerRecord, [
		{
			amount: input.initialBalance,
			amount_delta: input.initialBalance,
			balance_after: input.initialBalance,
			balance_before: 0,
			business_date: input.firstPaidDate,
			created_at: customerRecord.created_at,
			created_by: null,
			customer_id: customerId,
			id: openingLedgerEntryId,
			idempotency_key: null,
			memo: "Initial prepaid balance",
			occurred_at: customerRecord.created_at,
			receipt_storage_path: input.openingReceiptStoragePath ?? null,
			receipt_uploaded_at: receiptUploadedAt,
			reversal_of_entry_id: null,
			store_id: storeId,
			type: "opening",
		},
	]);
}

export async function recordSupabasePaidLedgerEntryAsync(customerId: string, payload: CreatePaidLedgerEntryInput): Promise<PaidLedgerEntryRecord | null> {
	const supabase = getSupabaseClientOrNull();

	if (!supabase) {
		return null;
	}

	const { data, error } = await supabase.rpc("record_paid_ledger_entry", {
		p_amount: payload.amount,
		p_business_date: payload.businessDate ?? payload.date,
		p_created_by: payload.createdBy ?? null,
		p_customer_id: customerId,
		p_idempotency_key: payload.idempotencyKey ?? null,
		p_memo: payload.memo ?? null,
		p_receipt_storage_path: payload.receiptStoragePath ?? null,
		p_reversal_of_entry_id: payload.reversalOfEntryId ?? null,
		p_type: payload.type,
	});

	if (error) {
		throw error;
	}

	return data as RecordPaidLedgerEntryRpcResult | null;
}

export async function updateSupabasePaidCustomerProfileAsync(
	customerId: string,
	input: UpdatePaidCustomerProfileInput,
): Promise<boolean> {
	const supabase = getSupabaseClientOrNull();

	if (!supabase) {
		return false;
	}

	const { error } = await supabase.rpc("update_paid_customer_profile", {
		p_affiliation: input.affiliation,
		p_change_id: input.changeId ?? null,
		p_changed_by: input.changedBy ?? null,
		p_customer_id: customerId,
		p_name: input.name,
		p_nickname: input.nickname,
		p_occurred_at: input.occurredAt ?? new Date().toISOString(),
		p_phone: input.phone,
		p_store_id: input.storeId ?? defaultPaidStoreId,
	});

	if (error) {
		throw error;
	}

	return true;
}

export function mapSupabasePaidLedgerEntry(record: PaidLedgerEntryRecord) {
	return mapPaidLedgerEntryRecord(record);
}
