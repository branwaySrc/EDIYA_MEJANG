import { useRouter } from "expo-router";
import { StyleSheet } from "react-native";

import { AppIcon } from "@/components/base/app-icon";
import { AppPressable } from "@/components/base/app-pressable";
import { AppText } from "@/components/base/app-text";
import { PaidCustomerView } from "@/components/features/paid/paid-customer-view";
import { AppLayout } from "@/components/global/app-layout";
import { appRoutes } from "@/constants/route";
import { AppColors, AppSpacing } from "@/constants/theme";

export default function PaidCustomerScreen() {
	const router = useRouter();

	return (
		<AppLayout
			activeDrawerId="paid-customer"
			title={appRoutes["paid-customer"].label}
			type="scrollview"
			aside={
				<AppPressable
					accessibilityLabel="선불 고객 신규등록"
					onPress={() => router.push("/paid-customer/new")}
					pressedColor="rgba(255, 255, 255, 0.14)"
					radius="full"
					style={styles.createButton}
				>
					<AppIcon.Sm color={AppColors.textOnPrimary} name="add-circle-outline" pressable={false} />
					<AppText.Sm bold color={AppColors.textOnPrimary}>
						신규등록
					</AppText.Sm>
				</AppPressable>
			}
		>
			<PaidCustomerView />
		</AppLayout>
	);
}

const styles = StyleSheet.create({
	createButton: {
		minHeight: 38,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: AppSpacing.xs,
		borderWidth: 1,
		borderColor: "rgba(255, 255, 255, 0.42)",
		paddingHorizontal: AppSpacing.sm,
		backgroundColor: "rgba(255, 255, 255, 0.08)",
	},
});
