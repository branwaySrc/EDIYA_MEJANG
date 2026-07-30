import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/base/app-text";
import { EmployeeCard } from "@/components/features/employee/employee-card";
import { AppColors, AppSpacing } from "@/constants/theme";
import { fetchEmployeeDirectory, getEmployeeDirectorySnapshot } from "@/database/employee/employee";
import type { Employee, EmployeeSection } from "@/database/employee/employee.type";

export type EmployeeViewProps = {
	owner?: Employee;
	sections?: EmployeeSection[];
};

export function EmployeeView({ owner, sections }: EmployeeViewProps) {
	const [directory, setDirectory] = useState(getEmployeeDirectorySnapshot);
	const currentOwner = owner ?? directory.owner;
	const currentSections = sections ?? directory.sections;

	useEffect(() => {
		if (owner || sections) {
			return;
		}

		let mounted = true;

		void fetchEmployeeDirectory().then(nextDirectory => {
			if (mounted) {
				setDirectory(nextDirectory);
			}
		});

		return () => {
			mounted = false;
		};
	}, [owner, sections]);

	return (
		<View style={styles.container}>
			<View style={styles.section}>
				<AppText.Sm bold color={AppColors.primary}>
					사장
				</AppText.Sm>
				<View style={styles.ownerCard}>
					<EmployeeCard employee={currentOwner} />
				</View>
			</View>

			{currentSections.map(section => (
				<View key={section.title} style={styles.section}>
					<View style={styles.sectionHeader}>
						<AppText.Sm bold color={AppColors.primary}>
							{section.title}
						</AppText.Sm>
						<AppText.Xs color={AppColors.sub}>{section.employees.length}명</AppText.Xs>
					</View>

					<View style={styles.employeeGrid}>
						{section.employees.map(employee => (
							<View key={employee.id} style={styles.employeeGridItem}>
								<EmployeeCard employee={employee} />
							</View>
						))}
					</View>
				</View>
			))}
		</View>
	);
}

export default EmployeeView;

const styles = StyleSheet.create({
	container: {
		gap: AppSpacing.lg,
		padding: AppSpacing.md,
		paddingBottom: AppSpacing.xl,
	},
	section: {
		gap: AppSpacing.sm,
	},
	ownerCard: {
		width: "100%",
	},
	sectionHeader: {
		minHeight: 38,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		borderRadius: 4,
		backgroundColor: "rgba(71, 85, 105, 0.1)",
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
