import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Easing, Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppIcon } from "@/components/base/app-icon";
import { AppPressable } from "@/components/base/app-pressable";
import { AppText } from "@/components/base/app-text";
import { attendanceStatusLabels, shiftColors } from "@/components/features/employee/attendance/attendance-ui";
import { AppColors, AppSpacing } from "@/constants/theme";
import type { AttendanceScheduleEntry } from "@/database/employee/attendance.type";
import { sampleEmployees } from "@/database/employee/employee";
import {
	buildAttendanceGreeting,
	type AttendanceFeedbackPayload,
} from "@/lib/attendance-greeting";
import { formatKoreaDateLabel } from "@/lib/korea-date";
import { useAttendanceStore } from "@/store/attendance-store";

export type AttendanceDayPopupProps = {
	dateKey?: string | null;
	entries: AttendanceScheduleEntry[];
	monthEntries: AttendanceScheduleEntry[];
	onClose: () => void;
	onFeedback: (payload: AttendanceFeedbackPayload) => void;
	todayKey: string;
};

function getSubstituteCandidates(entry: AttendanceScheduleEntry, entries: AttendanceScheduleEntry[]) {
	const unavailableEmployeeIds = new Set(
		entries.flatMap(dayEntry => [
			dayEntry.employeeId,
			...(dayEntry.substituteEmployeeId ? [dayEntry.substituteEmployeeId] : []),
		]),
	);

	return sampleEmployees
		.filter(employee => employee.id !== entry.employeeId && !unavailableEmployeeIds.has(employee.id))
		.sort((left, right) => {
			const leftPriority = left.shiftGroup === entry.shiftGroup ? 0 : 1;
			const rightPriority = right.shiftGroup === entry.shiftGroup ? 0 : 1;
			return leftPriority - rightPriority || left.name.localeCompare(right.name, "ko");
		});
}

export function AttendanceDayPopup({
	dateKey,
	entries,
	monthEntries,
	onClose,
	onFeedback,
	todayKey,
}: AttendanceDayPopupProps) {
	const registerAttendance = useAttendanceStore(state => state.registerAttendance);
	const cancelAttendance = useAttendanceStore(state => state.cancelAttendance);
	const registerSubstitute = useAttendanceStore(state => state.registerSubstitute);
	const cancelSubstitute = useAttendanceStore(state => state.cancelSubstitute);
	const [selectingSubstituteForId, setSelectingSubstituteForId] = useState<string | null>(null);
	const [toastMessage, setToastMessage] = useState<string | null>(null);
	const [toastProgress] = useState(() => new Animated.Value(0));
	const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(
		() => () => {
			if (toastTimerRef.current) {
				clearTimeout(toastTimerRef.current);
			}
			toastProgress.stopAnimation();
		},
		[toastProgress],
	);

	const showToast = useCallback(
		(message: string) => {
			if (toastTimerRef.current) {
				clearTimeout(toastTimerRef.current);
			}

			toastProgress.stopAnimation();
			toastProgress.setValue(0);
			setToastMessage(message);
			Animated.timing(toastProgress, {
				duration: 180,
				easing: Easing.out(Easing.cubic),
				toValue: 1,
				useNativeDriver: true,
			}).start();

			toastTimerRef.current = setTimeout(() => {
				Animated.timing(toastProgress, {
					duration: 180,
					easing: Easing.in(Easing.cubic),
					toValue: 0,
					useNativeDriver: true,
				}).start(({ finished }) => {
					if (finished) {
						setToastMessage(null);
					}
				});
			}, 2200);
		},
		[toastProgress],
	);

	const handleClose = useCallback(() => {
		if (toastTimerRef.current) {
			clearTimeout(toastTimerRef.current);
			toastTimerRef.current = null;
		}
		toastProgress.stopAnimation();
		toastProgress.setValue(0);
		setToastMessage(null);
		setSelectingSubstituteForId(null);
		onClose();
	}, [onClose, toastProgress]);

	const handleAttendanceRegistration = useCallback(
		(entry: AttendanceScheduleEntry) => {
			if (entry.workDate > todayKey) {
				handleClose();
				onFeedback({
					employeeName: entry.employeeName,
					kind: "future-blocked",
				});
				return;
			}

			const greeting = buildAttendanceGreeting({ entry, monthEntries });
			registerAttendance(entry);
			handleClose();
			onFeedback(greeting);
		},
		[handleClose, monthEntries, onFeedback, registerAttendance, todayKey],
	);

	const handleSubstituteRegistration = useCallback(
		(entry: AttendanceScheduleEntry, substituteEmployee: { id: string; name: string }) => {
			if (entry.workDate > todayKey) {
				handleClose();
				onFeedback({
					employeeName: entry.employeeName,
					kind: "future-blocked",
				});
				return;
			}

			const greeting = buildAttendanceGreeting({
				entry,
				monthEntries,
				substituteEmployee,
			});
			registerSubstitute(entry, substituteEmployee.id);
			handleClose();
			onFeedback(greeting);
		},
		[handleClose, monthEntries, onFeedback, registerSubstitute, todayKey],
	);

	const handleSubstituteSelection = useCallback(
		(entry: AttendanceScheduleEntry) => {
			if (entry.workDate > todayKey) {
				handleClose();
				onFeedback({
					employeeName: entry.employeeName,
					kind: "future-blocked",
				});
				return;
			}

			setSelectingSubstituteForId(current => (current === entry.id ? null : entry.id));
		},
		[handleClose, onFeedback, todayKey],
	);

	return (
		<Modal
			animationType="fade"
			onRequestClose={handleClose}
			statusBarTranslucent
			transparent
			visible={Boolean(dateKey)}
		>
			<View style={styles.layer}>
				<Pressable accessibilityLabel="출근 명단 팝업 닫기" onPress={handleClose} style={styles.backdrop} />
				<SafeAreaView edges={["left", "right"]} style={styles.safeArea}>
					<View accessibilityViewIsModal style={styles.dialog}>
						<View style={styles.header}>
							<View style={styles.headerText}>
								<AppText.Lg bold>출근 명단</AppText.Lg>
								{dateKey && <AppText.Xs color={AppColors.sub}>{formatKoreaDateLabel(dateKey)}</AppText.Xs>}
							</View>
							<AppIcon.Base accessibilityLabel="팝업 닫기" name="close" onPress={handleClose} />
						</View>

						<ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
							{entries.length === 0 ? (
								<View style={styles.emptyState}>
									<AppText.Sm color={AppColors.sub}>등록된 근무 일정이 없습니다.</AppText.Sm>
								</View>
							) : (
								entries.map(entry => {
									const completed = entry.status === "completed";
									const hasSubstitute = Boolean(entry.substituteEmployeeId);
									const selectingSubstitute = selectingSubstituteForId === entry.id;
									const candidates = selectingSubstitute ? getSubstituteCandidates(entry, entries) : [];

									return (
										<View key={entry.id} style={styles.employeeRow}>
											<View style={styles.employeeSummary}>
												<View style={styles.employeeInfo}>
													<View style={styles.nameRow}>
														<View style={[styles.shiftMark, { backgroundColor: shiftColors[entry.shiftGroup] }]} />
														<AppText.Base
															bold
															numberOfLines={1}
															style={hasSubstitute ? styles.replacedEmployeeName : undefined}
														>
															{entry.employeeName}
														</AppText.Base>
														{entry.substituteEmployeeName && (
															<View style={styles.substituteBadge}>
																<AppText.Xs bold color={AppColors.textOnPrimary} numberOfLines={1}>
																	{entry.substituteEmployeeName}
																</AppText.Xs>
															</View>
														)}
													</View>
													<AppText.Xs color={AppColors.sub}>
														{entry.shiftGroup} · {entry.scheduledStart}–{entry.scheduledEnd}
													</AppText.Xs>
												</View>
												<View
													style={[
														styles.statusBadge,
														hasSubstitute
															? styles.substituteStatus
															: completed
																? styles.completedStatus
																: entry.status === "missed"
																	? styles.missedStatus
																	: styles.scheduledStatus,
													]}
												>
													<AppText.Xs
														bold={completed}
														color={completed ? AppColors.textOnPrimary : AppColors.sub}
													>
														{hasSubstitute ? "대타 완료" : attendanceStatusLabels[entry.status]}
													</AppText.Xs>
												</View>
											</View>

											<View style={styles.actionRow}>
												{completed ? (
													<AppPressable
														key={`cancel-${entry.id}`}
														accessibilityLabel={`${entry.employeeName} ${hasSubstitute ? "대타 출근" : "출근"} 취소하기`}
														accessibilityRole="button"
														border
														onPress={() => {
															if (hasSubstitute) {
																cancelSubstitute(entry);
																showToast("대타 출근이 취소되었습니다.");
															} else {
																cancelAttendance(entry);
																showToast("출근이 취소되었습니다.");
															}
															setSelectingSubstituteForId(null);
														}}
														radius="base"
														style={styles.cancelButton}
													>
														<AppText.Sm bold color="#B42318">
															취소하기
														</AppText.Sm>
													</AppPressable>
												) : (
													<>
														<AppPressable
															key={`attendance-${entry.id}`}
															accessibilityLabel={`${entry.employeeName} 출근 등록`}
															accessibilityRole="button"
															onPress={() => handleAttendanceRegistration(entry)}
															pressedColor="#003E7A"
															radius="base"
															style={styles.attendanceButton}
														>
															<AppText.Sm bold color={AppColors.textOnPrimary}>
																출근
															</AppText.Sm>
														</AppPressable>
														<AppPressable
															accessibilityLabel={`${entry.employeeName} 대타 선택`}
															accessibilityRole="button"
															border
															onPress={() => handleSubstituteSelection(entry)}
															radius="base"
															style={styles.substituteButton}
														>
															<AppText.Sm bold color="#B42318">
																대타
															</AppText.Sm>
														</AppPressable>
													</>
												)}
											</View>

											{selectingSubstitute && (
												<View style={styles.substitutePicker}>
													<AppText.Xs bold color={AppColors.sub}>
														대타 근무자 선택
													</AppText.Xs>
													<View style={styles.candidateGrid}>
														{candidates.length === 0 ? (
															<AppText.Sm color={AppColors.sub}>
																선택 가능한 근무자가 없습니다.
															</AppText.Sm>
														) : (
															candidates.map(candidate => (
																<AppPressable
																	key={candidate.id}
																	accessibilityLabel={`${candidate.name} 대타 등록`}
																	accessibilityRole="button"
																	border
																	onPress={() =>
																		handleSubstituteRegistration(entry, candidate)
																	}
																	radius="base"
																	style={styles.candidateButton}
																>
																	<AppText.Sm bold numberOfLines={1}>
																		{candidate.name}
																	</AppText.Sm>
																	<AppText.Xs color={AppColors.sub}>{candidate.shiftGroup}</AppText.Xs>
																</AppPressable>
															))
														)}
													</View>
												</View>
											)}
										</View>
									);
								})
							)}
						</ScrollView>
					</View>
				</SafeAreaView>

				{toastMessage && (
					<View pointerEvents="none" style={styles.toastViewport}>
						<Animated.View
							accessibilityLiveRegion="polite"
							style={[
								styles.toast,
								{
									opacity: toastProgress,
									transform: [
										{
											translateY: toastProgress.interpolate({
												inputRange: [0, 1],
												outputRange: [18, 0],
											}),
										},
									],
								},
							]}
						>
							<View style={styles.toastIcon}>
								<AppIcon.Sm color={AppColors.textOnPrimary} name="checkmark-circle" pressable={false} />
							</View>
							<AppText.Sm bold color={AppColors.textOnPrimary} style={styles.toastText}>
								{toastMessage}
							</AppText.Sm>
						</Animated.View>
					</View>
				)}
			</View>
		</Modal>
	);
}

export default AttendanceDayPopup;

const styles = StyleSheet.create({
	layer: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "rgba(0, 0, 0, 0.34)",
		padding: AppSpacing.md,
	},
	backdrop: {
		position: "absolute",
		top: 0,
		right: 0,
		bottom: 0,
		left: 0,
	},
	safeArea: {
		width: "100%",
		maxWidth: 480,
		maxHeight: "84%",
	},
	dialog: {
		width: "100%",
		maxHeight: "100%",
		borderRadius: 8,
		backgroundColor: AppColors.background,
		overflow: "hidden",
	},
	header: {
		minHeight: 76,
		flexDirection: "row",
		alignItems: "center",
		gap: AppSpacing.sm,
		borderBottomWidth: 1,
		borderBottomColor: "#E2E8F0",
		paddingHorizontal: AppSpacing.md,
		paddingVertical: AppSpacing.sm,
	},
	headerText: {
		flex: 1,
		minWidth: 0,
		gap: 2,
	},
	content: {
		paddingHorizontal: AppSpacing.md,
		paddingBottom: AppSpacing.md,
	},
	emptyState: {
		minHeight: 132,
		alignItems: "center",
		justifyContent: "center",
	},
	employeeRow: {
		width: "100%",
		gap: AppSpacing.sm,
		borderBottomWidth: 1,
		borderBottomColor: "#E2E8F0",
		paddingVertical: AppSpacing.md,
	},
	employeeSummary: {
		flexDirection: "row",
		alignItems: "center",
		gap: AppSpacing.sm,
	},
	employeeInfo: {
		flex: 1,
		minWidth: 0,
		gap: 2,
	},
	nameRow: {
		flexDirection: "row",
		alignItems: "center",
		flexWrap: "wrap",
		gap: AppSpacing.xs,
	},
	shiftMark: {
		width: 4,
		height: 24,
		borderRadius: 2,
	},
	replacedEmployeeName: {
		color: AppColors.sub,
		textDecorationLine: "line-through",
	},
	substituteBadge: {
		maxWidth: 112,
		minHeight: 24,
		alignItems: "center",
		justifyContent: "center",
		borderRadius: 4,
		backgroundColor: "#C2413B",
		paddingHorizontal: AppSpacing.xs,
	},
	statusBadge: {
		minWidth: 52,
		minHeight: 26,
		alignItems: "center",
		justifyContent: "center",
		borderRadius: 4,
		paddingHorizontal: AppSpacing.xs,
	},
	scheduledStatus: {
		backgroundColor: "rgba(0, 75, 147, 0.1)",
	},
	completedStatus: {
		backgroundColor: AppColors.primary,
	},
	substituteStatus: {
		backgroundColor: "#C2413B",
	},
	missedStatus: {
		borderWidth: 1,
		borderColor: "rgba(71, 85, 105, 0.28)",
		backgroundColor: "rgba(71, 85, 105, 0.08)",
	},
	actionRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "flex-end",
		gap: AppSpacing.sm,
	},
	attendanceButton: {
		minWidth: 76,
		minHeight: 36,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: AppColors.primary,
		paddingHorizontal: AppSpacing.md,
	},
	substituteButton: {
		minWidth: 76,
		minHeight: 36,
		alignItems: "center",
		justifyContent: "center",
		borderColor: "rgba(180, 35, 24, 0.4)",
		backgroundColor: AppColors.background,
		paddingHorizontal: AppSpacing.md,
	},
	cancelButton: {
		minWidth: 104,
		minHeight: 36,
		alignItems: "center",
		justifyContent: "center",
		borderColor: "rgba(180, 35, 24, 0.4)",
		backgroundColor: "#FFF7F6",
		paddingHorizontal: AppSpacing.md,
	},
	substitutePicker: {
		gap: AppSpacing.sm,
		borderTopWidth: 1,
		borderTopColor: "#E2E8F0",
		backgroundColor: "#F8FAFC",
		padding: AppSpacing.sm,
	},
	candidateGrid: {
		flexDirection: "row",
		flexWrap: "wrap",
		justifyContent: "space-between",
		rowGap: AppSpacing.xs,
	},
	candidateButton: {
		width: "48.5%",
		minHeight: 48,
		justifyContent: "center",
		borderColor: "#CBD5E1",
		backgroundColor: AppColors.background,
		paddingHorizontal: AppSpacing.sm,
	},
	toastViewport: {
		position: "absolute",
		right: 0,
		bottom: AppSpacing.xl,
		left: 0,
		width: "100%",
		alignItems: "center",
		paddingHorizontal: AppSpacing.md,
		zIndex: 30,
	},
	toast: {
		width: "100%",
		minHeight: 48,
		maxWidth: 480,
		alignItems: "center",
		justifyContent: "center",
		borderRadius: 4,
		backgroundColor: "#166534",
		paddingHorizontal: AppSpacing.md,
	},
	toastIcon: {
		position: "absolute",
		left: AppSpacing.md,
		alignItems: "center",
		justifyContent: "center",
	},
	toastText: {
		width: "100%",
		paddingHorizontal: AppSpacing.lg,
		textAlign: "center",
		letterSpacing: 0,
	},
});
