import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

import { AppIcon } from "@/components/base/app-icon";
import { AdminCredentialSheet, adminCredentialSheetHeight } from "@/components/features/admin/admin-credential-sheet";
import { AdminTabMenu } from "@/components/features/admin/admin-tab-menu";
import { AdminWebView } from "@/components/features/admin/admin-webview";
import { AdminWebViewControls } from "@/components/features/admin/admin-webview-controls";
import type { AdminWebViewNavigationState, AdminWebViewRef } from "@/components/features/admin/admin-webview-types";
import { AppLayout } from "@/components/global/app-layout";
import { useActiveRoute } from "@/components/global/use-active-route";
import { AppColors } from "@/constants/theme";
import { deliverySites } from "@/database/delivery/delivery-site";
import type { DeliverySiteId } from "@/database/delivery/delivery-site.type";

const initialNavigationState: AdminWebViewNavigationState = {
	canGoBack: false,
	canGoForward: false,
};

export function AdminPage() {
	const webViewRef = useRef<AdminWebViewRef>(null);
	const routeActive = useActiveRoute();
	const [activeSiteId, setActiveSiteId] = useState<DeliverySiteId>("baemin");
	const [credentialOpen, setCredentialOpen] = useState(false);
	const [credentialProgress] = useState(() => new Animated.Value(0));
	const [navigationState, setNavigationState] = useState<AdminWebViewNavigationState>(initialNavigationState);
	const activeSite = deliverySites[activeSiteId];

	useEffect(() => {
		Animated.timing(credentialProgress, {
			duration: 220,
			easing: Easing.out(Easing.cubic),
			toValue: credentialOpen ? 1 : 0,
			useNativeDriver: false,
		}).start();
	}, [credentialOpen, credentialProgress]);

	const handleSiteChange = useCallback(
		(siteId: DeliverySiteId) => {
			if (siteId === activeSiteId) {
				return;
			}

			setCredentialOpen(false);
			setNavigationState(initialNavigationState);
			setActiveSiteId(siteId);
		},
		[activeSiteId],
	);
	const webViewBottomInset = useMemo(
		() =>
			credentialProgress.interpolate({
				inputRange: [0, 1],
				outputRange: [0, adminCredentialSheetHeight],
			}),
		[credentialProgress],
	);
	const sheetTranslateY = useMemo(
		() =>
			credentialProgress.interpolate({
				inputRange: [0, 1],
				outputRange: [adminCredentialSheetHeight, 0],
			}),
		[credentialProgress],
	);
	const sheetOpacity = useMemo(
		() =>
			credentialProgress.interpolate({
				inputRange: [0, 1],
				outputRange: [0, 1],
			}),
		[credentialProgress],
	);

	return (
		<AppLayout
			activeDrawerId="delivery-order-admin"
			contentSafeArea={false}
			title={activeSite.title}
			type="view"
			aside={
				<>
					<AppIcon.Base
						accessibilityLabel={credentialOpen ? "계정 정보 닫기" : "계정 정보 열기"}
						color={AppColors.textOnPrimary}
						name={credentialOpen ? "key" : "key-outline"}
						onPress={() => setCredentialOpen(open => !open)}
						pressedColor="rgba(255, 255, 255, 0.14)"
					/>
					<AppIcon.Base
						accessibilityLabel="웹뷰 새로고침"
						color={AppColors.textOnPrimary}
						name="refresh"
						onPress={() => webViewRef.current?.reload()}
						pressedColor="rgba(255, 255, 255, 0.14)"
					/>
				</>
			}
			contentStyle={styles.content}
			topSlot={
				<View>
					<AdminTabMenu activeId={activeSiteId} onChange={handleSiteChange} />
					<AdminWebViewControls
						canGoBack={navigationState.canGoBack}
						canGoForward={navigationState.canGoForward}
						onGoBack={() => webViewRef.current?.goBack()}
						onGoForward={() => webViewRef.current?.goForward()}
					/>
				</View>
			}
		>
			<View style={styles.webViewArea}>
				<Animated.View style={[styles.webViewFrame, { paddingBottom: webViewBottomInset }]}>
					{routeActive && (
						<AdminWebView
							key={activeSite.id}
							ref={webViewRef}
							title={activeSite.title}
							uri={activeSite.uri}
							onNavigationStateChange={setNavigationState}
						/>
					)}
				</Animated.View>
				<Animated.View
					pointerEvents={credentialOpen ? "auto" : "none"}
					style={[styles.credentialSheet, { opacity: sheetOpacity, transform: [{ translateY: sheetTranslateY }] }]}
				>
					<AdminCredentialSheet title={activeSite.title} credential={activeSite.credential} />
				</Animated.View>
			</View>
		</AppLayout>
	);
}

export default AdminPage;

const styles = StyleSheet.create({
	content: {
		flex: 1,
	},
	webViewArea: {
		flex: 1,
		position: "relative",
		backgroundColor: AppColors.background,
	},
	webViewFrame: {
		flex: 1,
		backgroundColor: AppColors.background,
	},
	credentialSheet: {
		position: "absolute",
		right: 0,
		bottom: 0,
		left: 0,
	},
});
