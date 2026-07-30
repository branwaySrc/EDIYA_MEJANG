import { type Href, useRouter } from "expo-router";
import { memo, useCallback, useMemo } from "react";
import { KeyboardTypeOptions, StyleSheet, TextInput, View } from "react-native";

import { AppBadge } from "@/components/base/app-badge";
import { AppPressable } from "@/components/base/app-pressable";
import { AppText } from "@/components/base/app-text";
import { HiringScreenActions } from "@/components/features/sajang/hiring/hiring-screen-actions";
import { hiringWeekdays, isHiringDraftReady, type HiringDraft, type HiringWeekday } from "@/components/features/sajang/hiring/hiring-types";
import { AppColors, AppFonts, AppSpacing } from "@/constants/theme";
import { useHiringContractStore } from "@/store/hiring-contract-store";

type HiringFieldProps = {
	keyboardType?: KeyboardTypeOptions;
	label: string;
	multiline?: boolean;
	onChangeText: (value: string) => void;
	placeholder: string;
	value: string;
};

const HiringField = memo(function HiringField({ keyboardType = "default", label, multiline = false, onChangeText, placeholder, value }: HiringFieldProps) {
	return (
		<View style={styles.field}>
			<AppText.Sm bold color={AppColors.sub}>
				{label}
			</AppText.Sm>
			<TextInput
				keyboardType={keyboardType}
				multiline={multiline}
				onChangeText={onChangeText}
				placeholder={placeholder}
				placeholderTextColor={AppColors.placeholder}
				style={[styles.input, multiline && styles.textArea]}
				textAlignVertical={multiline ? "top" : "center"}
				value={value}
			/>
		</View>
	);
});

function toggleWeekday(days: HiringWeekday[], day: HiringWeekday) {
	return days.includes(day) ? days.filter(item => item !== day) : [...days, day];
}

export function HiringRegisterForm() {
	const router = useRouter();
	const draft = useHiringContractStore(state => state.draft);
	const setField = useHiringContractStore(state => state.setField);
	const ready = useMemo(() => isHiringDraftReady(draft), [draft]);
	const createChangeHandler = useCallback(
		<Key extends keyof HiringDraft>(key: Key) =>
			(value: HiringDraft[Key]) => {
				setField(key, value);
			},
		[setField],
	);

	return (
		<View style={styles.container}>
			<View style={styles.section}>
				<AppText.Sm bold color={AppColors.primary}>
					직원 정보
				</AppText.Sm>
				<HiringField label="직원 이름" value={draft.employeeName} onChangeText={createChangeHandler("employeeName")} placeholder="예: 김민준" />
				<HiringField keyboardType="number-pad" label="나이" value={draft.age} onChangeText={createChangeHandler("age")} placeholder="예: 23" />
				<HiringField label="생년월일" value={draft.birthDate} onChangeText={createChangeHandler("birthDate")} placeholder="YYYY-MM-DD" />
				<HiringField keyboardType="phone-pad" label="연락처" value={draft.phone} onChangeText={createChangeHandler("phone")} placeholder="010-0000-0000" />
				<HiringField
					keyboardType="email-address"
					label="직원 이메일"
					value={draft.employeeEmail}
					onChangeText={createChangeHandler("employeeEmail")}
					placeholder="employee@email.com"
				/>
				<HiringField multiline label="주소" value={draft.address} onChangeText={createChangeHandler("address")} placeholder="직원 주소" />
			</View>

			<View style={styles.section}>
				<AppText.Sm bold color={AppColors.primary}>
					근무 조건
				</AppText.Sm>
				<HiringField label="입사 예정일" value={draft.startDate} onChangeText={createChangeHandler("startDate")} placeholder="YYYY-MM-DD" />
				<View style={styles.field}>
					<AppText.Sm bold color={AppColors.sub}>
						근무요일
					</AppText.Sm>
					<View style={styles.weekdays}>
						{hiringWeekdays.map(day => {
							const active = draft.workDays.includes(day);

							return (
								<AppPressable
									key={day}
									onPress={() => setField("workDays", toggleWeekday(draft.workDays, day))}
									pressedColor="rgba(0, 75, 147, 0.08)"
									radius="full"
									style={[styles.weekdayButton, active && styles.weekdayButtonActive]}
								>
									<AppBadge tone={active ? "primary" : "neutral"}>{day}</AppBadge>
								</AppPressable>
							);
						})}
					</View>
				</View>
				<HiringField label="근무시간" value={draft.workTime} onChangeText={createChangeHandler("workTime")} placeholder="예: 17:00 - 22:00" />
				<HiringField keyboardType="number-pad" label="시급/급여" value={draft.hourlyWage} onChangeText={createChangeHandler("hourlyWage")} placeholder="예: 10030" />
				<HiringField multiline label="근무조건" value={draft.workCondition} onChangeText={createChangeHandler("workCondition")} placeholder="근무 조건" />
				<HiringField multiline label="유의사항" value={draft.notice} onChangeText={createChangeHandler("notice")} placeholder="계약서에 포함할 유의사항" />
			</View>

			<View style={styles.section}>
				<AppText.Sm bold color={AppColors.primary}>
					발송 정보
				</AppText.Sm>
				<HiringField label="사장 이름" value={draft.ownerName} onChangeText={createChangeHandler("ownerName")} placeholder="사장 이름" />
				<HiringField
					keyboardType="email-address"
					label="사장 이메일"
					value={draft.ownerEmail}
					onChangeText={createChangeHandler("ownerEmail")}
					placeholder="owner@email.com"
				/>
				<HiringField label="매장명" value={draft.storeName} onChangeText={createChangeHandler("storeName")} placeholder="EDIYA-월피동점" />
				<HiringField multiline label="매장 주소" value={draft.storeAddress} onChangeText={createChangeHandler("storeAddress")} placeholder="매장 주소" />
				<HiringField keyboardType="phone-pad" label="매장 전화번호" value={draft.storePhone} onChangeText={createChangeHandler("storePhone")} placeholder="매장 전화번호" />
			</View>

			<HiringScreenActions
				primaryDisabled={!ready}
				primaryLabel="계약서 확인"
				onPressPrimary={() => router.push("/sajang/hiring/contract" as Href)}
				onPressSecondary={() => router.back()}
				secondaryLabel="이전"
			/>
		</View>
	);
}

export default HiringRegisterForm;

const styles = StyleSheet.create({
	container: {
		width: "100%",
		gap: AppSpacing.lg,
		padding: AppSpacing.md,
		paddingBottom: AppSpacing.xl,
	},
	section: {
		width: "100%",
		gap: AppSpacing.sm,
	},
	field: {
		width: "100%",
		gap: AppSpacing.xs,
	},
	input: {
		minHeight: 46,
		borderWidth: 1,
		borderColor: "rgba(71, 85, 105, 0.36)",
		borderRadius: 4,
		backgroundColor: AppColors.background,
		color: AppColors.text,
		fontFamily: AppFonts.regular,
		fontSize: 17,
		paddingHorizontal: AppSpacing.sm,
	},
	textArea: {
		minHeight: 86,
		paddingTop: AppSpacing.sm,
	},
	weekdays: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: AppSpacing.xs,
	},
	weekdayButton: {
		backgroundColor: AppColors.background,
	},
	weekdayButtonActive: {
		backgroundColor: "#E6F0FA",
	},
});
