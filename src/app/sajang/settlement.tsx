import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";

import { AppIcon } from "@/components/base/app-icon";
import { AppPressable } from "@/components/base/app-pressable";
import { AppText } from "@/components/base/app-text";
import { AppLayout } from "@/components/global/app-layout";
import { AppColors, AppSpacing } from "@/constants/theme";

const settlementFields = ["정산 기간", "매출", "비용", "선불 결제", "메모"];

export default function SajangSettlementScreen() {
	const router = useRouter();

	return (
		<AppLayout
			activeDrawerId="owner-space"
			leadingMode="back"
			onPressBack={() => router.back()}
			title="정산관리"
			type="scrollview"
			contentContainerStyle={styles.container}
		>
			<View style={styles.hero}>
				<AppIcon.Xl color={AppColors.primary} name="calculator-outline" pressable={false} />
				<View style={styles.heroText}>
					<AppText.Lg bold>관리자 전용 수정 공간</AppText.Lg>
					<AppText.Sm color={AppColors.sub}>정산 기록 등록과 관리 흐름이 이 화면에 연결될 예정입니다.</AppText.Sm>
				</View>
			</View>

			<View style={styles.fieldList}>
				{settlementFields.map(field => (
					<View key={field} style={styles.fieldRow}>
						<AppText.Base bold>{field}</AppText.Base>
						<AppText.Sm color={AppColors.placeholder}>대기</AppText.Sm>
					</View>
				))}
			</View>

			<AppPressable disabled pressedColor="#003E7A" radius="base" style={styles.disabledButton}>
				<AppText.Base bold color={AppColors.textOnPrimary}>
					등록 준비중
				</AppText.Base>
			</AppPressable>
		</AppLayout>
	);
}

const styles = StyleSheet.create({
	container: {
		gap: AppSpacing.md,
		padding: AppSpacing.lg,
	},
	hero: {
		minHeight: 104,
		flexDirection: "row",
		alignItems: "center",
		gap: AppSpacing.md,
		borderWidth: 1,
		borderColor: "rgba(0, 75, 147, 0.24)",
		borderRadius: 8,
		backgroundColor: "#F8FBFF",
		padding: AppSpacing.md,
	},
	heroText: {
		flex: 1,
		minWidth: 0,
		gap: AppSpacing.xs,
	},
	fieldList: {
		width: "100%",
		borderWidth: 1,
		borderColor: "rgba(71, 85, 105, 0.24)",
		borderRadius: 8,
		overflow: "hidden",
	},
	fieldRow: {
		minHeight: 50,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: AppSpacing.md,
		borderTopWidth: 1,
		borderTopColor: "rgba(71, 85, 105, 0.16)",
		paddingHorizontal: AppSpacing.md,
	},
	disabledButton: {
		minHeight: 52,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: AppColors.placeholder,
	},
});
