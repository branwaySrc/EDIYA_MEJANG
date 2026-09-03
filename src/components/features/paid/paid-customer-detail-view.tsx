import { useMemo, useState } from "react";
import { Image, Modal, StyleSheet, TextInput, View } from "react-native";

import { AppBadge } from "@/components/base/app-badge";
import { AppIcon } from "@/components/base/app-icon";
import { AppPressable } from "@/components/base/app-pressable";
import { AppSpacer } from "@/components/base/app-spacer";
import { AppText } from "@/components/base/app-text";
import { formatWon, getTodayInputValue, onlyDigits } from "@/components/features/paid/paid-format";
import { PaidReceiptImageInput } from "@/components/features/paid/paid-receipt-image-input";
import { AppColors, AppFonts, AppSpacing } from "@/constants/theme";
import { createPaidLedgerEntryId, defaultPaidStoreId, getPaidCustomerBalance, isPaidLedgerDebit } from "@/database/paid/paid-customer";
import type {
	CreatePaidLedgerEntryInput,
	PaidCustomer,
	PaidCustomerProfileChange,
	PaidCustomerProfileField,
	PaidCustomerProfileSnapshot,
	PaidLedgerEntry,
	UpdatePaidCustomerProfileInput,
} from "@/database/paid/paid-customer.type";
import { createPaidReceiptSignedUrlAsync, uploadPaidReceiptImageIfConfiguredAsync } from "@/lib/paid/paid-receipt-images";

export type PaidCustomerDetailViewProps = {
	customer: PaidCustomer;
	onAddTransaction: (customerId: string, payload: CreatePaidLedgerEntryInput) => Promise<void> | void;
	onUpdateProfile: (customerId: string, payload: UpdatePaidCustomerProfileInput) => Promise<void> | void;
};

type PaidCustomerActivity =
	| { entry: PaidLedgerEntry; id: string; kind: "ledger"; occurredAt: string }
	| { change: PaidCustomerProfileChange; id: string; kind: "profile"; occurredAt: string };

const profileFieldLabels: Record<PaidCustomerProfileField, string> = {
	name: "이름",
	nickname: "별칭",
	affiliation: "소속",
	phone: "연락처",
};

function formatProfileChangedAt(value: string): string {
	const date = new Date(value);

	if (Number.isNaN(date.getTime())) {
		return value;
	}

	return new Intl.DateTimeFormat("ko-KR", {
		timeZone: "Asia/Seoul",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	}).format(date);
}

function ProfileSnapshot({
	changedFields,
	label,
	snapshot,
}: {
	changedFields: PaidCustomerProfileField[];
	label: string;
	snapshot: PaidCustomerProfileSnapshot;
}) {
	return (
		<View style={styles.profileSnapshot}>
			<AppText.Xs bold color={AppColors.primary}>
				{label}
			</AppText.Xs>
			{changedFields.map(field => (
				<View key={field} style={styles.profileSnapshotRow}>
					<AppText.Xs color={AppColors.sub}>{profileFieldLabels[field]}</AppText.Xs>
					<AppText.Sm bold style={styles.profileSnapshotValue}>
						{snapshot[field] || "미등록"}
					</AppText.Sm>
				</View>
			))}
		</View>
	);
}

export function PaidCustomerDetailView({ customer, onAddTransaction, onUpdateProfile }: PaidCustomerDetailViewProps) {
	const [amountText, setAmountText] = useState("");
	const [memoText, setMemoText] = useState("");
	const [pendingUsage, setPendingUsage] = useState<{
		amount: number;
		date: string;
		idempotencyKey: string;
		memo?: string;
		receiptImageUri?: string;
	} | null>(null);
	const [correctionOpen, setCorrectionOpen] = useState(false);
	const [correctionAmountText, setCorrectionAmountText] = useState("");
	const [correctionMemoText, setCorrectionMemoText] = useState("");
	const [usageReceiptImageUri, setUsageReceiptImageUri] = useState("");
	const [usageReceiptErrorMessage, setUsageReceiptErrorMessage] = useState("");
	const [usageSubmitting, setUsageSubmitting] = useState(false);
	const [selectedReceiptEntry, setSelectedReceiptEntry] = useState<PaidLedgerEntry | null>(null);
	const [receiptModalImageUri, setReceiptModalImageUri] = useState<string | null>(null);
	const [receiptModalLoading, setReceiptModalLoading] = useState(false);
	const [receiptModalErrorMessage, setReceiptModalErrorMessage] = useState("");
	const [profileEditing, setProfileEditing] = useState(false);
	const [profileSaving, setProfileSaving] = useState(false);
	const [profileName, setProfileName] = useState(customer.name);
	const [profileNickname, setProfileNickname] = useState(customer.nickname);
	const [profileAffiliation, setProfileAffiliation] = useState(customer.affiliation);
	const [profilePhone, setProfilePhone] = useState(customer.phone ?? "");
	const [expandedChangeId, setExpandedChangeId] = useState<string | null>(null);
	const balance = getPaidCustomerBalance(customer);
	const transactionDate = getTodayInputValue();
	const amount = useMemo(() => Number(onlyDigits(amountText)), [amountText]);
	const correctionAmount = useMemo(() => Number(onlyDigits(correctionAmountText)), [correctionAmountText]);
	const amountInvalid = amount > balance;
	const saveDisabled = amount <= 0 || amountInvalid;
	const profilePhoneInvalid = profilePhone.length > 0 && (profilePhone.length < 10 || profilePhone.length > 11);
	const profileSaveDisabled = profileSaving || !profileName.trim() || !profileNickname.trim() || !profileAffiliation.trim() || profilePhoneInvalid;
	const activities = useMemo<PaidCustomerActivity[]>(() => {
		const ledgerActivities: PaidCustomerActivity[] = customer.ledger.map(entry => ({
			entry,
			id: `ledger-${entry.id}`,
			kind: "ledger",
			occurredAt: entry.occurredAt ?? entry.createdAt ?? `${entry.businessDate}T00:00:00+09:00`,
		}));
		const profileActivities: PaidCustomerActivity[] = (customer.profileChanges ?? []).map(change => ({
			change,
			id: `profile-${change.id}`,
			kind: "profile",
			occurredAt: change.occurredAt,
		}));

		return [...ledgerActivities, ...profileActivities].sort(
			(left, right) => new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime(),
		);
	}, [customer.ledger, customer.profileChanges]);

	const openProfileEditor = () => {
		setProfileName(customer.name);
		setProfileNickname(customer.nickname);
		setProfileAffiliation(customer.affiliation);
		setProfilePhone(customer.phone ?? "");
		setProfileEditing(true);
	};
	const saveProfile = async () => {
		if (profileSaveDisabled) {
			return;
		}

		setProfileSaving(true);
		try {
			await onUpdateProfile(customer.id, {
				name: profileName.trim(),
				nickname: profileNickname.trim(),
				affiliation: profileAffiliation.trim(),
				phone: profilePhone || null,
				storeId: customer.storeId ?? defaultPaidStoreId,
			});
			setProfileEditing(false);
		} finally {
			setProfileSaving(false);
		}
	};

	const handleSave = () => {
		if (saveDisabled) {
			return;
		}

		setPendingUsage({
			amount,
			date: transactionDate,
			idempotencyKey: createPaidLedgerEntryId(customer.id),
			memo: memoText.trim() || undefined,
			receiptImageUri: usageReceiptImageUri || undefined,
		});
	};
	const confirmUsage = async () => {
		if (!pendingUsage || usageSubmitting) {
			return;
		}

		setUsageSubmitting(true);
		setUsageReceiptErrorMessage("");

		try {
			let receiptStoragePath: string | null = null;
			let receiptUploadedAt: string | null = null;

			if (pendingUsage.receiptImageUri) {
				receiptStoragePath = await uploadPaidReceiptImageIfConfiguredAsync({
					customerId: customer.id,
					imageUri: pendingUsage.receiptImageUri,
					ledgerEntryId: pendingUsage.idempotencyKey,
					storeId: customer.storeId ?? defaultPaidStoreId,
				});

				if (!receiptStoragePath) {
					throw new Error("Supabase receipt storage is not configured.");
				}

				receiptUploadedAt = new Date().toISOString();
			}

			await onAddTransaction(customer.id, {
				...pendingUsage,
				receiptStoragePath,
				receiptUploadedAt,
				type: "usage",
			});
			setAmountText("");
			setMemoText("");
			setUsageReceiptImageUri("");
			setPendingUsage(null);
		} catch (error) {
			console.error("Failed to upload paid usage receipt image.", error);
			setUsageReceiptErrorMessage("영수증 이미지를 업로드하지 못했습니다. 다시 시도해 주세요.");
		} finally {
			setUsageSubmitting(false);
		}
	};
	const confirmCorrection = async () => {
		if (correctionAmount <= 0) {
			return;
		}

		await onAddTransaction(customer.id, {
			amount: correctionAmount,
			date: transactionDate,
			memo: correctionMemoText.trim() || undefined,
			type: "correction",
		});
		setCorrectionAmountText("");
		setCorrectionMemoText("");
		setCorrectionOpen(false);
	};
	const openReceiptModal = async (entry: PaidLedgerEntry) => {
		setSelectedReceiptEntry(entry);
		setReceiptModalImageUri(entry.receiptImageUri ?? null);
		setReceiptModalErrorMessage("");

		if (entry.receiptImageUri || !entry.receiptStoragePath) {
			return;
		}

		try {
			setReceiptModalLoading(true);
			setReceiptModalImageUri(await createPaidReceiptSignedUrlAsync(entry.receiptStoragePath));
		} catch (error) {
			console.error("Failed to create paid receipt signed URL.", error);
			setReceiptModalErrorMessage("등록된 이미지를 불러오지 못했습니다.");
		} finally {
			setReceiptModalLoading(false);
		}
	};
	const closeReceiptModal = () => {
		setSelectedReceiptEntry(null);
		setReceiptModalImageUri(null);
		setReceiptModalLoading(false);
		setReceiptModalErrorMessage("");
	};

	return (
		<View style={styles.container}>
			<View style={styles.balanceCard}>
				<View style={styles.profileHeaderRow}>
					<View style={styles.profileTitleArea}>
						<AppText.Lg bold>{customer.name}</AppText.Lg>
						<AppText.Xs bold color={AppColors.sub}>
							현재 잔액
						</AppText.Xs>
					</View>
					<AppPressable
						accessibilityLabel={`${customer.name} 고객 정보 수정`}
						onPress={openProfileEditor}
						pressedColor="rgba(0, 75, 147, 0.08)"
						radius="base"
						style={styles.profileEditButton}
					>
						<AppIcon.Sm color={AppColors.primary} name="create-outline" pressable={false} />
						<AppText.Sm bold color={AppColors.primary}>
							정보 수정
						</AppText.Sm>
					</AppPressable>
				</View>
				<AppText.Xl bold color={AppColors.primary} numberOfLines={1}>
					{formatWon(balance)}
				</AppText.Xl>
				<View style={styles.profileRow}>
					<AppBadge size="xs" tone="primary">
						{customer.nickname}
					</AppBadge>
					<AppBadge tone="primary">{customer.affiliation}</AppBadge>
					<AppBadge>최초 선결제일 {customer.firstPaidDate}</AppBadge>
				</View>
				<AppText.Sm color={AppColors.sub}>연락처 {customer.phone || "미등록"}</AppText.Sm>
				{profileEditing ? (
					<View style={styles.profileEditor}>
						<AppText.Base bold color={AppColors.primary}>
							고객 정보 수정
						</AppText.Base>
						<View style={styles.profileEditorField}>
							<AppText.Xs bold color={AppColors.sub}>
								이름
							</AppText.Xs>
							<TextInput
								onChangeText={setProfileName}
								placeholder="고객 이름"
								placeholderTextColor={AppColors.placeholder}
								style={styles.profileEditorInput}
								value={profileName}
							/>
						</View>
						<View style={styles.profileEditorField}>
							<AppText.Xs bold color={AppColors.sub}>
								별칭
							</AppText.Xs>
							<TextInput
								onChangeText={setProfileNickname}
								placeholder="별칭"
								placeholderTextColor={AppColors.placeholder}
								style={styles.profileEditorInput}
								value={profileNickname}
							/>
						</View>
						<View style={styles.profileEditorField}>
							<AppText.Xs bold color={AppColors.sub}>
								소속
							</AppText.Xs>
							<TextInput
								onChangeText={setProfileAffiliation}
								placeholder="소속"
								placeholderTextColor={AppColors.placeholder}
								style={styles.profileEditorInput}
								value={profileAffiliation}
							/>
						</View>
						<View style={styles.profileEditorField}>
							<AppText.Xs bold color={AppColors.sub}>
								연락처
							</AppText.Xs>
							<TextInput
								keyboardType="phone-pad"
								maxLength={11}
								onChangeText={value => setProfilePhone(onlyDigits(value).slice(0, 11))}
								placeholder="숫자만 입력 (선택)"
								placeholderTextColor={AppColors.placeholder}
								style={styles.profileEditorInput}
								value={profilePhone}
							/>
							{profilePhoneInvalid ? <AppText.Xs color="#DC2626">숫자 10~11자리로 입력해 주세요.</AppText.Xs> : null}
						</View>
						<View style={styles.profileEditorActions}>
							<AppPressable
								accessibilityLabel="고객 정보 수정 취소"
								disabled={profileSaving}
								onPress={() => setProfileEditing(false)}
								pressedColor="#E2E8F0"
								radius="base"
								style={styles.profileCancelButton}
							>
								<AppText.Sm bold color={AppColors.sub}>
									취소
								</AppText.Sm>
							</AppPressable>
							<AppPressable
								accessibilityLabel="고객 정보 수정 저장"
								disabled={profileSaveDisabled}
								onPress={() => void saveProfile()}
								pressedColor="#003E7A"
								radius="base"
								style={[styles.profileSaveButton, profileSaveDisabled && styles.saveButtonDisabled]}
							>
								<AppText.Sm bold color={AppColors.textOnPrimary}>
									{profileSaving ? "저장 중" : "저장"}
								</AppText.Sm>
							</AppPressable>
						</View>
					</View>
				) : null}
			</View>

			<View style={styles.detail}>
				<View style={styles.detailSectionHeader}>
					<View style={styles.detailSectionTitle}>
						<AppIcon.Sm color={AppColors.primary} name="receipt-outline" pressable={false} />
						<AppText.Base bold>오늘 사용 등록</AppText.Base>
					</View>
					<AppBadge tone="primary">{transactionDate}</AppBadge>
				</View>
				<View style={styles.inputGrid}>
					<View style={styles.inputGroup}>
						<AppText.Sm bold color={AppColors.sub}>
							오늘 차감할 금액
						</AppText.Sm>
						<TextInput
							keyboardType="number-pad"
							onChangeText={value => setAmountText(onlyDigits(value))}
							placeholder="차감 금액 입력"
							placeholderTextColor={AppColors.placeholder}
							style={styles.input}
							value={amountText ? Number(amountText).toLocaleString("ko-KR") : ""}
						/>
					</View>
				</View>
				<View style={styles.memoGroup}>
					<AppText.Sm bold color={AppColors.sub}>
						메모
					</AppText.Sm>
					<TextInput
						onChangeText={setMemoText}
						placeholder="필요한 메모를 입력해 주세요"
						placeholderTextColor={AppColors.placeholder}
						style={styles.memoInput}
						value={memoText}
					/>
				</View>
				<View style={styles.usageReceiptSection}>
					<PaidReceiptImageInput
						errorMessage={usageReceiptErrorMessage}
						imageUri={usageReceiptImageUri}
						label="영수증·주문표 사진"
						onChange={imageUri => {
							setUsageReceiptImageUri(imageUri);
							setUsageReceiptErrorMessage("");
						}}
						onError={setUsageReceiptErrorMessage}
						onRemove={() => {
							setUsageReceiptImageUri("");
							setUsageReceiptErrorMessage("");
						}}
					/>
				</View>

				{amountInvalid ? (
					<AppText.Xs color="#DC2626" style={styles.errorText}>
						잔액보다 큰 금액은 입력할 수 없어요.
					</AppText.Xs>
				) : null}

				<AppPressable
					accessibilityLabel={`${customer.name} 차감 금액 저장`}
					disabled={saveDisabled}
					onPress={handleSave}
					pressedColor="#003E7A"
					radius="base"
					style={[styles.saveButton, saveDisabled && styles.saveButtonDisabled]}
				>
					<AppText.Base bold color={AppColors.textOnPrimary} style={styles.saveButtonText}>
						차감하기
					</AppText.Base>
				</AppPressable>

				<View style={styles.ledgerTitleRow}>
					<View style={styles.detailSectionTitle}>
						<AppIcon.Sm color={AppColors.primary} name="list-outline" pressable={false} />
						<AppText.Base bold>사용 내역</AppText.Base>
					</View>
					<AppText.Sm color={AppColors.sub}>{activities.length}건</AppText.Sm>
				</View>
				<View style={styles.ledger}>
					<View style={styles.ledgerHeader}>
						<AppText.Sm bold color={AppColors.primary} style={styles.ledgerDate}>
							날짜
						</AppText.Sm>
						<AppText.Sm bold color={AppColors.primary} style={styles.ledgerAmount}>
							금액
						</AppText.Sm>
						<View style={styles.ledgerBalance} />
					</View>

					{activities.length === 0 ? (
						<View style={styles.emptyLedger}>
							<AppText.Sm color={AppColors.placeholder}>아직 사용 내역이 없습니다.</AppText.Sm>
						</View>
					) : (
						activities.map((activity, index) => (
							<View key={activity.id}>
								{index > 0 ? <AppSpacer style={styles.ledgerSpacer} /> : null}
								{activity.kind === "ledger" ? (
									<View style={styles.ledgerEntry}>
										<View style={styles.ledgerRow}>
											<View style={styles.ledgerDateCell}>
												<AppText.Sm>{activity.entry.date}</AppText.Sm>
												{activity.entry.memo ? (
													<AppText.Xs color={AppColors.sub} style={styles.ledgerMemoText}>
														Memo: {activity.entry.memo}
													</AppText.Xs>
												) : null}
												{activity.entry.type === "opening" ? (
													<AppBadge size="xs" tone="primary" style={styles.openingBadge}>
														최초등록
													</AppBadge>
												) : null}
												{activity.entry.receiptImageUri || activity.entry.receiptStoragePath ? (
													<AppPressable
														accessibilityLabel={`${activity.entry.date} 등록 이미지 보기`}
														onPress={() => void openReceiptModal(activity.entry)}
														pressedColor="rgba(0, 75, 147, 0.08)"
														radius="base"
														style={styles.receiptLink}
													>
														<AppText.Xs bold color={AppColors.primary} style={styles.receiptLinkText}>
															등록된 이미지 보기
														</AppText.Xs>
													</AppPressable>
												) : null}
											</View>
											<AppText.Sm color={isPaidLedgerDebit(activity.entry) ? AppColors.text : AppColors.primary} style={styles.ledgerAmount}>
												{isPaidLedgerDebit(activity.entry) ? "-" : "+"}
												{formatWon(activity.entry.amount)}
											</AppText.Sm>
											<AppText.Sm bold style={styles.ledgerBalance}>
												{formatWon(activity.entry.balanceAfter)}
											</AppText.Sm>
										</View>
									</View>
								) : (
									<View style={styles.profileChangeEntry}>
										<AppPressable
											accessibilityLabel={`${formatProfileChangedAt(activity.change.occurredAt)} 정보변경 상세 ${
												expandedChangeId === activity.change.id ? "접기" : "펼치기"
											}`}
											onPress={() => setExpandedChangeId(current => (current === activity.change.id ? null : activity.change.id))}
											pressedColor="rgba(0, 75, 147, 0.08)"
											radius="base"
											style={styles.profileChangeButton}
										>
											<View style={styles.profileChangeTitleArea}>
												<AppText.Xs color={AppColors.sub}>{formatProfileChangedAt(activity.change.occurredAt)}</AppText.Xs>
												<AppBadge size="xs" tone="primary">
													정보변경
												</AppBadge>
											</View>
											<AppIcon.Sm
												color={AppColors.primary}
												name={expandedChangeId === activity.change.id ? "chevron-up" : "chevron-down"}
												pressable={false}
											/>
										</AppPressable>
										{expandedChangeId === activity.change.id ? (
											<View style={styles.profileChangeDetails}>
												<ProfileSnapshot changedFields={activity.change.changedFields} label="변경 전" snapshot={activity.change.before} />
												<View style={styles.profileChangeDivider} />
												<ProfileSnapshot changedFields={activity.change.changedFields} label="변경 후" snapshot={activity.change.after} />
											</View>
										) : null}
									</View>
								)}
							</View>
						))
					)}
					<View style={styles.ledgerFooter}>
						<AppPressable
							accessibilityLabel={`${customer.name} 오류 수정하기`}
							onPress={() => setCorrectionOpen(open => !open)}
							pressedColor="rgba(220, 38, 38, 0.08)"
							radius="base"
							style={styles.correctionLink}
						>
							<AppText.Sm bold color="#DC2626" style={styles.correctionLinkText}>
								오류 수정하기
							</AppText.Sm>
						</AppPressable>
					</View>
				</View>

				{correctionOpen ? (
					<View style={styles.correctionPanel}>
						<AppText.Base bold color={AppColors.textOnPrimary}>
							얼마를 취소하시겠어요?
						</AppText.Base>
						<AppText.Sm color="rgba(255, 255, 255, 0.82)">입력한 금액은 잔액에 다시 더해지고 내역에 +로 기록됩니다.</AppText.Sm>
						<TextInput
							keyboardType="number-pad"
							onChangeText={value => setCorrectionAmountText(onlyDigits(value))}
							placeholder="취소 금액 입력"
							placeholderTextColor="rgba(255, 255, 255, 0.64)"
							style={styles.correctionInput}
							value={correctionAmountText ? Number(correctionAmountText).toLocaleString("ko-KR") : ""}
						/>
						<TextInput
							onChangeText={setCorrectionMemoText}
							placeholder="오류 수정 메모"
							placeholderTextColor="rgba(255, 255, 255, 0.64)"
							style={styles.correctionInput}
							value={correctionMemoText}
						/>
						<View style={styles.correctionSummary}>
							<AppText.Sm color={AppColors.textOnPrimary}>현재 잔액 {formatWon(balance)}</AppText.Sm>
							<AppText.Sm bold color={AppColors.textOnPrimary}>
								수정 후 잔액 {formatWon(balance + correctionAmount)}
							</AppText.Sm>
						</View>
						<View style={styles.overlayActions}>
							<AppPressable
								accessibilityLabel="오류 수정 취소"
								onPress={() => setCorrectionOpen(false)}
								pressedColor="rgba(255, 255, 255, 0.16)"
								radius="base"
								style={styles.redSecondaryButton}
							>
								<AppText.Base bold color={AppColors.textOnPrimary}>
									뒤로가기
								</AppText.Base>
							</AppPressable>
							<AppPressable
								accessibilityLabel="오류 수정 확인"
								disabled={correctionAmount <= 0}
								onPress={() => void confirmCorrection()}
								pressedColor="#FEE2E2"
								radius="base"
								style={[styles.redPrimaryButton, correctionAmount <= 0 && styles.saveButtonDisabled]}
							>
								<AppText.Base bold color="#DC2626">
									확인
								</AppText.Base>
							</AppPressable>
						</View>
					</View>
				) : null}

				{pendingUsage ? (
					<View style={styles.overlayLayer}>
						<View style={styles.confirmCard}>
							<AppText.Lg bold color={AppColors.primary}>
								차감 내용을 확인해 주세요
							</AppText.Lg>
							<View style={styles.confirmSummary}>
								<View style={styles.confirmRow}>
									<AppText.Sm color={AppColors.sub}>차감 금액</AppText.Sm>
									<AppText.Base bold>{formatWon(pendingUsage.amount)}</AppText.Base>
								</View>
								<View style={styles.confirmRow}>
									<AppText.Sm color={AppColors.sub}>현재 잔액</AppText.Sm>
									<AppText.Base>{formatWon(balance)}</AppText.Base>
								</View>
								<View style={styles.confirmRow}>
									<AppText.Sm color={AppColors.sub}>차감 후 잔액</AppText.Sm>
									<AppText.Base bold color={AppColors.primary}>
										{formatWon(balance - pendingUsage.amount)}
									</AppText.Base>
								</View>
								{pendingUsage.memo ? (
									<View style={styles.confirmMemoRow}>
										<AppText.Xs color={AppColors.sub}>메모: {pendingUsage.memo}</AppText.Xs>
									</View>
								) : null}
								{pendingUsage.receiptImageUri ? (
									<View style={styles.confirmMemoRow}>
										<AppText.Xs bold color={AppColors.primary}>
											영수증·주문표 이미지 첨부됨
										</AppText.Xs>
									</View>
								) : null}
							</View>
							<View style={styles.overlayActions}>
								<AppPressable
									accessibilityLabel="차감 확인 뒤로가기"
									disabled={usageSubmitting}
									onPress={() => setPendingUsage(null)}
									pressedColor="rgba(0, 75, 147, 0.08)"
									radius="base"
									style={[styles.secondaryButton, usageSubmitting && styles.saveButtonDisabled]}
								>
									<AppText.Base bold color={AppColors.primary}>
										뒤로가기
									</AppText.Base>
								</AppPressable>
								<AppPressable
									accessibilityLabel="차감 확인"
									disabled={usageSubmitting}
									onPress={() => void confirmUsage()}
									pressedColor="#003E7A"
									radius="base"
									style={[styles.primaryButton, usageSubmitting && styles.saveButtonDisabled]}
								>
									<AppText.Base bold color={AppColors.textOnPrimary}>
										{usageSubmitting ? "등록 중" : "확인"}
									</AppText.Base>
								</AppPressable>
							</View>
						</View>
					</View>
				) : null}
			</View>

			<Modal animationType="fade" onRequestClose={closeReceiptModal} statusBarTranslucent transparent visible={Boolean(selectedReceiptEntry)}>
				<View style={styles.receiptModalOverlay}>
					<AppPressable
						accessibilityLabel="등록 이미지 닫기"
						onPress={closeReceiptModal}
						pressedColor="transparent"
						style={styles.receiptModalBackdrop}
					/>
					<View style={styles.receiptModalCard}>
						<View style={styles.receiptModalHeader}>
							<View style={styles.receiptModalTitleArea}>
								<AppText.Base bold>등록된 이미지</AppText.Base>
								{selectedReceiptEntry ? <AppText.Xs color={AppColors.sub}>{selectedReceiptEntry.date}</AppText.Xs> : null}
							</View>
							<AppIcon.Base accessibilityLabel="등록 이미지 닫기" name="close" onPress={closeReceiptModal} />
						</View>
						<View style={styles.receiptModalImageFrame}>
							{receiptModalLoading ? (
								<AppText.Sm color={AppColors.sub}>이미지를 불러오는 중입니다.</AppText.Sm>
							) : receiptModalImageUri ? (
								<Image
									accessibilityLabel={`${selectedReceiptEntry?.date ?? "사용 내역"} 등록 이미지`}
									resizeMode="contain"
									source={{ uri: receiptModalImageUri }}
									style={styles.receiptModalImage}
								/>
							) : (
								<AppText.Sm color="#B91C1C">{receiptModalErrorMessage || "등록된 이미지가 없습니다."}</AppText.Sm>
							)}
						</View>
					</View>
				</View>
			</Modal>
		</View>
	);
}

export default PaidCustomerDetailView;

const styles = StyleSheet.create({
	container: {
		width: "100%",
		gap: AppSpacing.md,
		padding: AppSpacing.md,
		paddingBottom: AppSpacing.xl,
	},
	balanceCard: {
		width: "100%",
		gap: AppSpacing.xs,
		borderWidth: 1,
		borderColor: "rgba(71, 85, 105, 0.34)",
		borderRadius: 8,
		backgroundColor: AppColors.background,
		padding: AppSpacing.md,
	},
	profileHeaderRow: {
		flexDirection: "row",
		alignItems: "flex-start",
		justifyContent: "space-between",
		gap: AppSpacing.md,
	},
	profileTitleArea: {
		flex: 1,
		minWidth: 0,
		gap: 2,
	},
	profileEditButton: {
		minHeight: 40,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: AppSpacing.xs,
		borderWidth: 1,
		borderColor: "rgba(0, 75, 147, 0.34)",
		paddingHorizontal: AppSpacing.sm,
	},
	profileRow: {
		flexDirection: "row",
		alignItems: "center",
		flexWrap: "wrap",
		gap: AppSpacing.sm,
	},
	profileEditor: {
		width: "100%",
		gap: AppSpacing.sm,
		borderTopWidth: 1,
		borderColor: "rgba(71, 85, 105, 0.24)",
		marginTop: AppSpacing.sm,
		paddingTop: AppSpacing.md,
	},
	profileEditorField: {
		width: "100%",
		gap: AppSpacing.xs,
	},
	profileEditorInput: {
		minHeight: 44,
		borderWidth: 1,
		borderColor: "rgba(71, 85, 105, 0.42)",
		borderRadius: 4,
		backgroundColor: "#F8FAFC",
		color: AppColors.text,
		fontFamily: AppFonts.regular,
		fontSize: 17,
		paddingHorizontal: AppSpacing.sm,
	},
	profileEditorActions: {
		flexDirection: "row",
		gap: AppSpacing.sm,
		marginTop: AppSpacing.xs,
	},
	profileCancelButton: {
		flex: 1,
		minHeight: 44,
		alignItems: "center",
		justifyContent: "center",
		borderWidth: 1,
		borderColor: "rgba(71, 85, 105, 0.38)",
		backgroundColor: AppColors.background,
	},
	profileSaveButton: {
		flex: 1,
		minHeight: 44,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: AppColors.primary,
	},
	detail: {
		position: "relative",
		borderWidth: 1,
		borderColor: "rgba(71, 85, 105, 0.24)",
		borderRadius: 8,
		backgroundColor: "#f4f4f4",
		padding: AppSpacing.md,
	},
	detailSectionHeader: {
		minHeight: 36,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: AppSpacing.md,
		marginBottom: AppSpacing.sm,
	},
	detailSectionTitle: {
		flexDirection: "row",
		alignItems: "center",
		gap: AppSpacing.xs,
	},
	inputGrid: {
		width: "100%",
	},
	inputGroup: {
		width: "100%",
		minWidth: 0,
		gap: AppSpacing.xs,
	},
	input: {
		minHeight: 44,
		borderWidth: 1,
		borderColor: "rgba(71, 85, 105, 0.42)",
		borderRadius: 4,
		backgroundColor: AppColors.background,
		color: AppColors.text,
		fontFamily: AppFonts.regular,
		fontSize: 17,
		paddingHorizontal: AppSpacing.sm,
	},
	memoGroup: {
		width: "100%",
		gap: AppSpacing.xs,
		marginTop: AppSpacing.sm,
	},
	memoInput: {
		minHeight: 44,
		borderWidth: 1,
		borderColor: "rgba(71, 85, 105, 0.42)",
		borderRadius: 4,
		backgroundColor: AppColors.background,
		color: AppColors.text,
		fontFamily: AppFonts.regular,
		fontSize: 17,
		paddingHorizontal: AppSpacing.sm,
	},
	usageReceiptSection: {
		width: "100%",
		marginTop: AppSpacing.md,
	},
	errorText: {
		marginTop: AppSpacing.sm,
	},
	saveButton: {
		minHeight: 46,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: AppColors.primary,
		marginTop: AppSpacing.md,
	},
	saveButtonText: {
		width: "100%",
		textAlign: "center",
	},
	saveButtonDisabled: {
		opacity: 0.42,
	},
	ledgerTitleRow: {
		minHeight: 36,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: AppSpacing.md,
		marginTop: AppSpacing.lg,
		marginBottom: AppSpacing.sm,
	},
	ledger: {
		borderWidth: 1,
		borderColor: "rgba(71, 85, 105, 0.34)",
		borderRadius: 4,
		backgroundColor: AppColors.background,
		overflow: "hidden",
	},
	ledgerHeader: {
		minHeight: 40,
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#EEF4FA",
		paddingHorizontal: AppSpacing.sm,
	},
	ledgerEntry: {
		backgroundColor: AppColors.background,
	},
	profileChangeEntry: {
		backgroundColor: "#F8FAFC",
	},
	profileChangeButton: {
		minHeight: 56,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: AppSpacing.md,
		paddingHorizontal: AppSpacing.sm,
		paddingVertical: AppSpacing.xs,
	},
	profileChangeTitleArea: {
		flex: 1,
		minWidth: 0,
		alignItems: "flex-start",
		gap: AppSpacing.xs,
	},
	profileChangeDetails: {
		borderTopWidth: 1,
		borderColor: "rgba(0, 75, 147, 0.18)",
		backgroundColor: AppColors.background,
		padding: AppSpacing.sm,
		gap: AppSpacing.sm,
	},
	profileSnapshot: {
		gap: AppSpacing.xs,
	},
	profileSnapshotRow: {
		flexDirection: "row",
		alignItems: "flex-start",
		justifyContent: "space-between",
		gap: AppSpacing.md,
	},
	profileSnapshotValue: {
		flex: 1,
		textAlign: "right",
	},
	profileChangeDivider: {
		height: 1,
		backgroundColor: "rgba(71, 85, 105, 0.18)",
	},
	ledgerRow: {
		minHeight: 50,
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: AppSpacing.sm,
		paddingVertical: AppSpacing.xs,
	},
	ledgerDateCell: {
		flex: 1.05,
		minWidth: 0,
		gap: 2,
	},
	ledgerMemoText: {
		lineHeight: 17,
	},
	receiptLink: {
		alignSelf: "flex-start",
		minHeight: 24,
		justifyContent: "center",
		paddingRight: AppSpacing.xs,
	},
	receiptLinkText: {
		textDecorationLine: "underline",
	},
	openingBadge: {
		alignSelf: "flex-start",
	},
	ledgerDate: {
		flex: 1.05,
	},
	ledgerAmount: {
		flex: 1,
		textAlign: "right",
	},
	ledgerBalance: {
		flex: 1,
		textAlign: "right",
	},
	ledgerSpacer: {
		opacity: 0.32,
	},
	emptyLedger: {
		minHeight: 52,
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: AppSpacing.sm,
	},
	ledgerFooter: {
		minHeight: 44,
		alignItems: "flex-end",
		justifyContent: "center",
		borderTopWidth: 1,
		borderColor: "rgba(71, 85, 105, 0.24)",
		paddingHorizontal: AppSpacing.sm,
	},
	correctionLink: {
		minHeight: 34,
		justifyContent: "center",
		paddingHorizontal: AppSpacing.xs,
	},
	correctionLinkText: {
		textDecorationLine: "underline",
	},
	correctionPanel: {
		width: "100%",
		gap: AppSpacing.sm,
		backgroundColor: "#DC2626",
		padding: AppSpacing.md,
		marginTop: AppSpacing.md,
	},
	correctionInput: {
		minHeight: 46,
		borderWidth: 1,
		borderColor: "rgba(255, 255, 255, 0.72)",
		borderRadius: 4,
		backgroundColor: "rgba(255, 255, 255, 0.12)",
		color: AppColors.textOnPrimary,
		fontFamily: AppFonts.regular,
		fontSize: 17,
		paddingHorizontal: AppSpacing.sm,
	},
	correctionSummary: {
		gap: AppSpacing.xs,
	},
	receiptModalOverlay: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "rgba(15, 23, 42, 0.68)",
		padding: AppSpacing.md,
	},
	receiptModalBackdrop: {
		position: "absolute",
		top: 0,
		right: 0,
		bottom: 0,
		left: 0,
	},
	receiptModalCard: {
		width: "100%",
		height: "76%",
		maxWidth: 560,
		borderWidth: 1,
		borderColor: "rgba(255, 255, 255, 0.28)",
		borderRadius: 8,
		backgroundColor: AppColors.background,
		padding: AppSpacing.md,
		gap: AppSpacing.sm,
	},
	receiptModalHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: AppSpacing.md,
	},
	receiptModalTitleArea: {
		gap: 2,
	},
	receiptModalImageFrame: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		borderWidth: 1,
		borderColor: "rgba(71, 85, 105, 0.24)",
		borderRadius: 4,
		backgroundColor: "#F8FAFC",
		overflow: "hidden",
	},
	receiptModalImage: {
		width: "100%",
		height: "100%",
	},
	overlayLayer: {
		position: "absolute",
		top: 0,
		right: 0,
		bottom: 0,
		left: 0,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "rgba(0, 0, 0, 0.3)",
		padding: AppSpacing.md,
	},
	confirmCard: {
		width: "100%",
		borderRadius: 8,
		backgroundColor: AppColors.background,
		padding: AppSpacing.md,
		gap: AppSpacing.md,
	},
	confirmSummary: {
		borderWidth: 1,
		borderColor: "rgba(71, 85, 105, 0.26)",
		borderRadius: 4,
		backgroundColor: "#F8FAFC",
		padding: AppSpacing.md,
		gap: AppSpacing.sm,
	},
	confirmRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: AppSpacing.md,
	},
	confirmMemoRow: {
		borderTopWidth: 1,
		borderColor: "rgba(71, 85, 105, 0.18)",
		paddingTop: AppSpacing.sm,
	},
	overlayActions: {
		flexDirection: "row",
		gap: AppSpacing.sm,
	},
	secondaryButton: {
		flex: 1,
		minHeight: 46,
		alignItems: "center",
		justifyContent: "center",
		borderWidth: 1,
		borderColor: AppColors.primary,
		backgroundColor: AppColors.background,
	},
	primaryButton: {
		flex: 1,
		minHeight: 46,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: AppColors.primary,
	},
	redSecondaryButton: {
		flex: 1,
		minHeight: 46,
		alignItems: "center",
		justifyContent: "center",
		borderWidth: 1,
		borderColor: AppColors.textOnPrimary,
		backgroundColor: "transparent",
	},
	redPrimaryButton: {
		flex: 1,
		minHeight: 46,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: AppColors.textOnPrimary,
	},
});
