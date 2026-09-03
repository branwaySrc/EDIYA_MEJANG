export type PaidCustomerStatus = "active" | "archived";

export type PaidLedgerTransactionType = "charge" | "correction" | "opening" | "refund" | "usage" | "void";

export type PaidCustomerProfileField = "affiliation" | "name" | "nickname" | "phone";

export type PaidCustomerProfileSnapshot = {
	affiliation: string;
	name: string;
	nickname: string;
	phone: string | null;
};

export type PaidCustomerProfileChange = {
	after: PaidCustomerProfileSnapshot;
	before: PaidCustomerProfileSnapshot;
	changedBy?: string | null;
	changedFields: PaidCustomerProfileField[];
	createdAt?: string;
	customerId: string;
	id: string;
	occurredAt: string;
	storeId?: string;
};

export type PaidLedgerEntry = {
	amount: number;
	amountDelta: number;
	balanceAfter: number;
	balanceBefore: number;
	businessDate: string;
	createdAt?: string;
	createdBy?: string | null;
	customerId?: string;
	date: string;
	id: string;
	idempotencyKey?: string | null;
	memo?: string;
	occurredAt?: string;
	receiptImageUri?: string | null;
	receiptStoragePath?: string | null;
	receiptUploadedAt?: string | null;
	reversalOfEntryId?: string | null;
	storeId?: string;
	type: PaidLedgerTransactionType;
};

export type PaidCustomer = {
	affiliation: string;
	archivedAt?: string | null;
	createdAt?: string;
	currentBalance: number;
	firstPaidDate: string;
	id: string;
	initialBalance: number;
	ledger: PaidLedgerEntry[];
	memo?: string | null;
	name: string;
	nickname: string;
	phone?: string | null;
	profileChanges: PaidCustomerProfileChange[];
	searchText?: string;
	status: PaidCustomerStatus;
	storeId?: string;
	updatedAt?: string;
};

export type UpdatePaidCustomerProfileInput = PaidCustomerProfileSnapshot & {
	changeId?: string;
	changedBy?: string | null;
	occurredAt?: string;
	storeId?: string;
};

export type CreatePaidCustomerInput = {
	affiliation: string;
	firstPaidDate: string;
	id?: string;
	initialBalance: number;
	memo?: string | null;
	name: string;
	nickname: string;
	openingReceiptImageUri?: string | null;
	openingReceiptStoragePath?: string | null;
	openingReceiptUploadedAt?: string | null;
	openingLedgerEntryId?: string;
	phone?: string | null;
	storeId?: string;
};

export type CreatePaidLedgerEntryInput = {
	amount: number;
	businessDate?: string;
	createdBy?: string | null;
	date: string;
	idempotencyKey?: string | null;
	memo?: string;
	receiptImageUri?: string | null;
	receiptStoragePath?: string | null;
	receiptUploadedAt?: string | null;
	occurredAt?: string;
	reversalOfEntryId?: string | null;
	type: PaidLedgerTransactionType;
};

export type PaidCustomerRecord = {
	affiliation: string;
	archived_at: string | null;
	created_at: string;
	current_balance: number;
	first_paid_date: string;
	id: string;
	initial_balance: number;
	memo: string | null;
	name: string;
	nickname: string;
	phone: string | null;
	search_text: string;
	status: PaidCustomerStatus;
	store_id: string;
	updated_at: string;
};

export type PaidLedgerEntryRecord = {
	amount: number;
	amount_delta: number;
	balance_after: number;
	balance_before: number;
	business_date: string;
	created_at: string;
	created_by: string | null;
	customer_id: string;
	id: string;
	idempotency_key: string | null;
	memo: string | null;
	occurred_at: string;
	receipt_storage_path: string | null;
	receipt_uploaded_at: string | null;
	reversal_of_entry_id: string | null;
	store_id: string;
	type: PaidLedgerTransactionType;
};

export type PaidCustomerProfileChangeRecord = {
	after_affiliation: string;
	after_name: string;
	after_nickname: string;
	after_phone: string | null;
	before_affiliation: string;
	before_name: string;
	before_nickname: string;
	before_phone: string | null;
	changed_by: string | null;
	changed_fields: PaidCustomerProfileField[];
	created_at: string;
	customer_id: string;
	id: string;
	occurred_at: string;
	store_id: string;
};

export const paidCustomerTable = {
	name: "paid_customers",
	columns: {
		affiliation: "affiliation",
		archivedAt: "archived_at",
		createdAt: "created_at",
		currentBalance: "current_balance",
		firstPaidDate: "first_paid_date",
		id: "id",
		initialBalance: "initial_balance",
		memo: "memo",
		name: "name",
		nickname: "nickname",
		phone: "phone",
		searchText: "search_text",
		status: "status",
		storeId: "store_id",
		updatedAt: "updated_at",
	},
} as const;

export const paidLedgerTable = {
	name: "paid_ledger_entries",
	columns: {
		amount: "amount",
		amountDelta: "amount_delta",
		balanceAfter: "balance_after",
		balanceBefore: "balance_before",
		businessDate: "business_date",
		createdAt: "created_at",
		createdBy: "created_by",
		customerId: "customer_id",
		id: "id",
		idempotencyKey: "idempotency_key",
		memo: "memo",
		occurredAt: "occurred_at",
		receiptStoragePath: "receipt_storage_path",
		receiptUploadedAt: "receipt_uploaded_at",
		reversalOfEntryId: "reversal_of_entry_id",
		storeId: "store_id",
		type: "type",
	},
} as const;

export const paidCustomerProfileChangeTable = {
	name: "paid_customer_profile_changes",
} as const;
