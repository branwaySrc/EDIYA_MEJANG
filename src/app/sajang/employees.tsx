import { type Href, useRouter } from "expo-router";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { AppIcon } from "@/components/base/app-icon";
import { AppPressable } from "@/components/base/app-pressable";
import { AppText } from "@/components/base/app-text";
import { EmployeeCard } from "@/components/features/employee/employee-card";
import { EmployeeView } from "@/components/features/employee/employee-view";
import { AppLayout } from "@/components/global/app-layout";
import { AppColors, AppSpacing } from "@/constants/theme";
import { toEmployee } from "@/database/employee/employee";
import type { Employee } from "@/database/employee/employee.type";
import { useEmployeeManagementStore } from "@/store/employee-management-store";

export default function SajangEmployeesScreen() {
	const router = useRouter();
	const records = useEmployeeManagementStore(state => state.records);
	const terminatedEmployees = useMemo(
		() =>
			records
				.map(toEmployee)
				.filter(employee => !employee.owner && employee.employmentStatus === "terminated")
				.sort((left, right) => (right.terminatedAt ?? "").localeCompare(left.terminatedAt ?? "")),
		[records],
	);
	const openEmployee = (employee: Employee) => {
		router.push({
			pathname: "/sajang/employees/[employeeId]",
			params: { employeeId: employee.id },
		} as Href);
	};
	const openHiringRegistration = () => {
		router.push("/sajang/hiring/register" as Href);
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
			<View style={styles.registerActionArea}>
				<AppPressable
					accessibilityLabel="신규직원 등록하기"
					accessibilityRole="button"
					onPress={openHiringRegistration}
					pressedColor="#003E7A"
					radius="base"
					style={styles.registerButton}
				>
					<AppIcon.Sm color={AppColors.textOnPrimary} name="person-add-outline" pressable={false} />
					<AppText.Base bold color={AppColors.textOnPrimary}>
						신규직원 등록하기
					</AppText.Base>
				</AppPressable>
			</View>
			<View style={styles.adminNotice}>
				<AppText.Base bold color={AppColors.primary}>
					관리자 전용 수정 공간
				</AppText.Base>
				<AppText.Sm color={AppColors.sub}>직원 정보 등록과 수정 흐름을 이 화면에서 관리합니다.</AppText.Sm>
			</View>
			<EmployeeView onPressEmployee={openEmployee} />
			{terminatedEmployees.length > 0 ? (
				<View style={styles.terminatedSection}>
					<View style={styles.terminatedSectionHeader}>
						<AppText.Sm bold color="#B91C1C">
							이전 직원 리스트
						</AppText.Sm>
						<AppText.Xs color={AppColors.sub}>{terminatedEmployees.length}명</AppText.Xs>
					</View>
					<View style={styles.employeeGrid}>
						{terminatedEmployees.map(employee => (
							<View key={employee.id} style={styles.employeeGridItem}>
								<EmployeeCard employee={employee} onPress={() => openEmployee(employee)} />
							</View>
						))}
					</View>
				</View>
			) : null}
		</AppLayout>
	);
}

const styles = StyleSheet.create({
	container: {
		paddingBottom: AppSpacing.xl,
	},
	registerActionArea: {
		paddingHorizontal: AppSpacing.md,
		paddingTop: AppSpacing.md,
	},
	registerButton: {
		width: "100%",
		minHeight: 56,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: AppSpacing.sm,
		backgroundColor: AppColors.primary,
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
	terminatedSection: {
		gap: AppSpacing.sm,
		borderTopWidth: 1,
		borderTopColor: "rgba(185, 28, 28, 0.18)",
		marginHorizontal: AppSpacing.md,
		paddingTop: AppSpacing.lg,
	},
	terminatedSectionHeader: {
		minHeight: 38,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		borderRadius: 4,
		backgroundColor: "rgba(185, 28, 28, 0.08)",
		paddingHorizontal: AppSpacing.sm,
	},
	employeeGrid: {
		width: "100%",
		flexDirection: "row",
		flexWrap: "wrap",
		justifyContent: "space-between",
		rowGap: AppSpacing.sm,
	},
	employeeGridItem: {
		width: "48.5%",
	},
});
