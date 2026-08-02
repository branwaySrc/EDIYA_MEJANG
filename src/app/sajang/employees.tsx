import { type Href, useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/base/app-text";
import { EmployeeView } from "@/components/features/employee/employee-view";
import { AppLayout } from "@/components/global/app-layout";
import { AppColors, AppSpacing } from "@/constants/theme";
import type { Employee } from "@/database/employee/employee.type";

export default function SajangEmployeesScreen() {
	const router = useRouter();
	const openEmployee = (employee: Employee) => {
		router.push({
			pathname: "/sajang/employees/[employeeId]",
			params: { employeeId: employee.id },
		} as Href);
	};

	return (
		<AppLayout
			activeDrawerId="owner-space"
			leadingMode="back"
			onPressBack={() => router.back()}
			title="직원관리"
			type="scrollview"
			contentContainerStyle={styles.container}
		>
			<View style={styles.adminNotice}>
				<AppText.Base bold color={AppColors.primary}>
					관리자 전용 수정 공간
				</AppText.Base>
				<AppText.Sm color={AppColors.sub}>직원 정보 등록과 수정 흐름이 이 화면에 연결될 예정입니다.</AppText.Sm>
			</View>
			<EmployeeView onPressEmployee={openEmployee} />
		</AppLayout>
	);
}

const styles = StyleSheet.create({
	container: {
		paddingBottom: AppSpacing.xl,
	},
	adminNotice: {
		gap: AppSpacing.xs,
		borderWidth: 1,
		borderColor: "rgba(0, 75, 147, 0.24)",
		borderRadius: 8,
		backgroundColor: "#F8FBFF",
		margin: AppSpacing.md,
		marginBottom: 0,
		padding: AppSpacing.md,
	},
});
