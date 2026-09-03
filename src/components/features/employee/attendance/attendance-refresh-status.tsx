import { NetworkStateType, useNetworkState } from "expo-network";
import { useCallback } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { AppIcon } from "@/components/base/app-icon";
import { AppPressable } from "@/components/base/app-pressable";
import { AppText } from "@/components/base/app-text";
import { AppColors, AppSpacing } from "@/constants/theme";
import { koreaTimeZone } from "@/lib/korea-date";
import { useAttendanceStore } from "@/store/attendance-store";
import { useEmployeeManagementStore } from "@/store/employee-management-store";

const refreshedAtFormatter = new Intl.DateTimeFormat("en-CA", {
	timeZone: koreaTimeZone,
	month: "2-digit",
	day: "2-digit",
	hour: "2-digit",
	minute: "2-digit",
	hour12: false,
});

function getDatePart(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes) {
	return parts.find(part => part.type === type)?.value ?? "";
}

function formatRefreshedAt(isoDate: string | null) {
	if (!isoDate) {
		return "기록 없음";
	}

	const parts = refreshedAtFormatter.formatToParts(new Date(isoDate));
	return `${getDatePart(parts, "month")}.${getDatePart(parts, "day")} ${getDatePart(parts, "hour")}:${getDatePart(parts, "minute")}`;
}

export function AttendanceRefreshStatus() {
	const networkState = useNetworkState();
	const hydrateAttendance = useAttendanceStore(state => state.hydrateFromRemote);
	const attendanceSyncing = useAttendanceStore(state => state.syncing);
	const attendanceError = useAttendanceStore(state => state.syncErrorMessage);
	const lastHydratedAt = useAttendanceStore(state => state.lastHydratedAt);
	const hydrateEmployees = useEmployeeManagementStore(state => state.hydrateFromRemote);
	const employeeSyncing = useEmployeeManagementStore(state => state.syncing);
	const employeeError = useEmployeeManagementStore(state => state.syncErrorMessage);
	const refreshing = attendanceSyncing || employeeSyncing;
	const hasRefreshError = Boolean(attendanceError || employeeError);
	const offline =
		networkState.type === NetworkStateType.NONE ||
		networkState.isConnected === false ||
		networkState.isInternetReachable === false;
	const connectedToWifi = !offline && networkState.type === NetworkStateType.WIFI;
	const networkLabel = offline
		? "오프라인"
		: connectedToWifi
			? "Wi-Fi 연결"
			: networkState.type
				? "Wi-Fi 아님"
				: "연결 확인 중";
	const networkIcon = offline
		? "cloud-offline-outline"
		: connectedToWifi
			? "wifi"
			: "cellular-outline";
	const refreshedLabel = refreshing
		? "동기화 중"
		: hasRefreshError
			? `실패 · ${formatRefreshedAt(lastHydratedAt)}`
			: `동기화 ${formatRefreshedAt(lastHydratedAt)}`;

	const handleRefresh = useCallback(async () => {
		if (refreshing) {
			return;
		}

		await Promise.all([hydrateEmployees(), hydrateAttendance()]);
	}, [hydrateAttendance, hydrateEmployees, refreshing]);

	return (
		<View style={styles.container}>
			<View accessibilityLiveRegion="polite" style={styles.statusCopy}>
				<View style={styles.networkRow}>
					<AppIcon.Xs color={AppColors.textOnPrimary} name={networkIcon} pressable={false} />
					<AppText.Xs bold color={AppColors.textOnPrimary} numberOfLines={1} style={styles.statusText}>
						{networkLabel}
					</AppText.Xs>
				</View>
				<AppText.Xs
					color={hasRefreshError ? "#FECACA" : "rgba(255, 255, 255, 0.78)"}
					numberOfLines={1}
					style={styles.refreshedAt}
				>
					{refreshedLabel}
				</AppText.Xs>
			</View>

			<AppPressable
				accessibilityLabel="근무근태 최신 데이터 새로고침"
				accessibilityRole="button"
				accessibilityState={{ busy: refreshing, disabled: refreshing }}
				disabled={refreshing}
				onPress={() => void handleRefresh()}
				pressedColor="rgba(255, 255, 255, 0.18)"
				radius="base"
				style={[styles.refreshButton, refreshing && styles.refreshButtonDisabled]}
			>
				{refreshing ? (
					<ActivityIndicator color={AppColors.textOnPrimary} size="small" />
				) : (
					<AppIcon.Sm color={AppColors.textOnPrimary} name="refresh" pressable={false} />
				)}
				<AppText.Xs bold color={AppColors.textOnPrimary} numberOfLines={1}>
					새로고침
				</AppText.Xs>
			</AppPressable>
		</View>
	);
}

export default AttendanceRefreshStatus;

const styles = StyleSheet.create({
	container: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
	},
	statusCopy: {
		minWidth: 72,
		alignItems: "flex-end",
		gap: 0,
	},
	networkRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "flex-end",
		gap: 3,
	},
	statusText: {
		letterSpacing: -0.4,
	},
	refreshedAt: {
		letterSpacing: -0.4,
	},
	refreshButton: {
		minWidth: 70,
		height: 36,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 3,
		borderWidth: 1,
		borderColor: "rgba(255, 255, 255, 0.48)",
		backgroundColor: "rgba(255, 255, 255, 0.08)",
		paddingHorizontal: AppSpacing.xs,
	},
	refreshButtonDisabled: {
		opacity: 0.72,
	},
});
