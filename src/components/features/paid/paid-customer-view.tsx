import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Keyboard, StyleSheet, View } from "react-native";

import { AppSpacer } from "@/components/base/app-spacer";
import { AppText } from "@/components/base/app-text";
import { PaidCustomerCard } from "@/components/features/paid/paid-customer-card";
import { formatWon } from "@/components/features/paid/paid-format";
import { SearchBox } from "@/components/ui/search/search-box";
import { AppColors, AppSpacing } from "@/constants/theme";
import { getPaidCustomerBalance } from "@/database/paid/paid-customer";
import type { PaidCustomer } from "@/database/paid/paid-customer.type";
import { usePaidCustomersStore } from "@/store/paid-customers-store";

function searchPaidCustomers(customers: PaidCustomer[], keyword: string) {
	const normalizedKeyword = keyword.trim().toLowerCase();

	if (!normalizedKeyword) {
		return customers;
	}

	return customers.filter(customer =>
		[customer.searchText, customer.name, customer.nickname, customer.affiliation, customer.phone].some(value =>
			value?.toLowerCase().includes(normalizedKeyword),
		),
	);
}

export function PaidCustomerView() {
	const [keyword, setKeyword] = useState("");
	const router = useRouter();
	const customers = usePaidCustomersStore(state => state.customers);
	const hydrateFromRemote = usePaidCustomersStore(state => state.hydrateFromRemote);
	const syncErrorMessage = usePaidCustomersStore(state => state.syncErrorMessage);
	const syncing = usePaidCustomersStore(state => state.syncing);
	const filteredCustomers = useMemo(() => searchPaidCustomers(customers, keyword), [customers, keyword]);
	const overview = useMemo(
		() =>
			customers.reduce(
				(summary, customer) => {
					const balance = getPaidCustomerBalance(customer);

					if (balance > 0) {
						return {
							activeCount: summary.activeCount + 1,
							totalBalance: summary.totalBalance + balance,
						};
					}

					return summary;
				},
				{ activeCount: 0, totalBalance: 0 },
			),
		[customers],
	);

	const openCustomerDetails = (customer: PaidCustomer) => {
		Keyboard.dismiss();
		router.push({
			pathname: "/paid-customer/[customerId]",
			params: { customerId: customer.id },
		});
	};

	useEffect(() => {
		void hydrateFromRemote();
	}, [hydrateFromRemote]);

	return (
		<View style={styles.container}>
			<View style={styles.searchArea}>
				<SearchBox value={keyword} onChangeText={setKeyword} onSubmit={() => Keyboard.dismiss()} placeholder="고객 이름, 별칭, 소속 검색" />
			</View>

			<View style={styles.overviewPanel}>
				<View style={styles.overviewAccent} />
				<View style={styles.overviewContent}>
					<View style={styles.overviewMetricRow}>
						<View style={styles.overviewTotalMetric}>
							<AppText.Sm bold color={AppColors.sub}>
								전체 선결제 잔액
							</AppText.Sm>
							<AppText.Xl bold color={AppColors.primary} numberOfLines={1}>
								{formatWon(overview.totalBalance)}
							</AppText.Xl>
						</View>
						<View style={styles.overviewCountMetric}>
							<AppText.Sm bold color={AppColors.sub}>
								남은 선불
							</AppText.Sm>
							<AppText.Lg bold color={AppColors.text}>
								{overview.activeCount}개
							</AppText.Lg>
						</View>
					</View>
				</View>
			</View>

			<View style={styles.list}>
				{syncing ? (
					<View style={styles.loading}>
						<AppText.Base bold color={AppColors.primary}>
							데이터를 불러오고 있습니다
						</AppText.Base>
					</View>
				) : null}
				{syncErrorMessage ? (
					<AppText.Xs color="#B91C1C" style={styles.syncError}>
						{syncErrorMessage}
					</AppText.Xs>
				) : null}
				{filteredCustomers.length === 0 && !syncing ? (
					<View style={styles.empty}>
						<AppText.Base color={AppColors.placeholder}>검색된 선불 고객이 없습니다.</AppText.Base>
					</View>
				) : null}
				{filteredCustomers.length > 0
					? filteredCustomers.map((customer, index) => (
							<View key={customer.id}>
								{index > 0 && <AppSpacer gap={AppSpacing.xl} style={styles.cardSpacer} />}
								<PaidCustomerCard customer={customer} onPressDetails={() => openCustomerDetails(customer)} />
							</View>
						))
					: null}
			</View>
		</View>
	);
}

export default PaidCustomerView;

const styles = StyleSheet.create({
	container: {
		width: "100%",
		gap: AppSpacing.md,
	},
	searchArea: {
		width: "100%",
		paddingHorizontal: AppSpacing.md,
		paddingTop: AppSpacing.md,
	},
	overviewPanel: {
		width: "auto",
		flexDirection: "row",
		borderRadius: 8,
		backgroundColor: "#F4F9FF",
		marginHorizontal: AppSpacing.md,
		overflow: "hidden",
	},
	overviewAccent: {
		width: 8,
		backgroundColor: AppColors.primary,
	},
	overviewContent: {
		flex: 1,
		gap: AppSpacing.sm,
		padding: AppSpacing.md,
	},
	overviewHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: AppSpacing.sm,
	},
	overviewMetricRow: {
		flexDirection: "row",
		alignItems: "stretch",
		justifyContent: "space-between",
		gap: AppSpacing.sm,
	},
	overviewTotalMetric: {
		flex: 1,
		minWidth: 0,
		gap: 2,
	},
	overviewCountMetric: {
		minWidth: 92,
		alignItems: "flex-end",
		justifyContent: "center",
		borderRadius: 6,
		paddingHorizontal: AppSpacing.sm,
		paddingVertical: AppSpacing.xs,
	},
	list: {
		width: "100%",
		paddingHorizontal: AppSpacing.md,
		paddingBottom: AppSpacing.xl,
	},
	cardSpacer: {
		opacity: 0,
	},
	loading: {
		minHeight: 64,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "#F4F9FF",
		marginBottom: AppSpacing.sm,
	},
	syncError: {
		marginBottom: AppSpacing.sm,
	},
	empty: {
		minHeight: 180,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: AppColors.background,
	},
});
