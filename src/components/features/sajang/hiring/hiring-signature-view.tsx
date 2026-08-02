import { type Href, useRouter } from "expo-router";
import { memo, useMemo, useRef, useState } from "react";
import { Image, Modal, StyleSheet, View } from "react-native";
import SignatureCanvas, { type SignatureViewRef } from "react-native-signature-canvas";

import { AppPressable } from "@/components/base/app-pressable";
import { AppText } from "@/components/base/app-text";
import { createHiringSummary } from "@/components/features/sajang/hiring/hiring-contract-template";
import { createEmployeeRecordFromHiringDraft } from "@/components/features/sajang/hiring/hiring-employee-mapper";
import { HiringStepFrame } from "@/components/features/sajang/hiring/hiring-form-ui";
import { createAndSaveHiringContractPdf, createHiringContractRecord } from "@/components/features/sajang/hiring/hiring-pdf-service";
import { HiringScreenActions } from "@/components/features/sajang/hiring/hiring-screen-actions";
import type { HiringSignatureImages } from "@/components/features/sajang/hiring/hiring-types";
import { hiringOwnerName } from "@/components/features/sajang/hiring/hiring-types";
import { AppColors, AppSpacing } from "@/constants/theme";
import { useEmployeeManagementStore } from "@/store/employee-management-store";
import { useHiringContractStore } from "@/store/hiring-contract-store";

const signatureWebStyle = `
	.m-signature-pad { box-shadow: none; border: 0; }
	.m-signature-pad--body { border: 0; }
	.m-signature-pad--footer { display: none; margin: 0; }
	body, html { width: 100%; height: 100%; }
`;

type SignatureTarget = "employee" | "owner";

function getSignatureTargetLabel(target: SignatureTarget | null) {
	if (target === "owner") {
		return "사장 서명";
	}

	if (target === "employee") {
		return "직원 서명";
	}

	return "서명";
}

function SignatureButtonRow({
	label,
	onPress,
	signed,
}: {
	label: string;
	onPress: () => void;
	signed: boolean;
}) {
	return (
		<View style={styles.signatureButtonRow}>
			<View style={styles.signatureButtonText}>
				<AppText.Base bold>{label}</AppText.Base>
				<AppText.Sm color={signed ? AppColors.primary : AppColors.sub}>{signed ? "서명이 적용되었습니다." : "서명이 필요합니다."}</AppText.Sm>
			</View>
			<AppPressable onPress={onPress} pressedColor="#003E7A" radius="base" style={styles.signatureOpenButton}>
				<AppText.Sm bold color={AppColors.textOnPrimary}>
					{signed ? "다시 서명" : "서명하기"}
				</AppText.Sm>
			</AppPressable>
		</View>
	);
}

export const HiringSignatureView = memo(function HiringSignatureView() {
	const router = useRouter();
	const modalSignatureRef = useRef<SignatureViewRef>(null);
	const draft = useHiringContractStore(state => state.draft);
	const addContract = useHiringContractStore(state => state.addContract);
	const setResult = useHiringContractStore(state => state.setResult);
	const upsertEmployeeRecord = useEmployeeManagementStore(state => state.upsertEmployeeRecord);
	const summaryRows = useMemo(() => createHiringSummary(draft), [draft]);
	const [activeSignatureTarget, setActiveSignatureTarget] = useState<SignatureTarget | null>(null);
	const [busy, setBusy] = useState(false);
	const [message, setMessage] = useState("사장 서명과 직원 서명을 순서대로 입력해 주세요.");
	const [ownerSignature, setOwnerSignature] = useState("");
	const [employeeSignature, setEmployeeSignature] = useState("");
	const signaturesReady = ownerSignature.length > 0 && employeeSignature.length > 0;

	const openSignatureModal = (target: SignatureTarget) => {
		setActiveSignatureTarget(target);
	};

	const closeSignatureModal = () => {
		setActiveSignatureTarget(null);
	};

	const handleSignatureOk = (signatureImageDataUrl: string) => {
		if (activeSignatureTarget === "owner") {
			setOwnerSignature(signatureImageDataUrl);
			setMessage("사장 서명이 적용되었습니다. 직원 서명도 입력해 주세요.");
		}

		if (activeSignatureTarget === "employee") {
			setEmployeeSignature(signatureImageDataUrl);
			setMessage("직원 서명이 적용되었습니다. PDF 저장을 진행할 수 있습니다.");
		}

		closeSignatureModal();
	};

	const handleSignatureEmpty = () => {
		setMessage("서명이 비어 있습니다. 서명창에 서명한 뒤 적용해 주세요.");
	};

	const savePdf = async () => {
		if (!signaturesReady) {
			setMessage("사장 서명과 직원 서명을 모두 입력해 주세요.");
			return;
		}

		try {
			setBusy(true);
			setMessage("PDF를 저장하고 직원 정보를 연결하는 중입니다.");
			const signatures: HiringSignatureImages = {
				ownerSignatureImageDataUrl: ownerSignature,
				employeeSignatureImageDataUrl: employeeSignature,
			};
			const result = await createAndSaveHiringContractPdf(draft, signatures);
			const contractRecord = createHiringContractRecord(draft, result);

			setResult(result);
			addContract(contractRecord);
			upsertEmployeeRecord(createEmployeeRecordFromHiringDraft(draft, result));
			router.replace("/sajang/hiring/complete" as Href);
		} catch (error) {
			const nextMessage = error instanceof Error ? error.message : "계약서 처리 중 문제가 발생했습니다.";
			setMessage(nextMessage);
		} finally {
			setBusy(false);
		}
	};

	return (
		<>
			<HiringStepFrame step={6} title="계약서 요약 및 서명" subtitle={message}>
				<View style={styles.orderedSummary}>
					{summaryRows.map(row => (
						<View key={row.label} style={styles.summaryLine}>
							<AppText.Sm bold style={styles.summaryLabel}>
								{row.label}
							</AppText.Sm>
							<AppText.Sm style={styles.summaryValue}>{row.value}</AppText.Sm>
						</View>
					))}
				</View>

				<View style={styles.signatureButtonList}>
					<SignatureButtonRow label="사장 서명" signed={ownerSignature.length > 0} onPress={() => openSignatureModal("owner")} />
					<SignatureButtonRow label="직원 서명" signed={employeeSignature.length > 0} onPress={() => openSignatureModal("employee")} />
				</View>

				<View style={styles.contractSignaturePreview}>
					<AppText.Base bold color={AppColors.primary}>
						계약서 서명 부문 미리보기
					</AppText.Base>
					<View style={styles.previewRow}>
						<AppText.Sm style={styles.previewLabel}>대표자 : {hiringOwnerName}</AppText.Sm>
						<View style={styles.previewSignSlot}>
							{ownerSignature && <Image resizeMode="contain" source={{ uri: ownerSignature }} style={styles.previewSignatureImage} />}
						</View>
						<AppText.Sm>(서명)</AppText.Sm>
					</View>
					<View style={styles.previewRow}>
						<AppText.Sm style={styles.previewLabel}>성명 : {draft.employeeName || "근로자"}</AppText.Sm>
						<View style={styles.previewSignSlot}>
							{employeeSignature && <Image resizeMode="contain" source={{ uri: employeeSignature }} style={styles.previewSignatureImage} />}
						</View>
						<AppText.Sm>(서명)</AppText.Sm>
					</View>
				</View>

				<HiringScreenActions
					primaryDisabled={busy || !signaturesReady}
					primaryLabel={busy ? "처리중" : "PDF 저장"}
					onPressPrimary={savePdf}
					onPressSecondary={() => router.back()}
					secondaryLabel="이전"
				/>
			</HiringStepFrame>

			<Modal animationType="slide" transparent visible={activeSignatureTarget !== null} onRequestClose={closeSignatureModal}>
				<View style={styles.modalLayer}>
					<View style={styles.modalPanel}>
						<View style={styles.modalHeader}>
							<View style={styles.modalHeaderText}>
								<AppText.Xs bold color={AppColors.primary}>
									서명 입력
								</AppText.Xs>
								<AppText.Lg bold>{getSignatureTargetLabel(activeSignatureTarget)}</AppText.Lg>
							</View>
							<AppPressable onPress={closeSignatureModal} pressedColor="rgba(0, 75, 147, 0.08)" radius="base" style={styles.modalCloseButton}>
								<AppText.Sm bold color={AppColors.primary}>
									닫기
								</AppText.Sm>
							</AppPressable>
						</View>

						<View style={styles.signatureFrame}>
							<SignatureCanvas
								ref={modalSignatureRef}
								autoClear={false}
								backgroundColor={AppColors.background}
								clearText="지우기"
								confirmText="적용"
								descriptionText=""
								imageType="image/png"
								onEmpty={handleSignatureEmpty}
								onOK={handleSignatureOk}
								penColor={AppColors.text}
								style={styles.signatureCanvas}
								trimWhitespace
								webStyle={signatureWebStyle}
							/>
						</View>

						<View style={styles.modalActions}>
							<AppPressable onPress={() => modalSignatureRef.current?.clearSignature()} pressedColor="rgba(0, 75, 147, 0.08)" radius="base" style={styles.modalSecondaryButton}>
								<AppText.Base bold color={AppColors.primary}>
									지우기
								</AppText.Base>
							</AppPressable>
							<AppPressable onPress={() => modalSignatureRef.current?.readSignature()} pressedColor="#003E7A" radius="base" style={styles.modalPrimaryButton}>
								<AppText.Base bold color={AppColors.textOnPrimary}>
									적용
								</AppText.Base>
							</AppPressable>
						</View>
					</View>
				</View>
			</Modal>
		</>
	);
});

export default HiringSignatureView;

const styles = StyleSheet.create({
	orderedSummary: {
		width: "100%",
		gap: AppSpacing.xs,
		borderWidth: 1,
		borderColor: "rgba(71, 85, 105, 0.24)",
		borderRadius: 8,
		backgroundColor: AppColors.background,
		padding: AppSpacing.md,
	},
	summaryLine: {
		width: "100%",
		gap: 2,
	},
	summaryLabel: {
		color: AppColors.text,
	},
	summaryValue: {
		color: AppColors.sub,
	},
	signatureButtonList: {
		width: "100%",
		gap: AppSpacing.sm,
	},
	signatureButtonRow: {
		minHeight: 76,
		flexDirection: "row",
		alignItems: "center",
		gap: AppSpacing.sm,
		borderWidth: 1,
		borderColor: "rgba(71, 85, 105, 0.24)",
		borderRadius: 8,
		backgroundColor: AppColors.background,
		padding: AppSpacing.md,
	},
	signatureButtonText: {
		flex: 1,
		minWidth: 0,
		gap: AppSpacing.xs,
	},
	signatureOpenButton: {
		minHeight: 40,
		justifyContent: "center",
		backgroundColor: AppColors.primary,
		paddingHorizontal: AppSpacing.md,
	},
	contractSignaturePreview: {
		width: "100%",
		gap: AppSpacing.sm,
		borderWidth: 1,
		borderColor: "rgba(0, 75, 147, 0.24)",
		borderRadius: 8,
		backgroundColor: "#F8FBFF",
		padding: AppSpacing.md,
	},
	previewRow: {
		minHeight: 56,
		flexDirection: "row",
		alignItems: "flex-end",
		gap: AppSpacing.sm,
	},
	previewLabel: {
		flex: 1,
		minWidth: 0,
	},
	previewSignSlot: {
		position: "relative",
		width: 132,
		height: 44,
		borderBottomWidth: 1,
		borderBottomColor: AppColors.text,
	},
	previewSignatureImage: {
		position: "absolute",
		right: 0,
		bottom: -6,
		width: 132,
		height: 54,
	},
	modalLayer: {
		flex: 1,
		justifyContent: "flex-end",
		backgroundColor: "rgba(17, 24, 39, 0.42)",
	},
	modalPanel: {
		width: "100%",
		gap: AppSpacing.md,
		borderTopLeftRadius: 12,
		borderTopRightRadius: 12,
		backgroundColor: AppColors.background,
		padding: AppSpacing.md,
		paddingBottom: AppSpacing.xl,
	},
	modalHeader: {
		minHeight: 52,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: AppSpacing.sm,
	},
	modalHeaderText: {
		flex: 1,
		minWidth: 0,
		gap: 2,
	},
	modalCloseButton: {
		minHeight: 38,
		justifyContent: "center",
		borderWidth: 1,
		borderColor: AppColors.primary,
		backgroundColor: AppColors.background,
		paddingHorizontal: AppSpacing.md,
	},
	signatureFrame: {
		width: "100%",
		height: 320,
		borderWidth: 1,
		borderColor: "rgba(71, 85, 105, 0.36)",
		borderRadius: 8,
		overflow: "hidden",
		backgroundColor: AppColors.background,
	},
	signatureCanvas: {
		flex: 1,
	},
	modalActions: {
		flexDirection: "row",
		gap: AppSpacing.sm,
	},
	modalPrimaryButton: {
		flex: 1,
		minHeight: 50,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: AppColors.primary,
	},
	modalSecondaryButton: {
		flex: 1,
		minHeight: 50,
		alignItems: "center",
		justifyContent: "center",
		borderWidth: 1,
		borderColor: AppColors.primary,
		backgroundColor: AppColors.background,
	},
});
