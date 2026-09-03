import { memo, useCallback, useDeferredValue, useMemo, useState } from "react";
import {
	FlatList,
	Keyboard,
	Platform,
	StyleSheet,
	View,
	type ListRenderItemInfo,
} from "react-native";

import { AppPressable } from "@/components/base/app-pressable";
import { AppText } from "@/components/base/app-text";
import { useAttendanceEmployees } from "@/components/features/employee/attendance/use-attendance-employees";
import { SearchBox } from "@/components/ui/search/search-box";
import { AppColors, AppSpacing } from "@/constants/theme";
import type {
	AttendanceLogAction,
	AttendanceLogRecord,
	AttendanceRecord,
} from "@/database/employee/attendance.type";
import type { Employee, EmployeeShiftGroup } from "@/database/employee/employee.type";
import { koreaTimeZone } from "@/lib/korea-date";
import { useAttendanceStore } from "@/store/attendance-store";

const logColors = {
	border: "#E2E8F0",
	cancel: "#B42318",
	highlight: "#FEF08A",
	highlightText: "#422006",
	register: AppColors.primary,
	surface: "#F8FAFC",
} as const;

const logDateTimeFormatter = new Intl.DateTimeFormat("en-CA", {
	timeZone: koreaTimeZone,
	year: "numeric",
	month: "2-digit",
	day: "2-digit",
	hour: "2-digit",
	minute: "2-digit",
	second: "2-digit",
	hour12: false,
});

const logDateFormatter = new Intl.DateTimeFormat("en-CA", {
	timeZone: koreaTimeZone,
	year: "numeric",
	month: "2-digit",
	day: "2-digit",
});

type LogSearchMode = "substitute" | "date" | "name";
type ActionTone = "cancel" | "neutral" | "register";

type AttendanceLogItem = {
	actionKind: "대타 출석" | "출석";
	actionTone: ActionTone;
	createdDate: string;
	createdLabel: string;
	employeeName: string;
	id: string;
	isSubstitute: boolean;
	position: EmployeeShiftGroup | "미정";
	scheduledEmployeeName: string;
	scheduledEnd: string;
	scheduledStart: string;
	verb: "등록" | "수정" | "취소" | "확인";
	workDate: string;
};

const searchModes: { id: LogSearchMode; label: string }[] = [
	{ id: "substitute", label: "대타" },
	{ id: "date", label: "날짜" },
	{ id: "name", label: "이름" },
];

const searchPlaceholders: Record<LogSearchMode, string> = {
	substitute: "대타 근무자 이름 검색",
	date: "근무 날짜 검색 (예: 2026-07-27)",
	name: "직원 이름 검색",
};

const logPageSize = 30;

function getDatePart(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes) {
	return parts.find(part => part.type === type)?.value ?? "";
}

function formatLogDateTime(isoDate: string) {
	const parts = logDateTimeFormatter.formatToParts(new Date(isoDate));
	return `${getDatePart(parts, "year")}-${getDatePart(parts, "month")}-${getDatePart(parts, "day")} ${getDatePart(parts, "hour")}:${getDatePart(parts, "minute")}:${getDatePart(parts, "second")} KST`;
}

function formatLogDate(isoDate: string) {
	return logDateFormatter.format(new Date(isoDate));
}

function getActionPresentation(action: AttendanceLogAction) {
	switch (action) {
		case "substitute_register":
			return { actionKind: "대타 출석", actionTone: "register", isSubstitute: true, verb: "등록" } as const;
		case "substitute_cancel":
			return { actionKind: "대타 출석", actionTone: "cancel", isSubstitute: true, verb: "취소" } as const;
		case "attendance_cancel":
			return { actionKind: "출석", actionTone: "cancel", isSubstitute: false, verb: "취소" } as const;
		case "update":
			return { actionKind: "출석", actionTone: "neutral", isSubstitute: false, verb: "수정" } as const;
		case "confirm":
			return { actionKind: "출석", actionTone: "neutral", isSubstitute: false, verb: "확인" } as const;
		case "attendance_register":
		case "clock_in":
		default:
			return { actionKind: "출석", actionTone: "register", isSubstitute: false, verb: "등록" } as const;
	}
}

function normalizeDateSearch(value: string) {
	return value.replace(/\D/g, "");
}

function createLogItem(
	log: AttendanceLogRecord,
	attendanceById: Map<string, AttendanceRecord>,
	employeesById: Map<string, Employee>,
): AttendanceLogItem {
	const attendance = attendanceById.get(log.attendanceId);
	const employee = employeesById.get(log.employeeId);
	const scheduledEmployee = attendance
		? employeesById.get(attendance.employeeId)
		: undefined;
	const action = getActionPresentation(log.action);

	return {
		...action,
		id: log.id,
		createdDate: formatLogDate(log.createdAt),
		createdLabel: formatLogDateTime(log.createdAt),
		employeeName:
			log.temporaryWorkerName ??
			attendance?.temporaryWorkerName ??
			employee?.name ??
			"알 수 없는 직원",
		position: attendance?.shiftGroup ?? scheduledEmployee?.shiftGroup ?? "미정",
		scheduledEmployeeName: attendance?.isVacantSlot ? "비어있음" : scheduledEmployee?.name ?? "",
		scheduledEnd: attendance?.scheduledEnd ?? "",
		scheduledStart: attendance?.scheduledStart ?? "",
		workDate: attendance?.workDate ?? "",
	};
}

function getActionColor(tone: ActionTone) {
	if (tone === "register") {
		return logColors.register;
	}

	if (tone === "cancel") {
		return logColors.cancel;
	}

	return AppColors.sub;
}

const AttendanceLogRow = memo(function AttendanceLogRow({ item }: { item: AttendanceLogItem }) {
	const hasSchedule = Boolean(item.workDate && item.scheduledStart && item.scheduledEnd);
	const scheduleText = hasSchedule
		? `${item.workDate} ${item.scheduledStart}-${item.scheduledEnd} / `
		: item.workDate
			? `${item.workDate} / `
			: "근무 정보 없음 / ";

	return (
		<View style={styles.logEntry}>
			<AppText.Xs color={AppColors.sub} style={styles.timestamp}>
				{item.createdLabel}
			</AppText.Xs>

			<AppText.Sm style={styles.sentence}>
				<AppText.Sm bold style={styles.highlight}>
					&quot;{item.employeeName}&quot;
				</AppText.Sm>
				님이 [{scheduleText}
				<AppText.Sm bold style={styles.highlight}>
					{item.position}
				</AppText.Sm>
				]에{" "}
				<AppText.Sm bold style={styles.highlight}>
					{item.actionKind}
				</AppText.Sm>
				을{" "}
				<AppText.Sm bold color={getActionColor(item.actionTone)} style={styles.actionText}>
					&quot;{item.verb}&quot;
				</AppText.Sm>
				하였습니다.
			</AppText.Sm>
		</View>
	);
});

export function AttendanceLogView() {
	const employees = useAttendanceEmployees();
	const [keyword, setKeyword] = useState("");
	const [searchMode, setSearchMode] = useState<LogSearchMode>("name");
	const [visibleLogCount, setVisibleLogCount] = useState(logPageSize);
	const deferredKeyword = useDeferredValue(keyword);
	const records = useAttendanceStore(state => state.records);
	const storeLogs = useAttendanceStore(state => state.logs);
	const hasMoreRemoteLogs = useAttendanceStore(state => state.hasMoreRemoteLogs);
	const loadMoreLogs = useAttendanceStore(state => state.loadMoreLogs);
	const logsLoadingMore = useAttendanceStore(state => state.logsLoadingMore);
	const employeesById = useMemo(
		() => new Map(employees.map(employee => [employee.id, employee])),
		[employees],
	);
	const attendanceById = useMemo(
		() => new Map(records.map(record => [record.id, record])),
		[records],
	);
	const logItems = useMemo(
		() => storeLogs.map(log => createLogItem(log, attendanceById, employeesById)),
		[attendanceById, employeesById, storeLogs],
	);
	const filteredLogItems = useMemo(() => {
		const normalizedKeyword = deferredKeyword.trim().toLocaleLowerCase("ko-KR");

		if (searchMode === "substitute") {
			return logItems.filter(item => {
				if (!item.isSubstitute) {
					return false;
				}

				if (!normalizedKeyword) {
					return true;
				}

				return [item.employeeName, item.scheduledEmployeeName]
					.some(name => name.toLocaleLowerCase("ko-KR").includes(normalizedKeyword));
			});
		}

		if (!normalizedKeyword) {
			return logItems;
		}

		if (searchMode === "date") {
			const normalizedDate = normalizeDateSearch(normalizedKeyword);

			if (!normalizedDate) {
				return [];
			}

			return logItems.filter(item =>
				[normalizeDateSearch(item.workDate), normalizeDateSearch(item.createdDate)]
					.some(date => date.includes(normalizedDate)),
			);
		}

		return logItems.filter(item =>
			[item.employeeName, item.scheduledEmployeeName]
				.some(name => name.toLocaleLowerCase("ko-KR").includes(normalizedKeyword)),
		);
	}, [deferredKeyword, logItems, searchMode]);
	const isFiltering = searchMode === "substitute" || keyword.trim().length > 0;
	const visibleLogItems = useMemo(
		() => filteredLogItems.slice(0, visibleLogCount),
		[filteredLogItems, visibleLogCount],
	);
	const handleSearchModeChange = useCallback((nextMode: LogSearchMode) => {
		setSearchMode(nextMode);
		setKeyword("");
		setVisibleLogCount(logPageSize);
	}, []);
	const handleKeywordChange = useCallback((value: string) => {
		setKeyword(value);
		setVisibleLogCount(logPageSize);
	}, []);
	const handleEndReached = useCallback(() => {
		setVisibleLogCount(current => current + logPageSize);

		if (!isFiltering && hasMoreRemoteLogs && !logsLoadingMore) {
			void loadMoreLogs();
		}
	}, [hasMoreRemoteLogs, isFiltering, loadMoreLogs, logsLoadingMore]);
	const renderLogItem = useCallback(
		({ item }: ListRenderItemInfo<AttendanceLogItem>) => <AttendanceLogRow item={item} />,
		[],
	);

	return (
		<FlatList
			contentContainerStyle={styles.listContent}
			data={visibleLogItems}
			initialNumToRender={logPageSize}
			keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
			keyboardShouldPersistTaps="handled"
			keyExtractor={item => item.id}
			ListEmptyComponent={
				<View style={styles.emptyState}>
					<AppText.Base bold>검색 결과가 없습니다.</AppText.Base>
					<AppText.Sm color={AppColors.sub}>검색 범위나 검색어를 확인해 주세요.</AppText.Sm>
				</View>
			}
			ListHeaderComponent={
				<View style={styles.header}>
					<View accessibilityRole="tablist" style={styles.searchModeRow}>
						{searchModes.map(mode => {
							const isActive = mode.id === searchMode;

							return (
								<AppPressable
									key={mode.id}
									accessibilityRole="tab"
									accessibilityState={{ selected: isActive }}
									onPress={() => handleSearchModeChange(mode.id)}
									pressedColor="#E2E8F0"
									style={[styles.searchModeButton, isActive && styles.searchModeButtonActive]}
								>
									<AppText.Sm bold color={isActive ? AppColors.textOnPrimary : AppColors.sub}>
										{mode.label}
									</AppText.Sm>
								</AppPressable>
							);
						})}
					</View>

					<SearchBox
						accessibilityLabel={`${searchModes.find(mode => mode.id === searchMode)?.label ?? ""} 검색`}
						clearButtonMode="while-editing"
						onChangeText={handleKeywordChange}
						onSubmit={Keyboard.dismiss}
						placeholder={searchPlaceholders[searchMode]}
						showSubmitButton={false}
						value={keyword}
					/>

					<View style={styles.countRow}>
						<AppText.Base bold>전체 로그 {logItems.length}건</AppText.Base>
						{isFiltering ? (
							<AppText.Sm color={AppColors.sub}>표시 {filteredLogItems.length}건</AppText.Sm>
						) : null}
					</View>
				</View>
			}
			ListFooterComponent={
				logsLoadingMore ? (
					<View style={styles.footerState}>
						<AppText.Sm color={AppColors.sub}>로그를 불러오고 있습니다...</AppText.Sm>
					</View>
				) : filteredLogItems.length > visibleLogItems.length || (!isFiltering && hasMoreRemoteLogs) ? (
					<View style={styles.footerState}>
						<AppText.Sm color={AppColors.sub}>아래로 스크롤하면 로그를 더 불러옵니다.</AppText.Sm>
					</View>
				) : null
			}
			maxToRenderPerBatch={10}
			onEndReached={handleEndReached}
			onEndReachedThreshold={0.35}
			removeClippedSubviews={Platform.OS !== "web"}
			renderItem={renderLogItem}
			showsVerticalScrollIndicator={false}
			style={styles.container}
			updateCellsBatchingPeriod={50}
			windowSize={7}
		/>
	);
}

export default AttendanceLogView;

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: AppColors.background,
	},
	listContent: {
		width: "100%",
		maxWidth: 920,
		alignSelf: "center",
		paddingHorizontal: AppSpacing.md,
		paddingBottom: AppSpacing.xl,
	},
	header: {
		width: "100%",
		gap: AppSpacing.md,
		paddingTop: AppSpacing.md,
		paddingBottom: AppSpacing.sm,
	},
	searchModeRow: {
		width: "100%",
		minHeight: 40,
		flexDirection: "row",
		borderWidth: 1,
		borderColor: logColors.border,
		borderRadius: 4,
	},
	searchModeButton: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: AppColors.background,
	},
	searchModeButtonActive: {
		backgroundColor: AppColors.primary,
	},
	countRow: {
		minHeight: 32,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: AppSpacing.sm,
	},
	logEntry: {
		width: "100%",
		gap: AppSpacing.xs,
		borderTopWidth: 1,
		borderTopColor: logColors.border,
		paddingVertical: AppSpacing.md,
	},
	timestamp: {
		letterSpacing: 0,
		fontVariant: ["tabular-nums"],
	},
	sentence: {
		color: AppColors.text,
		letterSpacing: 0,
		fontVariant: ["tabular-nums"],
	},
	highlight: {
		color: logColors.highlightText,
		backgroundColor: logColors.highlight,
		letterSpacing: 0,
	},
	actionText: {
		letterSpacing: 0,
	},
	emptyState: {
		minHeight: 180,
		alignItems: "center",
		justifyContent: "center",
		gap: AppSpacing.xs,
		borderTopWidth: 1,
		borderTopColor: logColors.border,
		backgroundColor: logColors.surface,
		paddingHorizontal: AppSpacing.md,
	},
	footerState: {
		minHeight: 56,
		alignItems: "center",
		justifyContent: "center",
		borderTopWidth: 1,
		borderTopColor: logColors.border,
	},
});
