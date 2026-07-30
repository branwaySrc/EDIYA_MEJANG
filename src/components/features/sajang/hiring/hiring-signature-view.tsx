import { type Href, useRouter } from "expo-router";
import { memo, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import SignatureCanvas, { type SignatureViewRef } from "react-native-signature-canvas";

import { AppPressable } from "@/components/base/app-pressable";
import { AppText } from "@/components/base/app-text";
import { createAndSendHiringContractPdf } from "@/components/features/sajang/hiring/hiring-pdf-service";
import { HiringScreenActions } from "@/components/features/sajang/hiring/hiring-screen-actions";
import { AppColors, AppSpacing } from "@/constants/theme";
import { useHiringContractStore } from "@/store/hiring-contract-store";

const signatureWebStyle = `
	.m-signature-pad { box-shadow: none; border: 0; }
	.m-signature-pad--body { border: 0; }
	.m-signature-pad--footer { display: none; margin: 0; }
	body, html { width: 100%; height: 100%; }
`;

export const HiringSignatureView = memo(function HiringSignatureView() {
	const router = useRouter();
	const signatureRef = useRef<SignatureViewRef>(null);
	const draft = useHiringContractStore(state => state.draft);
	const setResult = useHiringContractStore(state => state.setResult);
	const [busy, setBusy] = useState(false);
	const [message, setMessage] = useState("서명 후 PDF 생성 및 이메일 보내기를 눌러 주세요.");

	const handleSignature = async (signatureImageDataUrl: string) => {
		try {
			setBusy(true);
			setMessage("PDF를 만들고 로컬 저장소에 저장하는 중입니다.");
			const result = await createAndSendHiringContractPdf(draft, signatureImageDataUrl);
			setResult(result);
			router.replace("/sajang/hiring/complete" as Href);
		} catch (error) {
			const nextMessage = error instanceof Error ? error.message : "계약서 처리 중 문제가 발생했습니다.";
			setMessage(nextMessage);
		} finally {
			setBusy(false);
		}
	};

	return (
		<View style={styles.container}>
			<View style={styles.noticeBox}>
				<AppText.Lg bold color={AppColors.primary}>
					직원 서명
				</AppText.Lg>
				<AppText.Sm color={AppColors.sub}>{message}</AppText.Sm>
			</View>

			<View style={styles.signatureFrame}>
				<SignatureCanvas
					ref={signatureRef}
					autoClear={false}
					backgroundColor={AppColors.background}
					clearText="다시 쓰기"
					confirmText="완료"
					descriptionText=""
					imageType="image/png"
					onEmpty={() => setMessage("서명이 비어있어요. 직원 서명을 먼저 입력해 주세요.")}
					onOK={handleSignature}
					penColor={AppColors.text}
					style={styles.signatureCanvas}
					trimWhitespace
					webStyle={signatureWebStyle}
				/>
			</View>

			<View style={styles.utilityRow}>
				<AppPressable
					disabled={busy}
					onPress={() => signatureRef.current?.clearSignature()}
					pressedColor="rgba(0, 75, 147, 0.08)"
					radius="base"
					style={styles.utilityButton}
				>
					<AppText.Base bold color={AppColors.primary}>
						다시 쓰기
					</AppText.Base>
				</AppPressable>
			</View>

			<HiringScreenActions
				primaryDisabled={busy}
				primaryLabel={busy ? "처리중" : "PDF 생성 및 이메일 보내기"}
				onPressPrimary={() => signatureRef.current?.readSignature()}
				onPressSecondary={() => router.back()}
				secondaryLabel="이전"
			/>
		</View>
	);
});

export default HiringSignatureView;

const styles = StyleSheet.create({
	container: {
		width: "100%",
		gap: AppSpacing.md,
		padding: AppSpacing.md,
		paddingBottom: AppSpacing.xl,
	},
	noticeBox: {
		gap: AppSpacing.xs,
		borderWidth: 1,
		borderColor: "rgba(0, 75, 147, 0.24)",
		borderRadius: 8,
		backgroundColor: "#F8FAFC",
		padding: AppSpacing.md,
	},
	signatureFrame: {
		width: "100%",
		height: 360,
		borderWidth: 1,
		borderColor: "rgba(71, 85, 105, 0.36)",
		borderRadius: 8,
		overflow: "hidden",
		backgroundColor: AppColors.background,
	},
	signatureCanvas: {
		flex: 1,
	},
	utilityRow: {
		alignItems: "flex-end",
	},
	utilityButton: {
		minHeight: 40,
		justifyContent: "center",
		borderWidth: 1,
		borderColor: AppColors.primary,
		backgroundColor: AppColors.background,
		paddingHorizontal: AppSpacing.md,
	},
});
