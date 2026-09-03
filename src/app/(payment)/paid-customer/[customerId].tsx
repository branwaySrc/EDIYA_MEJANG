import { useLocalSearchParams, useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";

import { AppPressable } from "@/components/base/app-pressable";
import { AppText } from "@/components/base/app-text";
import { PaidCustomerDetailView } from "@/components/features/paid/paid-customer-detail-view";
import { AppLayout } from "@/components/global/app-layout";
import { AppColors, AppSpacing } from "@/constants/theme";
import { usePaidCustomersStore } from "@/store/paid-customers-store";

export default function PaidCustomerDetailScreen() {
	const router = useRouter();
	const params = useLocalSearchParams<{ customerId?: string | string[] }>();
	const customerId = Array.isArray(params.customerId) ? params.customerId[0] : params.customerId;
	const customer = usePaidCustomersStore(state => state.customers.find(item => item.id === customerId));
	const addTransaction = usePaidCustomersStore(state => state.addTransaction);
	const updateCustomerProfile = usePaidCustomersStore(state => state.updateCustomerProfile);

	const goBack = () => {
		if (router.canGoBack()) {
			router.back();
			return;
		}

		router.replace("/paid-customer");
	};

	return (
		<AppLayout drawerEnabled={false} leadingMode="back" onPressBack={goBack} title={customer?.name ?? "선불 상세"} type="scrollview">
			{customer ? (
				<PaidCustomerDetailView
					customer={customer}
					onAddTransaction={addTransaction}
					onUpdateProfile={updateCustomerProfile}
				/>
			) : (
				<View style={styles.empty}>
					<AppText.Base color={AppColors.placeholder}>고객 정보를 찾지 못했습니다.</AppText.Base>
					<AppPressable onPress={goBack} pressedColor="rgba(0, 75, 147, 0.08)" radius="base" style={styles.backButton}>
						<AppText.Base bold color={AppColors.primary}>
							목록으로 돌아가기
						</AppText.Base>
					</AppPressable>
				</View>
			)}
		</AppLayout>
	);
}

const styles = StyleSheet.create({
	empty: {
		minHeight: 240,
		alignItems: "center",
		justifyContent: "center",
		gap: AppSpacing.md,
		padding: AppSpacing.md,
	},
	backButton: {
		minHeight: 44,
		alignItems: "center",
		justifyContent: "center",
		borderWidth: 1,
		borderColor: "rgba(0, 75, 147, 0.32)",
		paddingHorizontal: AppSpacing.md,
	},
});
