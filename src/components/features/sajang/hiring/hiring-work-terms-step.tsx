import { type Href, useRouter } from "expo-router";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { AppBadge } from "@/components/base/app-badge";
import { AppPressable } from "@/components/base/app-pressable";
import { AppText } from "@/components/base/app-text";
import { HiringField, HiringStepFrame } from "@/components/features/sajang/hiring/hiring-form-ui";
import { HiringScreenActions } from "@/components/features/sajang/hiring/hiring-screen-actions";
import { hiringWeekdays, type HiringWeekday, isWorkTermsReady } from "@/components/features/sajang/hiring/hiring-types";
import { TimeField } from "@/components/ui/time-field";
import { employeeShiftGroups } from "@/database/employee/employee";
import type { EmployeeShiftGroup } from "@/database/employee/employee.type";
import { AppColors, AppSpacing } from "@/constants/theme";
import { useHiringContractStore } from "@/store/hiring-contract-store";

function toggleWeekday(days: HiringWeekday[], day: HiringWeekday) {
	return days.includes(day) ? days.filter(item => item !== day) : [...days, day];
}

export function HiringWorkTermsStep() {
	const router = useRouter();
	const draft = useHiringContractStore(state => state.draft);
	const setField = useHiringContractStore(state => state.setField);
	const ready = useMemo(() => isWorkTermsReady(draft), [draft]);

	return (
		<HiringStepFrame step={5} title="근로 시간 및 임금 작성" subtitle="직원 목록의 근무일, 근무시간, 근무조 정보에도 연결됩니다.">
			<View style={styles.section}>
				<View style={styles.timeRow}>
					<View style={styles.timeField}>
						<TimeField
							label="근무 시작"
							onChange={minutes => setField("workStartMinutes", minutes)}
							value={draft.workStartMinutes}
						/>
					</View>
					<View style={styles.timeField}>
						<TimeField
							label="근무 종료"
							onChange={minutes => setField("workEndMinutes", minutes)}
							value={draft.workEndMinutes}
						/>
					</View>
				</View>

				<View style={styles.field}>
					<AppText.Sm bold color={AppColors.sub}>
						근무일
					</AppText.Sm>
					<View style={styles.optionRow}>
						{hiringWeekdays.map(day => {
							const active = draft.workDays.includes(day);

							return (
								<AppPressable
									key={day}
									onPress={() => setField("workDays", toggleWeekday(draft.workDays, day))}
									pressedColor="rgba(0, 75, 147, 0.08)"
									radius="full"
									style={styles.badgeButton}
								>
									<AppBadge tone={active ? "primary" : "neutral"} size="sm">
										{day}
									</AppBadge>
								</AppPressable>
							);
						})}
					</View>
				</View>

				<View style={styles.field}>
					<AppText.Sm bold color={AppColors.sub}>
						근무조
					</AppText.Sm>
					<View style={styles.optionRow}>
						{employeeShiftGroups.map(group => {
							const active = draft.shiftGroup === group;

							return (
								<AppPressable
									key={group}
									onPress={() => setField("shiftGroup", group as EmployeeShiftGroup)}
									pressedColor="rgba(0, 75, 147, 0.08)"
									radius="base"
									style={[styles.shiftButton, active && styles.shiftButtonActive]}
								>
									<AppText.Sm bold color={active ? AppColors.primary : AppColors.sub}>
										{group}
									</AppText.Sm>
								</AppPressable>
							);
						})}
					</View>
				</View>

				<HiringField
					keyboardType="number-pad"
					label="임금"
					value={draft.hourlyWage}
					onChangeText={value => setField("hourlyWage", value)}
					placeholder="예: 10030"
				/>
			</View>

			<HiringScreenActions
				primaryDisabled={!ready}
				primaryLabel="요약 및 서명"
				onPressPrimary={() => router.push("/sajang/hiring/signature" as Href)}
				onPressSecondary={() => router.back()}
				secondaryLabel="이전"
			/>
		</HiringStepFrame>
	);
}

export default HiringWorkTermsStep;

const styles = StyleSheet.create({
	section: {
		width: "100%",
		gap: AppSpacing.sm,
	},
	field: {
		width: "100%",
		gap: AppSpacing.xs,
	},
	timeRow: {
		width: "100%",
		flexDirection: "row",
		gap: AppSpacing.sm,
	},
	timeField: {
		flex: 1,
		minWidth: 0,
	},
	optionRow: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: AppSpacing.xs,
	},
	badgeButton: {
		backgroundColor: AppColors.background,
	},
	shiftButton: {
		minHeight: 40,
		justifyContent: "center",
		borderWidth: 1,
		borderColor: "rgba(71, 85, 105, 0.24)",
		backgroundColor: AppColors.background,
		paddingHorizontal: AppSpacing.md,
	},
	shiftButtonActive: {
		borderColor: AppColors.primary,
		backgroundColor: "#F8FBFF",
	},
});
