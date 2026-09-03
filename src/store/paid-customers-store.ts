import { create } from "zustand";

import {
	createPaidCustomerSearchText,
	createPaidCustomerId,
	createPaidCustomerProfileChangeId,
	createPaidLedgerEntryId,
	defaultPaidStoreId,
	getPaidCustomerBalance,
	getPaidLedgerAmountDelta,
	samplePaidCustomers,
} from "@/database/paid/paid-customer";
import type {
	CreatePaidCustomerInput,
	CreatePaidLedgerEntryInput,
	PaidCustomer,
	PaidCustomerProfileField,
	UpdatePaidCustomerProfileInput,
} from "@/database/paid/paid-customer.type";
import {
	createSupabasePaidCustomerAsync,
	fetchSupabasePaidCustomersAsync,
	mapSupabasePaidLedgerEntry,
	recordSupabasePaidLedgerEntryAsync,
	updateSupabasePaidCustomerProfileAsync,
} from "@/lib/paid/supabase-paid-customers-repository";

export type PaidCustomersState = {
	addCustomer: (input: CreatePaidCustomerInput) => Promise<void>;
	addTransaction: (customerId: string, payload: CreatePaidLedgerEntryInput) => Promise<void>;
	customers: PaidCustomer[];
	hydrateFromRemote: () => Promise<void>;
	syncErrorMessage: string | null;
	syncing: boolean;
	updateCustomerProfile: (customerId: string, input: UpdatePaidCustomerProfileInput) => Promise<void>;
};

function createLocalPaidCustomer(input: CreatePaidCustomerInput): PaidCustomer {
	const now = new Date().toISOString();
	const id = input.id ?? createPaidCustomerId(input);
	const storeId = input.storeId ?? defaultPaidStoreId;
	const openingEntry = {
		id: input.openingLedgerEntryId ?? `${id}-opening`,
		storeId,
		customerId: id,
		type: "opening" as const,
		date: input.firstPaidDate,
		businessDate: input.firstPaidDate,
		amount: input.initialBalance,
		amountDelta: input.initialBalance,
		balanceBefore: 0,
		balanceAfter: input.initialBalance,
		memo: "Initial prepaid balance",
		occurredAt: now,
		receiptImageUri: input.openingReceiptImageUri ?? null,
		receiptStoragePath: input.openingReceiptStoragePath ?? null,
		receiptUploadedAt: input.openingReceiptUploadedAt ?? null,
		createdAt: now,
	};

	return {
		id,
		storeId,
		name: input.name,
		nickname: input.nickname,
		affiliation: input.affiliation,
		phone: input.phone ?? null,
		memo: input.memo ?? null,
		firstPaidDate: input.firstPaidDate,
		initialBalance: input.initialBalance,
		currentBalance: input.initialBalance,
		status: "active" as const,
		searchText: createPaidCustomerSearchText({
			name: input.name,
			nickname: input.nickname,
			affiliation: input.affiliation,
			phone: input.phone ?? null,
		}),
		createdAt: now,
		updatedAt: now,
		ledger: [openingEntry],
		profileChanges: [],
	};
}

function updateLocalCustomerProfile(customer: PaidCustomer, input: UpdatePaidCustomerProfileInput): PaidCustomer {
	const occurredAt = input.occurredAt ?? new Date().toISOString();
	const phone = input.phone?.replace(/\D/g, "") || null;
	const before = {
		name: customer.name,
		nickname: customer.nickname,
		affiliation: customer.affiliation,
		phone: customer.phone ?? null,
	};
	const after = {
		name: input.name.trim(),
		nickname: input.nickname.trim(),
		affiliation: input.affiliation.trim(),
		phone,
	};
	const changedFields: PaidCustomerProfileField[] = (["name", "nickname", "affiliation", "phone"] as const).filter(
		field => before[field] !== after[field],
	);

	if (changedFields.length === 0) {
		return customer;
	}

	return {
		...customer,
		...after,
		searchText: createPaidCustomerSearchText(after),
		updatedAt: occurredAt,
		profileChanges: [
			...customer.profileChanges,
			{
				id: input.changeId ?? createPaidCustomerProfileChangeId(customer.id),
				storeId: input.storeId ?? customer.storeId ?? defaultPaidStoreId,
				customerId: customer.id,
				before,
				after,
				changedFields,
				changedBy: input.changedBy ?? null,
				occurredAt,
				createdAt: occurredAt,
			},
		],
	};
}

function addLocalTransaction(customer: PaidCustomer, payload: CreatePaidLedgerEntryInput): PaidCustomer {
	const now = new Date().toISOString();
	const balance = getPaidCustomerBalance(customer);
	const amountDelta = getPaidLedgerAmountDelta(payload.type, payload.amount);
	const nextBalance = balance + amountDelta;
	const businessDate = payload.businessDate ?? payload.date;

	return {
		...customer,
		currentBalance: nextBalance,
		updatedAt: now,
		ledger: [
			...customer.ledger,
			{
				id: createPaidLedgerEntryId(customer.id),
				storeId: customer.storeId ?? defaultPaidStoreId,
				customerId: customer.id,
				amount: payload.amount,
				amountDelta,
				balanceBefore: balance,
				balanceAfter: nextBalance,
				date: payload.date,
				businessDate,
				memo: payload.memo,
				occurredAt: payload.occurredAt ?? now,
				receiptImageUri: payload.receiptImageUri ?? null,
				receiptStoragePath: payload.receiptStoragePath ?? null,
				receiptUploadedAt: payload.receiptUploadedAt ?? null,
				createdAt: now,
				createdBy: payload.createdBy ?? null,
				idempotencyKey: payload.idempotencyKey ?? null,
				reversalOfEntryId: payload.reversalOfEntryId ?? null,
				type: payload.type,
			},
		],
	};
}

function upsertCustomer(customers: PaidCustomer[], nextCustomer: PaidCustomer) {
	const exists = customers.some(customer => customer.id === nextCustomer.id);

	if (!exists) {
		return [nextCustomer, ...customers];
	}

	return customers.map(customer => (customer.id === nextCustomer.id ? nextCustomer : customer));
}

export const usePaidCustomersStore = create<PaidCustomersState>((set, get) => ({
	customers: samplePaidCustomers,
	syncErrorMessage: null,
	syncing: false,
	hydrateFromRemote: async () => {
		set({ syncing: true, syncErrorMessage: null });

		try {
			const remoteCustomers = await fetchSupabasePaidCustomersAsync();

			if (remoteCustomers) {
				set({ customers: remoteCustomers });
			}
		} catch (error) {
			console.error("Failed to hydrate paid customers from Supabase.", error);
			set({ syncErrorMessage: "선불 고객 정보를 Supabase에서 불러오지 못했습니다." });
		} finally {
			set({ syncing: false });
		}
	},
	addCustomer: async input => {
		const localCustomer = createLocalPaidCustomer(input);

		set(state => ({
			customers: upsertCustomer(state.customers, localCustomer),
			syncErrorMessage: null,
		}));

		try {
			const remoteCustomer = await createSupabasePaidCustomerAsync(input);

			if (remoteCustomer) {
				set(state => ({
					customers: upsertCustomer(state.customers, {
						...remoteCustomer,
						ledger: remoteCustomer.ledger.map(entry => ({
							...entry,
							receiptImageUri:
								entry.type === "opening" && entry.receiptStoragePath === input.openingReceiptStoragePath
									? input.openingReceiptImageUri ?? null
									: entry.receiptImageUri ?? null,
						})),
					}),
				}));
			}
		} catch (error) {
			console.error("Failed to sync paid customer to Supabase.", error);
			set({ syncErrorMessage: "선불 고객을 Supabase에 저장하지 못했습니다. 로컬 화면에는 임시 반영되었습니다." });
		}
	},
	addTransaction: async (customerId, payload) => {
		set(state => ({
			customers: state.customers.map(customer => (customer.id === customerId ? addLocalTransaction(customer, payload) : customer)),
			syncErrorMessage: null,
		}));

		try {
			const remoteEntry = await recordSupabasePaidLedgerEntryAsync(customerId, payload);

			if (!remoteEntry) {
				return;
			}

			const remoteCustomers = await fetchSupabasePaidCustomersAsync();

			if (remoteCustomers) {
				set({ customers: remoteCustomers });
				return;
			}

			const entry = mapSupabasePaidLedgerEntry(remoteEntry);
			set(state => ({
				customers: state.customers.map(customer => {
					if (customer.id !== customerId) {
						return customer;
					}

					return {
						...customer,
						currentBalance: entry.balanceAfter,
						updatedAt: entry.createdAt ?? new Date().toISOString(),
						ledger: [...customer.ledger.filter(item => item.id !== entry.id), entry],
					};
				}),
			}));
		} catch (error) {
			console.error("Failed to sync paid ledger entry to Supabase.", error);
			set({ syncErrorMessage: "선불 사용 내역을 Supabase에 저장하지 못했습니다. 로컬 화면에는 임시 반영되었습니다." });
		}
	},
	updateCustomerProfile: async (customerId, input) => {
		const occurredAt = input.occurredAt ?? new Date().toISOString();
		const changeId = input.changeId ?? createPaidCustomerProfileChangeId(customerId);
		const normalizedInput = {
			...input,
			changeId,
			occurredAt,
			phone: input.phone?.replace(/\D/g, "") || null,
		};

		set(state => ({
			customers: state.customers.map(customer =>
				customer.id === customerId ? updateLocalCustomerProfile(customer, normalizedInput) : customer,
			),
			syncErrorMessage: null,
		}));

		try {
			const updated = await updateSupabasePaidCustomerProfileAsync(customerId, normalizedInput);

			if (!updated) {
				return;
			}

			const remoteCustomers = await fetchSupabasePaidCustomersAsync();

			if (remoteCustomers) {
				set({ customers: remoteCustomers });
			}
		} catch (error) {
			console.error("Failed to sync paid customer profile to Supabase.", error);
			set({ syncErrorMessage: "고객 정보 변경을 Supabase에 저장하지 못했습니다. 로컬 화면에는 임시 반영되었습니다." });
		}
	},
}));
