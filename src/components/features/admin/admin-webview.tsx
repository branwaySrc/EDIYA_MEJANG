import { forwardRef, useImperativeHandle, useRef, useState, type ComponentRef } from "react";
import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";

import { AdminWebViewLoading } from "@/components/features/admin/admin-webview-loading";
import type { AdminWebViewNavigationState, AdminWebViewProps, AdminWebViewRef } from "@/components/features/admin/admin-webview-types";

export const AdminWebView = forwardRef<AdminWebViewRef, AdminWebViewProps>(function AdminWebView(
	{ onNavigationStateChange, uri },
	ref,
) {
	const webViewRef = useRef<ComponentRef<typeof WebView>>(null);
	const [loading, setLoading] = useState(true);

	useImperativeHandle(
		ref,
		() => ({
			goBack: () => webViewRef.current?.goBack(),
			goForward: () => webViewRef.current?.goForward(),
			reload: () => webViewRef.current?.reload(),
		}),
		[],
	);

	return (
		<View style={styles.container}>
			<WebView
				ref={webViewRef}
				style={styles.webView}
				source={{ uri }}
				startInLoadingState
				javaScriptEnabled
				domStorageEnabled
				sharedCookiesEnabled
				thirdPartyCookiesEnabled
				onLoadStart={() => setLoading(true)}
				onLoadEnd={() => setLoading(false)}
				onNavigationStateChange={state => {
					const navigationState: AdminWebViewNavigationState = {
						canGoBack: state.canGoBack,
						canGoForward: state.canGoForward,
					};

					onNavigationStateChange?.(navigationState);
				}}
			/>
			{loading && <AdminWebViewLoading />}
		</View>
	);
});

export default AdminWebView;

const styles = StyleSheet.create({
	container: {
		flex: 1,
		position: "relative",
		backgroundColor: "#FFFFFF",
	},
	webView: {
		flex: 1,
		backgroundColor: "#FFFFFF",
	},
});
