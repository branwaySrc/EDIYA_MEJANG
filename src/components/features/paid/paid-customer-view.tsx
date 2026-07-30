import { useMemo, useState } from "react";
import { Keyboard, StyleSheet, View } from "react-native";

import { AppSpacer } from "@/components/base/app-spacer";
import { AppText } from "@/components/base/app-text";
import { PaidCustomerCard } from "@/components/features/paid/paid-customer-card";
import { SearchBox } from "@/components/ui/search/search-box";
import { AppColors, AppSpacing } from "@/constants/theme";
import type { PaidCustomer } from "@/database/paid/paid-customer.type";
import { usePaidCustomersStore } from "@/store/paid-customers-store";

function searchPaidCustomers(customers: PaidCustomer[], keyword: string) {
	const normalizedKeyword = keyword.trim().toLowerCase();

	if (!normalizedKeyword) {
		return customers;
	}

	return customers.filter(customer =>
		[customer.name, customer.nickname, customer.affiliation].some(value => value.toLowerCase().includes(normalizedKeyword)),
	);
}

export function PaidCustomerView() {
	const [keyword, setKeyword] = useState("");
	const [expandedCustomerId, setExpandedCustomerId] = useState<string | null>(null);
	const customers = usePaidCustomersStore(state => state.customers);
	const addTransaction = usePaidCustomersStore(state => state.addTransaction);
	const filteredCustomers = useMemo(() => searchPaidCustomers(customers, keyword), [customers, keyword]);

	return (
		<View style={styles.container}>
			<View style={styles.searchArea}>
				<SearchBox
					value={keyword}
					onChangeText={value => {
						setKeyword(value);
						setExpandedCustomerId(null);
					}}
					onSubmit={() => Keyboard.dismiss()}
					placeholder="고객 이름, 별칭, 소속 검색"
				/>
			</View>

			<View style={styles.list}>
				{filteredCustomers.length === 0 ? (
					<View style={styles.empty}>
						<AppText.Base color={AppColors.placeholder}>검색된 선불 고객이 없습니다.</AppText.Base>
					</View>
				) : (
					filteredCustomers.map((customer, index) => (
						<View key={customer.id}>
							{index > 0 && <AppSpacer gap={AppSpacing.xl} style={styles.cardSpacer} />}
							<PaidCustomerCard
								customer={customer}
								expanded={expandedCustomerId === customer.id}
								onAddTransaction={addTransaction}
								onToggleExpanded={() => {
									setExpandedCustomerId(current => (current === customer.id ? null : customer.id));
								}}
							/>
						</View>
					))
				)}
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
	list: {
		width: "100%",
		paddingHorizontal: AppSpacing.md,
		paddingBottom: AppSpacing.xl,
	},
	cardSpacer: {
		opacity: 0,
	},
	empty: {
		minHeight: 180,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: AppColors.background,
	},
});
