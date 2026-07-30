import { type Href, useRouter } from "expo-router";
import { memo, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";

import { AppText } from "@/components/base/app-text";
import { HiringScreenActions } from "@/components/features/sajang/hiring/hiring-screen-actions";
import { createHiringContractPages } from "@/components/features/sajang/hiring/hiring-contract-template";
import { useActiveRoute } from "@/components/global/use-active-route";
import { AppColors, AppSpacing } from "@/constants/theme";
import { useHiringContractStore } from "@/store/hiring-contract-store";

export const HiringContractPreview = memo(function HiringContractPreview() {
	const router = useRouter();
	const routeActive = useActiveRoute();
	const draft = useHiringContractStore(state => state.draft);
	const pages = useMemo(() => createHiringContractPages(draft), [draft]);
	const [pageIndex, setPageIndex] = useState(0);
	const currentPage = pages[pageIndex];
	const isLastPage = pageIndex === pages.length - 1;

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<AppText.Sm bold color={AppColors.primary}>
					{currentPage.title}
				</AppText.Sm>
				<AppText.Xs color={AppColors.sub}>
					{pageIndex + 1} / {pages.length}
				</AppText.Xs>
			</View>

			<View style={styles.previewFrame}>
				{routeActive && (
					<WebView
						originWhitelist={["*"]}
						source={{ html: currentPage.html }}
						style={styles.webView}
						showsVerticalScrollIndicator={false}
						setSupportMultipleWindows={false}
					/>
				)}
			</View>

			<HiringScreenActions
				primaryLabel={isLastPage ? "요약 확인" : "다음페이지"}
				onPressPrimary={() => {
					if (isLastPage) {
						router.push("/sajang/hiring/summary" as Href);
						return;
					}

					setPageIndex(index => Math.min(index + 1, pages.length - 1));
				}}
				onPressSecondary={() => {
					if (pageIndex === 0) {
						router.back();
						return;
					}

					setPageIndex(index => Math.max(index - 1, 0));
				}}
				secondaryLabel={pageIndex === 0 ? "이전" : "이전페이지"}
			/>
		</View>
	);
});

export default HiringContractPreview;

const styles = StyleSheet.create({
	container: {
		width: "100%",
		gap: AppSpacing.md,
		padding: AppSpacing.md,
		paddingBottom: AppSpacing.xl,
	},
	header: {
		minHeight: 38,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		borderRadius: 4,
		backgroundColor: "rgba(71, 85, 105, 0.1)",
		paddingHorizontal: AppSpacing.sm,
	},
	previewFrame: {
		width: "100%",
		height: 540,
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
