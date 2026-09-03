import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";

import { AppBadge } from "@/components/base/app-badge";
import { AppPressable } from "@/components/base/app-pressable";
import { AppText } from "@/components/base/app-text";
import { PaidReceiptImageInput } from "@/components/features/paid/paid-receipt-image-input";
import { formatWon, getTodayInputValue, onlyDigits } from "@/components/features/paid/paid-format";
import { AppColors, AppFonts, AppSpacing } from "@/constants/theme";
import { createPaidCustomerId, defaultPaidStoreId } from "@/database/paid/paid-customer";
import { uploadPaidReceiptImageIfConfiguredAsync } from "@/lib/paid/paid-receipt-images";
import { usePaidCustomersStore } from "@/store/paid-customers-store";

type RegistrationFieldProps = {
	keyboardType?: "default" | "number-pad" | "phone-pad";
	label: string;
	maxLength?: number;
	onChangeText: (value: string) => void;
	placeholder: string;
	value: string;
};

function RegistrationField({ keyboardType = "default", label, maxLength, onChangeText, placeholder, value }: RegistrationFieldProps) {
	return (
		<View style={styles.field}>
			<AppText.Sm bold color={AppColors.sub}>
				{label}
			</AppText.Sm>
			<TextInput
				keyboardType={keyboardType}
				maxLength={maxLength}
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
	const [phone, setPhone] = useState("");
	const [firstPaidDate, setFirstPaidDate] = useState(getTodayInputValue);
	const [initialBalanceText, setInitialBalanceText] = useState("");
	const [receiptErrorMessage, setReceiptErrorMessage] = useState("");
	const [receiptImageUri, setReceiptImageUri] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const initialBalance = useMemo(() => Number(onlyDigits(initialBalanceText)), [initialBalanceText]);
	const phoneInvalid = phone.length > 0 && (phone.length < 10 || phone.length > 11);
	const submitDisabled =
		submitting ||
		!name.trim() ||
		!nickname.trim() ||
		!affiliation.trim() ||
		!firstPaidDate.trim() ||
		initialBalance <= 0 ||
		phoneInvalid;

	const handleSubmit = async () => {
		if (submitDisabled) {
			return;
		}

		setSubmitting(true);
		const customerId = createPaidCustomerId({
			affiliation: affiliation.trim(),
			name: name.trim(),
			nickname: nickname.trim(),
		});
		const openingLedgerEntryId = `${customerId}-opening`;
		let receiptStoragePath: string | null = null;
		let receiptUploadedAt: string | null = null;

		if (receiptImageUri) {
			try {
				receiptStoragePath = await uploadPaidReceiptImageIfConfiguredAsync({
					customerId,
					imageUri: receiptImageUri,
					ledgerEntryId: openingLedgerEntryId,
					storeId: defaultPaidStoreId,
				});
				receiptUploadedAt = receiptStoragePath ? new Date().toISOString() : null;
			} catch (error) {
				console.error("Failed to upload paid receipt image to Supabase.", error);
			}
		}

		try {
			await addCustomer({
				id: customerId,
				name: name.trim(),
				nickname: nickname.trim(),
				affiliation: affiliation.trim(),
				firstPaidDate: firstPaidDate.trim(),
				initialBalance,
				openingLedgerEntryId,
				openingReceiptImageUri: receiptImageUri || null,
				openingReceiptStoragePath: receiptStoragePath,
				openingReceiptUploadedAt: receiptUploadedAt,
				phone: phone || null,
			});
			if (router.canGoBack()) {
				router.back();
				return;
			}

			router.replace("/paid-customer");
		} finally {
			setSubmitting(false);
		}
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
				<AppText.Xs color={AppColors.sub}>연락처 {phone || "미등록"}</AppText.Xs>
			</View>

			<View style={styles.form}>
				<RegistrationField label="고객 이름" value={name} onChangeText={setName} placeholder="예: 김민준" />
				<RegistrationField label="별칭" value={nickname} onChangeText={setNickname} placeholder="예: 월피 사무실" />
				<RegistrationField label="소속" value={affiliation} onChangeText={setAffiliation} placeholder="예: 월피동" />
				<RegistrationField
					keyboardType="phone-pad"
					label="연락처"
					maxLength={11}
					value={phone}
					onChangeText={value => setPhone(onlyDigits(value).slice(0, 11))}
					placeholder="숫자만 입력 (선택)"
				/>
				{phoneInvalid ? <AppText.Xs color="#DC2626">연락처는 숫자 10~11자리로 입력해 주세요.</AppText.Xs> : null}
				<RegistrationField label="최초 선결제일" value={firstPaidDate} onChangeText={setFirstPaidDate} placeholder="YYYY-MM-DD" />
				<RegistrationField
					keyboardType="number-pad"
					label="선결제 금액"
					value={initialBalanceText ? Number(initialBalanceText).toLocaleString("ko-KR") : ""}
					onChangeText={value => setInitialBalanceText(onlyDigits(value))}
					placeholder="금액 입력"
				/>
				<PaidReceiptImageInput
					errorMessage={receiptErrorMessage}
					imageUri={receiptImageUri}
					onChange={imageUri => {
						setReceiptImageUri(imageUri);
						setReceiptErrorMessage("");
					}}
					onError={setReceiptErrorMessage}
					onRemove={() => {
						setReceiptImageUri("");
						setReceiptErrorMessage("");
					}}
				/>

				<AppPressable
					accessibilityLabel="선불 고객 신규등록 저장"
					disabled={submitDisabled}
					onPress={() => void handleSubmit()}
					pressedColor="#003E7A"
					radius="base"
					style={[styles.submitButton, submitDisabled && styles.disabledButton]}
				>
					<AppText.Base bold color={AppColors.textOnPrimary}>
						{submitting ? "등록 중" : "등록하기"}
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
