import type { PaidCustomer } from "@/database/paid/paid-customer.type";

export const samplePaidCustomers: PaidCustomer[] = [
	{
		id: "wolpi-office",
		name: "김민준",
		nickname: "월피 사무실",
		affiliation: "월피동",
		firstPaidDate: "2026-06-12",
		initialBalance: 150000,
		ledger: [
			{ id: "wolpi-office-1", date: "2026-07-08", amount: 12000, balanceAfter: 138000, type: "usage" },
			{ id: "wolpi-office-2", date: "2026-07-18", amount: 18000, balanceAfter: 120000, type: "usage" },
		],
	},
	{
		id: "morning-team",
		name: "박서연",
		nickname: "아침팀",
		affiliation: "선부중앙",
		firstPaidDate: "2026-05-28",
		initialBalance: 100000,
		ledger: [{ id: "morning-team-1", date: "2026-07-15", amount: 9000, balanceAfter: 91000, type: "usage" }],
	},
	{
		id: "fitness-member",
		name: "이도윤",
		nickname: "헬스장",
		affiliation: "프라자 3층",
		firstPaidDate: "2026-07-01",
		initialBalance: 200000,
		ledger: [],
	},
];

export function getPaidCustomerBalance(customer: PaidCustomer): number {
	return customer.ledger.at(-1)?.balanceAfter ?? customer.initialBalance;
}

export function getRecentUsageDate(customer: PaidCustomer): string {
	return customer.ledger.at(-1)?.date ?? "-";
}
