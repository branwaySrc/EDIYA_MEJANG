export type PaidLedgerTransactionType = "usage" | "correction";

export type PaidLedgerEntry = {
	amount: number;
	balanceAfter: number;
	customerId?: string;
	date: string;
	id: string;
	memo?: string;
	type: PaidLedgerTransactionType;
};

export type PaidCustomer = {
	affiliation: string;
	createdAt?: string;
	firstPaidDate: string;
	id: string;
	initialBalance: number;
	ledger: PaidLedgerEntry[];
	name: string;
	nickname: string;
	updatedAt?: string;
};

export type CreatePaidCustomerInput = {
	affiliation: string;
	firstPaidDate: string;
	initialBalance: number;
	name: string;
	nickname: string;
};

export type CreatePaidLedgerEntryInput = {
	amount: number;
	date: string;
	memo?: string;
	type: PaidLedgerTransactionType;
};

export type PaidCustomerRecord = Omit<PaidCustomer, "ledger">;

export const paidCustomerTable = {
	name: "paid_customers",
	columns: {
		id: "id",
		name: "name",
		nickname: "nickname",
		affiliation: "affiliation",
		firstPaidDate: "first_paid_date",
		initialBalance: "initial_balance",
		createdAt: "created_at",
		updatedAt: "updated_at",
	},
} as const;

export const paidLedgerTable = {
	name: "paid_ledger_entries",
	columns: {
		id: "id",
		customerId: "customer_id",
		type: "type",
		date: "date",
		amount: "amount",
		balanceAfter: "balance_after",
		memo: "memo",
		createdAt: "created_at",
	},
} as const;
