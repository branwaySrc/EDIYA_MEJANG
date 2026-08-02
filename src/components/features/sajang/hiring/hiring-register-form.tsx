import { type Href, useRouter } from "expo-router";
import { useCallback, useMemo } from "react";
import { StyleSheet, Switch, View } from "react-native";

import { AppText } from "@/components/base/app-text";
import { HiringField, HiringStepFrame } from "@/components/features/sajang/hiring/hiring-form-ui";
import { HiringScreenActions } from "@/components/features/sajang/hiring/hiring-screen-actions";
import { type HiringDraft, isEmployeeInfoReady } from "@/components/features/sajang/hiring/hiring-types";
import { AppColors, AppSpacing } from "@/constants/theme";
import { useHiringContractStore } from "@/store/hiring-contract-store";

export function HiringRegisterForm() {
	const router = useRouter();
	const draft = useHiringContractStore(state => state.draft);
	const setField = useHiringContractStore(state => state.setField);
	const ready = useMemo(() => isEmployeeInfoReady(draft), [draft]);
	const createChangeHandler = useCallback(
		<Key extends keyof HiringDraft>(key: Key) =>
			(value: HiringDraft[Key]) => {
				setField(key, value);
			},
		[setField],
	);

	return (
		<HiringStepFrame step={1} title="신규 직원 정보 입력" subtitle="계약서와 직원 목록에 연결될 기본 정보를 입력합니다.">
			<View style={styles.section}>
				<HiringField label="직원 이름" value={draft.employeeName} onChangeText={createChangeHandler("employeeName")} placeholder="예: 김민지" />
				<HiringField label="직원 생년월일" value={draft.birthDate} onChangeText={createChangeHandler("birthDate")} placeholder="YYYY-MM-DD" />
				<HiringField keyboardType="phone-pad" label="연락처" value={draft.phone} onChangeText={createChangeHandler("phone")} placeholder="010-0000-0000" />
				<View style={styles.visibilityRow}>
					<View style={styles.visibilityText}>
						<AppText.Sm bold>연락처 공개</AppText.Sm>
						<AppText.Xs color={AppColors.sub}>
							직원 정보 카드에서 전화번호를 표시합니다.
						</AppText.Xs>
					</View>
					<Switch
						accessibilityLabel="연락처 공개 여부"
						onValueChange={createChangeHandler("phonePublic")}
						thumbColor={AppColors.background}
						trackColor={{ false: "#CBD5E1", true: AppColors.primary }}
						value={draft.phonePublic}
					/>
				</View>
				<HiringField
					keyboardType="email-address"
					label="이메일"
					value={draft.employeeEmail}
					onChangeText={createChangeHandler("employeeEmail")}
					placeholder="employee@email.com"
				/>
				<HiringField multiline label="주소" value={draft.address} onChangeText={createChangeHandler("address")} placeholder="직원 주소" />
			</View>

			<HiringScreenActions
				primaryDisabled={!ready}
				primaryLabel="근무지 선택"
				onPressPrimary={() => router.push("/sajang/hiring/workplace" as Href)}
				onPressSecondary={() => router.dismissTo("/sajang/home" as Href)}
				secondaryLabel="이전"
			/>
		</HiringStepFrame>
	);
}

export default HiringRegisterForm;

const styles = StyleSheet.create({
	section: {
		width: "100%",
		gap: AppSpacing.sm,
	},
	visibilityRow: {
		minHeight: 64,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: AppSpacing.md,
		borderWidth: 1,
		borderColor: "rgba(71, 85, 105, 0.24)",
		borderRadius: 4,
		paddingHorizontal: AppSpacing.md,
	},
	visibilityText: {
		flex: 1,
		minWidth: 0,
		gap: AppSpacing.xs,
	},
});
