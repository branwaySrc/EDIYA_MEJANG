import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import type { ReactNode } from "react";
import { useCallback, useMemo, useState } from "react";
import {
	Animated,
	Easing,
	type LayoutChangeEvent,
	Pressable,
	ScrollView,
	type ScrollViewProps,
	type StyleProp,
	StyleSheet,
	View,
	type ViewStyle,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { AppHeader } from "@/components/global/app-header";
import { type DrawerMenuId, NavigationDrawer } from "@/components/global/navigation-drawer";
import { appRoutes } from "@/constants/route";
import { AppColors } from "@/constants/theme";

const drawerWidth = 304;

export type AppLayoutProps = {
	activeDrawerId?: DrawerMenuId;
	aside?: ReactNode;
	children: ReactNode;
	contentContainerStyle?: StyleProp<ViewStyle>;
	contentSafeArea?: boolean;
	contentStyle?: StyleProp<ViewStyle>;
	drawerEnabled?: boolean;
	floatingSlot?: ReactNode;
	leadingMode?: "drawer" | "back";
	onDrawerSelect?: (id: DrawerMenuId) => void;
	onPressBack?: () => void;
	scrollViewProps?: Omit<ScrollViewProps, "children" | "contentContainerStyle" | "style">;
	title: string;
	topSlot?: ReactNode;
	type?: "view" | "scrollview";
};

export function AppLayout({
	activeDrawerId,
	aside,
	children,
	contentContainerStyle,
	contentSafeArea = true,
	contentStyle,
	drawerEnabled = true,
	floatingSlot,
	leadingMode = "drawer",
	onDrawerSelect,
	onPressBack,
	scrollViewProps,
	title,
	topSlot,
	type = "view",
}: AppLayoutProps) {
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const [drawerOpen, setDrawerOpen] = useState(false);
	const [internalDrawerId, setInternalDrawerId] = useState<DrawerMenuId>("menu-search");
	const [drawerProgress] = useState(() => new Animated.Value(0));
	const [headerHeight, setHeaderHeight] = useState(0);

	const selectedDrawerId = activeDrawerId ?? internalDrawerId;
	const bottomSafeStyle = contentSafeArea && insets.bottom > 0 ? { paddingBottom: insets.bottom } : null;

	const openDrawer = useCallback(() => {
		if (!drawerEnabled) {
			return;
		}

		setDrawerOpen(true);
		Animated.timing(drawerProgress, {
			duration: 220,
			easing: Easing.out(Easing.cubic),
			toValue: 1,
			useNativeDriver: true,
		}).start();
	}, [drawerEnabled, drawerProgress]);

	const closeDrawer = useCallback(() => {
		Animated.timing(drawerProgress, {
			duration: 180,
			easing: Easing.in(Easing.cubic),
			toValue: 0,
			useNativeDriver: true,
		}).start(({ finished }) => {
			if (finished) {
				setDrawerOpen(false);
			}
		});
	}, [drawerProgress]);

	const toggleDrawer = useCallback(() => {
		if (drawerOpen) {
			closeDrawer();
			return;
		}

		openDrawer();
	}, [closeDrawer, drawerOpen, openDrawer]);

	const drawerTranslateX = useMemo(
		() =>
			drawerProgress.interpolate({
				inputRange: [0, 1],
				outputRange: [-drawerWidth, 0],
			}),
		[drawerProgress],
	);
	const backdropOpacity = useMemo(
		() =>
			drawerProgress.interpolate({
				inputRange: [0, 1],
				outputRange: [0, 0.3],
			}),
		[drawerProgress],
	);
	const handleHeaderLayout = useCallback((event: LayoutChangeEvent) => {
		setHeaderHeight(event.nativeEvent.layout.height);
	}, []);
	const handleDrawerSelect = useCallback(
		(id: DrawerMenuId) => {
			if (id === selectedDrawerId) {
				closeDrawer();
				return;
			}

			setInternalDrawerId(id);
			onDrawerSelect?.(id);
			closeDrawer();
			router.replace(appRoutes[id].path);
		},
		[closeDrawer, onDrawerSelect, router, selectedDrawerId],
	);

	return (
		<View style={styles.container}>
			<StatusBar style="light" />
			<AppHeader
				aside={aside}
				drawerOpen={drawerOpen}
				drawerProgress={drawerProgress}
				leadingMode={drawerEnabled ? leadingMode : "back"}
				onLayout={handleHeaderLayout}
				onPressBack={onPressBack}
				onToggleDrawer={toggleDrawer}
				title={title}
			/>
			{topSlot}

			{type === "scrollview" ? (
				<ScrollView {...scrollViewProps} style={[styles.content, contentStyle]} contentContainerStyle={[bottomSafeStyle, contentContainerStyle]}>
					{children}
				</ScrollView>
			) : (
				<View style={[styles.content, bottomSafeStyle, contentStyle, contentContainerStyle]}>{children}</View>
			)}

			{floatingSlot && <View style={styles.floatingSlot}>{floatingSlot}</View>}

			{drawerEnabled && drawerOpen && (
				<View style={[styles.drawerLayer, { top: headerHeight }]}>
					<Animated.View style={[styles.drawerBackdrop, { opacity: backdropOpacity }]}>
						<Pressable accessibilityLabel="메뉴 닫기" onPress={closeDrawer} style={styles.drawerBackdropPressable} />
					</Animated.View>

					<Animated.View style={[styles.drawerPanelFrame, { transform: [{ translateX: drawerTranslateX }] }]}>
						<SafeAreaView style={styles.drawerPanel} edges={["bottom", "left"]}>
							<NavigationDrawer activeId={selectedDrawerId} onSelect={handleDrawerSelect} />
						</SafeAreaView>
					</Animated.View>
				</View>
			)}
		</View>
	);
}

export default AppLayout;

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: AppColors.background,
	},
	content: {
		flex: 1,
		backgroundColor: AppColors.background,
	},
	floatingSlot: {
		position: "absolute",
		right: 30,
		bottom: 64,
		zIndex: 99,
	},
	drawerLayer: {
		position: "absolute",
		right: 0,
		bottom: 0,
		left: 0,
		flexDirection: "row",
		zIndex: 10,
	},
	drawerBackdrop: {
		position: "absolute",
		top: 0,
		right: 0,
		bottom: 0,
		left: 0,
		backgroundColor: AppColors.text,
	},
	drawerBackdropPressable: {
		flex: 1,
	},
	drawerPanelFrame: {
		width: drawerWidth,
		maxWidth: "86%",
		shadowColor: AppColors.text,
		shadowOffset: { width: 4, height: 0 },
		shadowOpacity: 0.12,
		shadowRadius: 12,
	},
	drawerPanel: {
		flex: 1,
		backgroundColor: AppColors.background,
	},
});
