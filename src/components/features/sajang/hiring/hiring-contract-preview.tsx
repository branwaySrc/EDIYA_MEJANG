import { type Href, useRouter } from "expo-router";
import { memo, useCallback, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";

import { HiringField, HiringStepFrame } from "@/components/features/sajang/hiring/hiring-form-ui";
import { HiringScreenActions } from "@/components/features/sajang/hiring/hiring-screen-actions";
import { createHiringContractPages } from "@/components/features/sajang/hiring/hiring-contract-template";
import { type HiringDraft, isContractInfoReady } from "@/components/features/sajang/hiring/hiring-types";
import { useActiveRoute } from "@/components/global/use-active-route";
import { AppColors, AppSpacing } from "@/constants/theme";
import { useHiringContractStore } from "@/store/hiring-contract-store";

export const HiringContractPreview = memo(function HiringContractPreview() {
	const router = useRouter();
	const routeActive = useActiveRoute();
	const draft = useHiringContractStore(state => state.draft);
	const setField = useHiringContractStore(state => state.setField);
	const ready = useMemo(() => isContractInfoReady(draft), [draft]);
	const pages = useMemo(() => createHiringContractPages(draft), [draft]);
	const createChangeHandler = useCallback(
		<Key extends keyof HiringDraft>(key: Key) =>
			(value: HiringDraft[Key]) => {
				setField(key, value);
			},
		[setField],
	);

	return (
		<HiringStepFrame step={4} title="계약서 작성" subtitle="신규 직원 정보와 선택한 근무지가 계약서에 자동 연결됩니다.">
			<View style={styles.section}>
				<HiringField label="입사 예정일" value={draft.startDate} onChangeText={createChangeHandler("startDate")} placeholder="YYYY-MM-DD" />
				<HiringField multiline label="담당 업무 및 근무 조건" value={draft.workCondition} onChangeText={createChangeHandler("workCondition")} placeholder="근무 조건" />
				<HiringField multiline label="계약서 특약 메모" value={draft.contractMemo} onChangeText={createChangeHandler("contractMemo")} placeholder="계약서에 포함할 특약 또는 안내" />
			</View>

			<View style={styles.previewFrame}>
				{routeActive && (
					<WebView
						originWhitelist={["*"]}
						source={{ html: pages[0]?.html ?? "" }}
						style={styles.webView}
						showsVerticalScrollIndicator={false}
						setSupportMultipleWindows={false}
					/>
				)}
			</View>

			<HiringScreenActions
				primaryDisabled={!ready}
				primaryLabel="근로 시간 및 임금 작성"
				onPressPrimary={() => router.push("/sajang/hiring/work-terms" as Href)}
				onPressSecondary={() => router.back()}
				secondaryLabel="이전"
			/>
		</HiringStepFrame>
	);
});

export default HiringContractPreview;

const styles = StyleSheet.create({
	section: {
		width: "100%",
		gap: AppSpacing.sm,
	},
	previewFrame: {
		width: "100%",
		height: 420,
		borderWidth: 1,
		borderColor: "rgba(71, 85, 105, 0.28)",
		borderRadius: 8,
		overflow: "hidden",
		backgroundColor: AppColors.background,
	},
	webView: {
		flex: 1,
		backgroundColor: AppColors.background,
	},
});
