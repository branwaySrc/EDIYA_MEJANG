import { useMemo, useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";

import { AppBadge } from "@/components/base/app-badge";
import { AppIcon } from "@/components/base/app-icon";
import { AppPressable } from "@/components/base/app-pressable";
import { AppSpacer } from "@/components/base/app-spacer";
import { AppText } from "@/components/base/app-text";
import { formatWon, getTodayInputValue, onlyDigits } from "@/components/features/paid/paid-format";
import { AppColors, AppFonts, AppSpacing } from "@/constants/theme";
import { getPaidCustomerBalance, getRecentUsageDate, isPaidLedgerDebit } from "@/database/paid/paid-customer";
import type { CreatePaidLedgerEntryInput, PaidCustomer } from "@/database/paid/paid-customer.type";

export type PaidCustomerCardProps = {
	customer: PaidCustomer;
	expanded: boolean;
	onAddTransaction: (customerId: string, payload: CreatePaidLedgerEntryInput) => void;
	onToggleExpanded: () => void;
};

export function PaidCustomerCard({ customer, expanded, onAddTransaction, onToggleExpanded }: PaidCustomerCardProps) {
	const [amountText, setAmountText] = useState("");
	const [memoText, setMemoText] = useState("");
	const [pendingUsage, setPendingUsage] = useState<{ amount: number; date: string; memo?: string } | null>(null);
	const [correctionOpen, setCorrectionOpen] = useState(false);
	const [correctionAmountText, setCorrectionAmountText] = useState("");
	const [correctionMemoText, setCorrectionMemoText] = useState("");
	const balance = getPaidCustomerBalance(customer);
	const recentUsageDate = getRecentUsageDate(customer);
	const transactionDate = getTodayInputValue();
	const amount = useMemo(() => Number(onlyDigits(amountText)), [amountText]);
	const correctionAmount = useMemo(() => Number(onlyDigits(correctionAmountText)), [correctionAmountText]);
	const amountInvalid = amount > balance;
	const saveDisabled = amount <= 0 || amountInvalid;

	const handleSave = () => {
		if (saveDisabled) {
			return;
		}

		setPendingUsage({
			amount,
			date: transactionDate,
			memo: memoText.trim() || undefined,
		});
	};

	const confirmUsage = () => {
		if (!pendingUsage) {
			return;
		}

		onAddTransaction(customer.id, {
			...pendingUsage,
			type: "usage",
		});
		setAmountText("");
		setMemoText("");
		setPendingUsage(null);
	};

	const confirmCorrection = () => {
		if (correctionAmount <= 0) {
			return;
		}

		onAddTransaction(customer.id, {
			amount: correctionAmount,
			date: transactionDate,
			memo: correctionMemoText.trim() || undefined,
			type: "correction",
		});
		setCorrectionAmountText("");
		setCorrectionMemoText("");
		setCorrectionOpen(false);
	};

	return (
		<View style={[styles.card, expanded && styles.cardExpanded]}>
			<AppPressable onPress={onToggleExpanded} pressedColor="rgba(0, 75, 147, 0.04)" radius="base" style={styles.summary}>
				<View style={styles.summaryLeft}>
					<View style={styles.profileRow}>
						<AppText.Base bold numberOfLines={1}>
							{customer.name}
						</AppText.Base>
						<AppBadge size="xs" tone="primary">
							{customer.nickname}
						</AppBadge>
						<AppBadge tone="primary">{customer.affiliation}</AppBadge>
					</View>
					<View style={styles.balanceBlock}>
						<AppText.Xs bold color={AppColors.sub}>
							현재 잔액
						</AppText.Xs>
						<AppText.Xl bold color={AppColors.primary} numberOfLines={1}>
							{formatWon(balance)}
						</AppText.Xl>
					</View>
					<View style={styles.summaryDateRow}>
						<AppText.Sm bold color={AppColors.primary}>
							최초 선결제일
						</AppText.Sm>
						<AppText.Sm>{customer.firstPaidDate}</AppText.Sm>
					</View>
				</View>

				<View style={styles.summaryRight}>
					<View style={styles.summaryDateColumn}>
						<AppBadge style={styles.dateBadge}>최근 결제일</AppBadge>
						<AppText.Sm>{recentUsageDate}</AppText.Sm>
					</View>
					<View style={styles.expandAction}>
						<AppText.Sm bold color={AppColors.primary}>
							펼쳐보기
						</AppText.Sm>
						<AppIcon.Sm color={AppColors.primary} name={expanded ? "chevron-up" : "chevron-down"} pressable={false} />
					</View>
				</View>
			</AppPressable>

			{expanded && (
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

					{amountInvalid && (
						<AppText.Xs color="#DC2626" style={styles.errorText}>
							잔액보다 큰 금액은 입력할 수 없어요.
						</AppText.Xs>
					)}

					<AppPressable
						accessibilityLabel={`${customer.name} 차감 금액 저장`}
						disabled={saveDisabled}
						onPress={handleSave}
						pressedColor="#003E7A"
						radius="base"
						style={[styles.saveButton, saveDisabled && styles.saveButtonDisabled]}
					>
						<AppText.Base bold color={AppColors.textOnPrimary}>
							차감 저장
						</AppText.Base>
					</AppPressable>

					<View style={styles.ledgerTitleRow}>
						<View style={styles.detailSectionTitle}>
							<AppIcon.Sm color={AppColors.primary} name="list-outline" pressable={false} />
							<AppText.Base bold>사용 내역</AppText.Base>
						</View>
						<AppText.Sm color={AppColors.sub}>{customer.ledger.length}건</AppText.Sm>
					</View>
					<View style={styles.ledger}>
						<View style={styles.ledgerHeader}>
							<AppText.Sm bold color={AppColors.primary} style={styles.ledgerDate}>
								날짜
							</AppText.Sm>
							<AppText.Sm bold color={AppColors.primary} style={styles.ledgerAmount}>
								금액
							</AppText.Sm>
							<AppText.Sm bold color={AppColors.primary} style={styles.ledgerBalance}>
								잔액
							</AppText.Sm>
						</View>

						{customer.ledger.length === 0 ? (
							<View style={styles.emptyLedger}>
								<AppText.Sm color={AppColors.placeholder}>아직 사용 내역이 없습니다.</AppText.Sm>
							</View>
						) : (
							customer.ledger
								.slice()
								.reverse()
								.map((entry, index) => (
									<View key={entry.id}>
										{index > 0 && <AppSpacer style={styles.ledgerSpacer} />}
										<View style={styles.ledgerEntry}>
											<View style={styles.ledgerRow}>
												<View style={styles.ledgerDateCell}>
													<AppText.Sm>{entry.date}</AppText.Sm>
													{entry.memo && (
														<AppText.Xs color={AppColors.sub} style={styles.ledgerMemoText}>
															Memo: {entry.memo}
														</AppText.Xs>
													)}
												</View>
												<AppText.Sm color={isPaidLedgerDebit(entry) ? AppColors.text : AppColors.primary} style={styles.ledgerAmount}>
													{isPaidLedgerDebit(entry) ? "-" : "+"}
													{formatWon(entry.amount)}
												</AppText.Sm>
												<AppText.Sm bold style={styles.ledgerBalance}>
													{formatWon(entry.balanceAfter)}
												</AppText.Sm>
											</View>
										</View>
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

					{correctionOpen && (
						<View style={styles.correctionPanel}>
							<AppText.Base bold color={AppColors.textOnPrimary}>
								얼마를 취소하시겠어요?
							</AppText.Base>
							<AppText.Sm color="rgba(255, 255, 255, 0.82)">입력한 금액은 잔액에 다시 더해지고 장부에 +로 기록됩니다.</AppText.Sm>
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
									onPress={confirmCorrection}
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
					)}

					{pendingUsage && (
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
									{pendingUsage.memo && (
										<View style={styles.confirmMemoRow}>
											<AppText.Xs color={AppColors.sub}>메모: {pendingUsage.memo}</AppText.Xs>
										</View>
									)}
								</View>
								<View style={styles.overlayActions}>
									<AppPressable
										accessibilityLabel="차감 확인 뒤로가기"
										onPress={() => setPendingUsage(null)}
										pressedColor="rgba(0, 75, 147, 0.08)"
										radius="base"
										style={styles.secondaryButton}
									>
										<AppText.Base bold color={AppColors.primary}>
											뒤로가기
										</AppText.Base>
									</AppPressable>
									<AppPressable
										accessibilityLabel="차감 확인"
										onPress={confirmUsage}
										pressedColor="#003E7A"
										radius="base"
										style={styles.primaryButton}
									>
										<AppText.Base bold color={AppColors.textOnPrimary}>
											확인
										</AppText.Base>
									</AppPressable>
								</View>
							</View>
						</View>
					)}
				</View>
			)}
		</View>
	);
}

export default PaidCustomerCard;

const styles = StyleSheet.create({
	card: {
		width: "100%",
		borderWidth: 1,
		borderColor: "rgba(71, 85, 105, 0.34)",
		borderRadius: 8,
		backgroundColor: AppColors.background,
		overflow: "hidden",
		marginBottom: 14,
	},
	cardExpanded: {
		borderWidth: 2,
		borderColor: AppColors.primary,
	},
	summary: {
		width: "100%",
		minHeight: 112,
		flexDirection: "row",
		justifyContent: "space-between",
		gap: AppSpacing.sm,
		backgroundColor: AppColors.background,
		paddingHorizontal: AppSpacing.md,
		paddingVertical: AppSpacing.sm,
	},
	summaryLeft: {
		flex: 1,
		minWidth: 0,
		justifyContent: "center",
		gap: AppSpacing.xs,
	},
	profileRow: {
		flexDirection: "row",
		alignItems: "center",
		flexWrap: "wrap",
		gap: AppSpacing.sm,
	},
	balanceBlock: {
		gap: 2,
	},
	summaryDateRow: {
		flexDirection: "row",
		alignItems: "center",
		flexWrap: "wrap",
		gap: AppSpacing.sm,
	},
	summaryRight: {
		width: 116,
		alignItems: "flex-end",
		justifyContent: "space-between",
		paddingVertical: 2,
	},
	summaryDateColumn: {
		alignItems: "flex-end",
		gap: AppSpacing.xs,
	},
	expandAction: {
		flexDirection: "row",
		alignItems: "center",
		gap: AppSpacing.xs,
	},
	dateBadge: {
		alignSelf: "flex-start",
	},
	recentBadge: {
		alignSelf: "flex-end",
	},
	detail: {
		position: "relative",
		borderTopWidth: 1,
		borderColor: "rgba(71, 85, 105, 0.24)",
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
