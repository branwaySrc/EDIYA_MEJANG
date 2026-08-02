import { StyleSheet, View } from "react-native";

import { AppIcon } from "@/components/base/app-icon";
import { AppText } from "@/components/base/app-text";
import { AppLayout } from "@/components/global/app-layout";
import { appRoutes } from "@/constants/route";
import { AppColors, AppSpacing } from "@/constants/theme";
import { hiringWorkplaces } from "@/database/sajang/workplace";
import { useContentManagementStore } from "@/store/content-management-store";

export default function StoreVendorsScreen() {
	const vendors = useContentManagementStore(state => state.vendors);

	return (
		<AppLayout activeDrawerId="store-vendors" title={appRoutes["store-vendors"].label} type="scrollview" contentContainerStyle={styles.container}>
			<View style={styles.section}>
				<AppText.Lg bold color={AppColors.primary}>
					매장
				</AppText.Lg>
				{hiringWorkplaces.map(workplace => (
					<View key={workplace.id} style={styles.infoBox}>
						<AppText.Base bold>{workplace.name}</AppText.Base>
						<AppText.Sm color={AppColors.sub}>{workplace.address}</AppText.Sm>
						<AppText.Sm color={AppColors.sub}>{workplace.phone}</AppText.Sm>
					</View>
				))}
			</View>

			<View style={styles.section}>
				<AppText.Lg bold color={AppColors.primary}>
					거래처
				</AppText.Lg>
				{vendors.length === 0 ? (
					<View style={styles.emptyBox}>
						<AppIcon.Lg color={AppColors.primary} name="business-outline" pressable={false} />
						<AppText.Sm color={AppColors.sub}>등록된 거래처가 없습니다.</AppText.Sm>
					</View>
				) : (
					vendors.map(vendor => (
						<View key={vendor.id} style={styles.infoBox}>
							<AppText.Base bold>{vendor.name}</AppText.Base>
							{vendor.contactName || vendor.phone ? (
								<AppText.Sm color={AppColors.sub}>
									{[vendor.contactName, vendor.phone].filter(Boolean).join(" · ")}
								</AppText.Sm>
							) : null}
							{vendor.address ? <AppText.Sm color={AppColors.sub}>{vendor.address}</AppText.Sm> : null}
							{vendor.items.length > 0 ? (
								<AppText.Sm color={AppColors.sub}>{vendor.items.join(", ")}</AppText.Sm>
							) : null}
							{vendor.memo ? <AppText.Sm>{vendor.memo}</AppText.Sm> : null}
						</View>
					))
				)}
			</View>
		</AppLayout>
	);
}

const styles = StyleSheet.create({
	container: {
		gap: AppSpacing.lg,
		padding: AppSpacing.md,
		paddingBottom: AppSpacing.xl,
	},
	section: {
		gap: AppSpacing.sm,
	},
	infoBox: {
		gap: AppSpacing.xs,
		borderWidth: 1,
		borderColor: "rgba(71, 85, 105, 0.24)",
		borderRadius: 8,
		backgroundColor: AppColors.background,
		padding: AppSpacing.md,
	},
	emptyBox: {
		minHeight: 96,
		alignItems: "center",
		justifyContent: "center",
		gap: AppSpacing.md,
		borderWidth: 1,
		borderColor: "rgba(0, 75, 147, 0.24)",
		borderRadius: 8,
		backgroundColor: "#F8FBFF",
		padding: AppSpacing.md,
	},
});
