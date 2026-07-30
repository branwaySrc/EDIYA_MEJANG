import React, { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { StyleSheet, View } from "react-native";

import { AdminWebViewLoading } from "@/components/features/admin/admin-webview-loading";
import type { AdminWebViewProps, AdminWebViewRef } from "@/components/features/admin/admin-webview-types";

export const AdminWebView = forwardRef<AdminWebViewRef, AdminWebViewProps>(function AdminWebView({ onNavigationStateChange, title, uri }, ref) {
	const [reloadKey, setReloadKey] = useState(0);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		onNavigationStateChange?.({ canGoBack: false, canGoForward: false });
	}, [onNavigationStateChange]);

	useImperativeHandle(
		ref,
		() => ({
			goBack: () => {},
			goForward: () => {},
			reload: () => {
				setLoading(true);
				setReloadKey(key => key + 1);
			},
		}),
		[],
	);

	return (
		<View style={styles.container}>
			{React.createElement("iframe", {
				key: reloadKey,
				onLoad: () => setLoading(false),
				src: uri,
				title,
				style: {
					width: "100%",
					height: "100%",
					border: 0,
				},
			})}
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
});
