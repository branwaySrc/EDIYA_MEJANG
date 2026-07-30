import { create } from "zustand";

import { getPaidCustomerBalance, samplePaidCustomers } from "@/database/paid/paid-customer";
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

export const usePaidCustomersStore = create<PaidCustomersState>(set => ({
	customers: samplePaidCustomers,
	addCustomer: input =>
		set(state => ({
			customers: [
				{
					id: createCustomerId(input),
					name: input.name,
					nickname: input.nickname,
					affiliation: input.affiliation,
					firstPaidDate: input.firstPaidDate,
					initialBalance: input.initialBalance,
					ledger: [],
				},
				...state.customers,
			],
		})),
	addTransaction: (customerId, payload) =>
		set(state => ({
			customers: state.customers.map(customer => {
				if (customer.id !== customerId) {
					return customer;
				}

				const balance = getPaidCustomerBalance(customer);
				const nextBalance = payload.type === "usage" ? balance - payload.amount : balance + payload.amount;

				return {
					...customer,
					ledger: [
						...customer.ledger,
						{
							id: `${customer.id}-${Date.now()}`,
							amount: payload.amount,
							balanceAfter: nextBalance,
							date: payload.date,
							memo: payload.memo,
							type: payload.type,
						},
					],
				};
			}),
		})),
}));
