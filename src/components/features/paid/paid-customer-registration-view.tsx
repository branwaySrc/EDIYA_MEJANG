import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";

import { AppBadge } from "@/components/base/app-badge";
import { AppPressable } from "@/components/base/app-pressable";
import { AppText } from "@/components/base/app-text";
import { formatWon, getTodayInputValue, onlyDigits } from "@/components/features/paid/paid-format";
import { AppColors, AppFonts, AppSpacing } from "@/constants/theme";
import { usePaidCustomersStore } from "@/store/paid-customers-store";

type RegistrationFieldProps = {
	keyboardType?: "default" | "number-pad";
	label: string;
	onChangeText: (value: string) => void;
	placeholder: string;
	value: string;
};

function RegistrationField({ keyboardType = "default", label, onChangeText, placeholder, value }: RegistrationFieldProps) {
	return (
		<View style={styles.field}>
			<AppText.Sm bold color={AppColors.sub}>
				{label}
			</AppText.Sm>
			<TextInput
				keyboardType={keyboardType}
				onChangeText={onChangeText}
				placeholder={placeholder}
				placeholderTextColor={AppColors.placeholder}
				style={styles.input}
				value={value}
			/>
		</View>
	);
}

export function PaidCustomerRegistrationView() {
	const router = useRouter();
	const addCustomer = usePaidCustomersStore(state => state.addCustomer);
	const [name, setName] = useState("");
	const [nickname, setNickname] = useState("");
	const [affiliation, setAffiliation] = useState("");
	const [firstPaidDate, setFirstPaidDate] = useState(getTodayInputValue);
	const [initialBalanceText, setInitialBalanceText] = useState("");
	const initialBalance = useMemo(() => Number(onlyDigits(initialBalanceText)), [initialBalanceText]);
	const submitDisabled = !name.trim() || !nickname.trim() || !affiliation.trim() || !firstPaidDate.trim() || initialBalance <= 0;

	const handleSubmit = () => {
		if (submitDisabled) {
			return;
		}

		addCustomer({
			name: name.trim(),
			nickname: nickname.trim(),
			affiliation: affiliation.trim(),
			firstPaidDate: firstPaidDate.trim(),
			initialBalance,
		});
		if (router.canGoBack()) {
			router.back();
			return;
		}

		router.replace("/paid-customer");
	};

	return (
		<View style={styles.container}>
			<View style={styles.previewCard}>
				<AppText.Xl bold color={AppColors.primary} numberOfLines={1}>
					{formatWon(initialBalance)}
				</AppText.Xl>
				<View style={styles.previewProfileRow}>
					<AppText.Base bold numberOfLines={1}>
						{name.trim() || "고객 이름"}
					</AppText.Base>
					<AppBadge tone="primary">{nickname.trim() || "별칭"}</AppBadge>
					<AppBadge tone="primary">{affiliation.trim() || "소속"}</AppBadge>
				</View>
				<View style={styles.previewDateRow}>
					<AppBadge>최초 선결제일</AppBadge>
					<AppText.Sm>{firstPaidDate.trim() || getTodayInputValue()}</AppText.Sm>
				</View>
			</View>

			<View style={styles.form}>
				<RegistrationField label="고객 이름" value={name} onChangeText={setName} placeholder="예: 김민준" />
				<RegistrationField label="별칭" value={nickname} onChangeText={setNickname} placeholder="예: 월피 사무실" />
				<RegistrationField label="소속" value={affiliation} onChangeText={setAffiliation} placeholder="예: 월피동" />
				<RegistrationField label="최초 선결제일" value={firstPaidDate} onChangeText={setFirstPaidDate} placeholder="YYYY-MM-DD" />
				<RegistrationField
					keyboardType="number-pad"
					label="선결제 금액"
					value={initialBalanceText ? Number(initialBalanceText).toLocaleString("ko-KR") : ""}
					onChangeText={value => setInitialBalanceText(onlyDigits(value))}
					placeholder="금액 입력"
				/>

				<AppPressable
					accessibilityLabel="선불 고객 신규등록 저장"
					disabled={submitDisabled}
					onPress={handleSubmit}
					pressedColor="#003E7A"
					radius="base"
					style={[styles.submitButton, submitDisabled && styles.disabledButton]}
				>
					<AppText.Base bold color={AppColors.textOnPrimary}>
						등록하기
					</AppText.Base>
				</AppPressable>
			</View>
		</View>
	);
}

export default PaidCustomerRegistrationView;

const styles = StyleSheet.create({
	container: {
		width: "100%",
		gap: AppSpacing.md,
		padding: AppSpacing.md,
		paddingBottom: AppSpacing.xl,
	},
	previewCard: {
		width: "100%",
		borderWidth: 1,
		borderColor: "rgba(71, 85, 105, 0.34)",
		borderRadius: 8,
		backgroundColor: AppColors.background,
		paddingHorizontal: AppSpacing.md,
		paddingVertical: AppSpacing.sm,
		gap: 6,
	},
	previewProfileRow: {
		flexDirection: "row",
		alignItems: "center",
		flexWrap: "wrap",
		gap: AppSpacing.sm,
	},
	previewDateRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 14,
	},
	form: {
		width: "100%",
		gap: AppSpacing.md,
	},
	field: {
		width: "100%",
		gap: AppSpacing.xs,
	},
	input: {
		minHeight: 48,
		borderWidth: 1,
		borderColor: "rgba(71, 85, 105, 0.42)",
		borderRadius: 4,
		backgroundColor: AppColors.background,
		color: AppColors.text,
		fontFamily: AppFonts.regular,
		fontSize: 17,
		paddingHorizontal: AppSpacing.sm,
	},
	submitButton: {
		minHeight: 52,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: AppColors.primary,
		marginTop: AppSpacing.xs,
	},
	disabledButton: {
		opacity: 0.42,
	},
});
