import { create } from "zustand";

import {
	createPaidCustomerSearchText,
	defaultPaidStoreId,
	getPaidCustomerBalance,
	getPaidLedgerAmountDelta,
	samplePaidCustomers,
} from "@/database/paid/paid-customer";
import type { CreatePaidCustomerInput, CreatePaidLedgerEntryInput, PaidCustomer } from "@/database/paid/paid-customer.type";

export type PaidCustomersState = {
	addCustomer: (input: CreatePaidCustomerInput) => void;
	addTransaction: (customerId: string, payload: CreatePaidLedgerEntryInput) => void;
	customers: PaidCustomer[];
};

function createCustomerId(input: CreatePaidCustomerInput) {
	const baseId = [input.name, input.nickname, input.affiliation].join("-").replace(/\s/g, "-").toLowerCase();

	return `${baseId}-${Date.now()}`;
}

function createLedgerEntryId(customerId: string) {
	return `${customerId}-${Date.now()}`;
}

export const usePaidCustomersStore = create<PaidCustomersState>(set => ({
	customers: samplePaidCustomers,
	addCustomer: input =>
		set(state => {
			const now = new Date().toISOString();
			const id = createCustomerId(input);
			const storeId = input.storeId ?? defaultPaidStoreId;
			const openingEntry = {
				id: `${id}-opening`,
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
				createdAt: now,
			};
			const customer = {
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
			};

			return {
				customers: [customer, ...state.customers],
			};
		}),
	addTransaction: (customerId, payload) =>
		set(state => {
			const now = new Date().toISOString();

			return {
				customers: state.customers.map(customer => {
					if (customer.id !== customerId) {
						return customer;
					}

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
								id: createLedgerEntryId(customer.id),
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
								createdAt: now,
								createdBy: payload.createdBy ?? null,
								idempotencyKey: payload.idempotencyKey ?? null,
								reversalOfEntryId: payload.reversalOfEntryId ?? null,
								type: payload.type,
							},
						],
					};
				}),
			};
		}),
}));
