import type {
	PaidCustomer,
	PaidCustomerProfileChange,
	PaidCustomerProfileChangeRecord,
	PaidCustomerRecord,
	PaidLedgerEntry,
	PaidLedgerEntryRecord,
	PaidLedgerTransactionType,
} from "@/database/paid/paid-customer.type";

export const defaultPaidStoreId = "wolpi";

export const samplePaidCustomers: PaidCustomer[] = [];

export function createPaidCustomerId(input: Pick<PaidCustomer, "affiliation" | "name" | "nickname">): string {
	const baseId = [input.name, input.nickname, input.affiliation].join("-").replace(/\s/g, "-").toLowerCase();

	return `${baseId}-${Date.now()}`;
}

export function createPaidLedgerEntryId(customerId: string): string {
	return `${customerId}-${Date.now()}`;
}

export function createPaidCustomerProfileChangeId(customerId: string): string {
	return `${customerId}-profile-${Date.now()}`;
}

export function getPaidLedgerAmountDelta(type: PaidLedgerTransactionType, amount: number): number {
	if (type === "usage" || type === "refund") {
		return -amount;
	}

	if (type === "void") {
		return 0;
	}

	return amount;
}

export function createPaidCustomerSearchText(customer: Pick<PaidCustomer, "affiliation" | "name" | "nickname" | "phone">): string {
	return [customer.name, customer.nickname, customer.affiliation, customer.phone].filter(Boolean).join(" ").toLowerCase();
}

export function getPaidCustomerBalance(customer: PaidCustomer): number {
	return customer.currentBalance ?? customer.ledger.at(-1)?.balanceAfter ?? customer.initialBalance;
}

export function getRecentUsageDate(customer: PaidCustomer): string {
	return customer.ledger.findLast(entry => entry.type === "usage")?.businessDate ?? customer.ledger.at(-1)?.businessDate ?? "-";
}

export function isPaidLedgerDebit(entry: Pick<PaidLedgerEntry, "amountDelta" | "type">): boolean {
	return entry.amountDelta < 0 || entry.type === "usage" || entry.type === "refund";
}

export function mapPaidLedgerEntryRecord(record: PaidLedgerEntryRecord): PaidLedgerEntry {
	return {
		id: record.id,
		storeId: record.store_id,
		customerId: record.customer_id,
		type: record.type,
		date: record.business_date,
		businessDate: record.business_date,
		amount: record.amount,
		amountDelta: record.amount_delta,
		balanceBefore: record.balance_before,
		balanceAfter: record.balance_after,
		memo: record.memo ?? undefined,
		occurredAt: record.occurred_at,
		receiptStoragePath: record.receipt_storage_path,
		receiptUploadedAt: record.receipt_uploaded_at,
		createdAt: record.created_at,
		createdBy: record.created_by,
		idempotencyKey: record.idempotency_key,
		reversalOfEntryId: record.reversal_of_entry_id,
	};
}

export function mapPaidCustomerProfileChangeRecord(record: PaidCustomerProfileChangeRecord): PaidCustomerProfileChange {
	return {
		id: record.id,
		storeId: record.store_id,
		customerId: record.customer_id,
		before: {
			name: record.before_name,
			nickname: record.before_nickname,
			affiliation: record.before_affiliation,
			phone: record.before_phone,
		},
		after: {
			name: record.after_name,
			nickname: record.after_nickname,
			affiliation: record.after_affiliation,
			phone: record.after_phone,
		},
		changedFields: record.changed_fields,
		changedBy: record.changed_by,
		occurredAt: record.occurred_at,
		createdAt: record.created_at,
	};
}

export function mapPaidCustomerRecord(
	record: PaidCustomerRecord,
	ledger: PaidLedgerEntryRecord[] = [],
	profileChanges: PaidCustomerProfileChangeRecord[] = [],
): PaidCustomer {
	return {
		id: record.id,
		storeId: record.store_id,
		name: record.name,
		nickname: record.nickname,
		affiliation: record.affiliation,
		phone: record.phone,
		memo: record.memo,
		firstPaidDate: record.first_paid_date,
		initialBalance: record.initial_balance,
		currentBalance: record.current_balance,
		status: record.status,
		searchText: record.search_text,
		createdAt: record.created_at,
		updatedAt: record.updated_at,
		archivedAt: record.archived_at,
		ledger: ledger.map(mapPaidLedgerEntryRecord),
		profileChanges: profileChanges.map(mapPaidCustomerProfileChangeRecord),
	};
}
