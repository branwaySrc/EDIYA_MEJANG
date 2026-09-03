import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppIcon } from "@/components/base/app-icon";
import { AppPressable } from "@/components/base/app-pressable";
import { AppText } from "@/components/base/app-text";
import { attendanceStatusLabels, formatMinutesAsNumericHours, shiftColors } from "@/components/features/employee/attendance/attendance-ui";
import { AttendanceDurationPicker } from "@/components/features/employee/attendance/calendar/attendance-duration-picker";
import { useAttendanceEmployees } from "@/components/features/employee/attendance/use-attendance-employees";
import { AppColors, AppFonts, AppSpacing } from "@/constants/theme";
import type { AttendanceScheduleEntry } from "@/database/employee/attendance.type";
import { employeeShiftGroups } from "@/database/employee/employee";
import type { Employee } from "@/database/employee/employee.type";
import { buildAttendanceGreeting, type AttendanceFeedbackPayload } from "@/lib/attendance-greeting";
import { formatKoreaDateLabel } from "@/lib/korea-date";
import { useAttendanceStore } from "@/store/attendance-store";

export type AttendanceDayPopupProps = {
	allowTemporaryWorker?: boolean;
	dateKey?: string | null;
	entries: AttendanceScheduleEntry[];
	monthEntries: AttendanceScheduleEntry[];
	onClose: () => void;
	onFeedback: (payload: AttendanceFeedbackPayload) => void;
	onRegisterTemporaryWorker?: (payload: TemporaryWorkerRegistrationPayload) => void;
	todayKey: string;
};

export type TemporaryWorkerRegistrationPayload = {
	confirmedWorkMinutes: number;
	entry: AttendanceScheduleEntry;
	hourlyWage: number;
	name: string;
	phone: string;
};

type TemporaryWorkerDraft = {
	hourlyWage: string;
	name: string;
	phone: string;
};

type PendingRegistration =
	| {
			entry: AttendanceScheduleEntry;
			mode: "attendance";
	  }
	| {
			entry: AttendanceScheduleEntry;
			mode: "substitute";
			substituteEmployee: Employee;
	  }
	| {
			entry: AttendanceScheduleEntry;
			mode: "temporary";
			temporaryWorker: TemporaryWorkerDraft;
	  };

const emptyTemporaryWorkerDraft: TemporaryWorkerDraft = {
	hourlyWage: "",
	name: "",
	phone: "",
};

const vacantShiftIds = {
	오픈: "open",
	미들: "middle",
	마감: "close",
} as const;

const shiftBadgeBackgroundColors: Record<AttendanceScheduleEntry["shiftGroup"], string> = {
	오픈: "#E8F2FC",
	미들: "#E7F5F3",
	마감: "#F1F5F9",
};

const vacantTextColor = "#64748B";

function createVacantEntry(dateKey: string, shiftGroup: AttendanceScheduleEntry["shiftGroup"], todayKey: string): AttendanceScheduleEntry {
	return {
		id: `vacant-${dateKey}-${vacantShiftIds[shiftGroup]}`,
		employeeId: "",
		employeeName: "비어있음",
		isVacantSlot: true,
		scheduledEnd: "",
		scheduledMinutes: 0,
		scheduledStart: "",
		shiftGroup,
		status: dateKey < todayKey ? "missed" : "scheduled",
		updatedAt: `${dateKey}T00:00:00.000Z`,
		updatedByEmployeeId: "",
		workDate: dateKey,
	};
}

function getEmployeeContractMinutes(employee: Employee) {
	const duration = employee.workEndMinutes - employee.workStartMinutes;

	return duration > 0 ? duration : 24 * 60 + duration;
}

function getSubstituteCandidates(entry: AttendanceScheduleEntry, entries: AttendanceScheduleEntry[], employees: Employee[]) {
	const unavailableEmployeeIds = new Set(
		entries.flatMap(dayEntry => [dayEntry.employeeId, ...(dayEntry.substituteEmployeeId ? [dayEntry.substituteEmployeeId] : [])]),
	);

	return employees
		.filter(employee => employee.terminatedAt === null && employee.id !== entry.employeeId && !unavailableEmployeeIds.has(employee.id))
		.sort((left, right) => {
			const leftPriority = left.shiftGroup === entry.shiftGroup ? 0 : 1;
			const rightPriority = right.shiftGroup === entry.shiftGroup ? 0 : 1;
			return leftPriority - rightPriority || left.name.localeCompare(right.name, "ko");
		});
}

export function AttendanceDayPopup({
	allowTemporaryWorker = false,
	dateKey,
	entries,
	monthEntries,
	onClose,
	onFeedback,
	onRegisterTemporaryWorker,
	todayKey,
}: AttendanceDayPopupProps) {
	const employees = useAttendanceEmployees();
	const registerAttendance = useAttendanceStore(state => state.registerAttendance);
	const cancelAttendance = useAttendanceStore(state => state.cancelAttendance);
	const registerSubstitute = useAttendanceStore(state => state.registerSubstitute);
	const cancelSubstitute = useAttendanceStore(state => state.cancelSubstitute);
	const [selectingSubstituteForId, setSelectingSubstituteForId] = useState<string | null>(null);
	const [temporaryWorkerFormForId, setTemporaryWorkerFormForId] = useState<string | null>(null);
	const [temporaryWorkerDraft, setTemporaryWorkerDraft] = useState<TemporaryWorkerDraft>(emptyTemporaryWorkerDraft);
	const [pendingRegistration, setPendingRegistration] = useState<PendingRegistration | null>(null);
	const [toastMessage, setToastMessage] = useState<string | null>(null);
	const [toastProgress] = useState(() => new Animated.Value(0));
	const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const displayEntries = useMemo(() => {
		if (!dateKey) {
			return [];
		}

		return employeeShiftGroups.flatMap(shiftGroup => {
			const shiftEntries = entries
				.filter(entry => entry.shiftGroup === shiftGroup)
				.sort((left, right) => left.scheduledStart.localeCompare(right.scheduledStart) || left.employeeName.localeCompare(right.employeeName, "ko"));

			return shiftEntries.length > 0 ? shiftEntries : [createVacantEntry(dateKey, shiftGroup, todayKey)];
		});
	}, [dateKey, entries, todayKey]);

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
		setTemporaryWorkerFormForId(null);
		setTemporaryWorkerDraft(emptyTemporaryWorkerDraft);
		setPendingRegistration(null);
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

			setSelectingSubstituteForId(null);
			setPendingRegistration({
				entry,
				mode: "attendance",
			});
		},
		[handleClose, onFeedback, todayKey],
	);

	const handleSubstituteRegistration = useCallback(
		(entry: AttendanceScheduleEntry, substituteEmployee: Employee) => {
			if (entry.workDate > todayKey) {
				handleClose();
				onFeedback({
					employeeName: entry.employeeName,
					kind: "future-blocked",
				});
				return;
			}

			setPendingRegistration({
				entry: entry.isVacantSlot
					? {
							...entry,
							scheduledMinutes: getEmployeeContractMinutes(substituteEmployee),
						}
					: entry,
				mode: "substitute",
				substituteEmployee,
			});
		},
		[handleClose, onFeedback, todayKey],
	);

	const handleRegistrationConfirmation = useCallback(
		(confirmedWorkMinutes: number) => {
			if (!pendingRegistration) {
				return;
			}

			const { entry } = pendingRegistration;
			if (pendingRegistration.mode === "temporary") {
				const hourlyWage = Number(pendingRegistration.temporaryWorker.hourlyWage);

				if (!onRegisterTemporaryWorker) {
					setPendingRegistration(null);
					showToast("DB 연결이 완료되면 임시근로자를 저장할 수 있습니다.");
					return;
				}

				onRegisterTemporaryWorker({
					confirmedWorkMinutes,
					entry,
					hourlyWage,
					name: pendingRegistration.temporaryWorker.name.trim(),
					phone: pendingRegistration.temporaryWorker.phone,
				});
				handleClose();
				return;
			}

			const substituteEmployee = pendingRegistration.mode === "substitute" ? pendingRegistration.substituteEmployee : undefined;
			const greeting = buildAttendanceGreeting({
				entry,
				monthEntries,
				substituteEmployee,
			});

			if (substituteEmployee) {
				const substituteHourlyWage = substituteEmployee.hourlyWage;

				if (!Number.isFinite(substituteHourlyWage) || !substituteHourlyWage || substituteHourlyWage <= 0) {
					setPendingRegistration(null);
					showToast(`${substituteEmployee.name} 직원의 시급 정보를 먼저 등록해 주세요.`);
					return;
				}

				void registerSubstitute(entry, substituteEmployee.id, confirmedWorkMinutes, substituteHourlyWage);
			} else {
				registerAttendance(entry, confirmedWorkMinutes);
			}

			handleClose();
			onFeedback(greeting);
		},
		[handleClose, monthEntries, onFeedback, onRegisterTemporaryWorker, pendingRegistration, registerAttendance, registerSubstitute, showToast],
	);

	const handleTemporaryWorkerRegistration = useCallback(
		(entry: AttendanceScheduleEntry) => {
			const name = temporaryWorkerDraft.name.trim();
			const phone = temporaryWorkerDraft.phone.replace(/\D/g, "");
			const hourlyWage = Number(temporaryWorkerDraft.hourlyWage);

			if (!name) {
				showToast("임시근로자 이름을 입력해 주세요.");
				return;
			}

			if (phone.length < 10 || phone.length > 11) {
				showToast("연락처를 10~11자리 숫자로 입력해 주세요.");
				return;
			}

			if (!Number.isFinite(hourlyWage) || hourlyWage <= 0) {
				showToast("시급을 숫자로 입력해 주세요.");
				return;
			}

			setPendingRegistration({
				entry: entry.isVacantSlot && entry.scheduledMinutes === 0
					? { ...entry, scheduledMinutes: 4 * 60 }
					: entry,
				mode: "temporary",
				temporaryWorker: { hourlyWage: String(hourlyWage), name, phone },
			});
		},
		[showToast, temporaryWorkerDraft],
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
			setTemporaryWorkerFormForId(null);
			setTemporaryWorkerDraft(emptyTemporaryWorkerDraft);
		},
		[handleClose, onFeedback, todayKey],
	);

	return (
		<Modal animationType="fade" onRequestClose={handleClose} statusBarTranslucent transparent visible={Boolean(dateKey)}>
			<View style={styles.layer}>
				<Pressable accessibilityLabel="출근 명단 팝업 닫기" onPress={handleClose} style={styles.backdrop} />
				<SafeAreaView edges={["left", "right"]} style={styles.safeArea}>
					<View accessibilityViewIsModal style={styles.dialog}>
						<View style={styles.header}>
							<View style={styles.headerText}>
								<AppText.Lg bold>출근 명단</AppText.Lg>
								{dateKey && <AppText.Base color={AppColors.sub}>{formatKoreaDateLabel(dateKey)}</AppText.Base>}
							</View>
							<AppIcon.Base accessibilityLabel="팝업 닫기" name="close" onPress={handleClose} />
						</View>

						<ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
							{displayEntries.map(entry => {
								const completed = entry.status === "completed";
								const substituteName = entry.temporaryWorkerName ?? entry.substituteEmployeeName;
								const hasSubstitute = Boolean(entry.substituteEmployeeId || entry.temporaryWorkerId);
								const confirmedWorkMinutes = completed
									? hasSubstitute
										? (entry.substituteConfirmedWorkMinutes ?? entry.scheduledMinutes)
										: (entry.confirmedWorkMinutes ?? entry.scheduledMinutes)
									: null;
								const selectingSubstitute = selectingSubstituteForId === entry.id;
								const showingTemporaryWorkerForm = temporaryWorkerFormForId === entry.id;
								const candidates = selectingSubstitute ? getSubstituteCandidates(entry, entries, employees) : [];

								return (
									<View key={entry.id} style={styles.employeeRow}>
										<View style={styles.employeeSummary}>
											<View style={styles.employeeInfo}>
												<View style={[styles.shiftBadge, { backgroundColor: shiftBadgeBackgroundColors[entry.shiftGroup] }]}>
													<AppText.Xs bold color={shiftColors[entry.shiftGroup]}>
														{entry.shiftGroup}
													</AppText.Xs>
												</View>
												<View style={styles.nameRow}>
													<AppText.Base
														bold
														color={entry.isVacantSlot ? vacantTextColor : undefined}
														numberOfLines={1}
														style={hasSubstitute && !entry.isVacantSlot ? styles.replacedEmployeeName : undefined}
													>
														{entry.employeeName}
													</AppText.Base>
													{!hasSubstitute && confirmedWorkMinutes !== null && (
														<AppText.Base bold color={AppColors.primary}>
															({formatMinutesAsNumericHours(confirmedWorkMinutes)})
														</AppText.Base>
													)}
													{substituteName && (
														<View style={styles.substituteBadge}>
															<AppText.Xs bold color={AppColors.textOnPrimary} numberOfLines={1}>
																{substituteName}
																{confirmedWorkMinutes !== null ? ` (${formatMinutesAsNumericHours(confirmedWorkMinutes)})` : ""}
															</AppText.Xs>
														</View>
													)}
												</View>
												{!entry.isVacantSlot && (
													<AppText.Base bold color={AppColors.sub}>
														{entry.scheduledStart}–{entry.scheduledEnd}
													</AppText.Base>
												)}
											</View>
											<View
												style={[
													styles.statusBadge,
													hasSubstitute
														? styles.substituteStatus
														: entry.isVacantSlot
															? styles.vacantStatus
															: completed
																? styles.completedStatus
																: entry.status === "missed"
																	? styles.missedStatus
																	: styles.scheduledStatus,
												]}
											>
												<AppText.Xs
													bold={completed}
													color={completed ? AppColors.textOnPrimary : entry.isVacantSlot ? vacantTextColor : AppColors.sub}
												>
													{hasSubstitute ? "대타 완료" : entry.isVacantSlot ? "비어있음" : attendanceStatusLabels[entry.status]}
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
													{!entry.isVacantSlot && (
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
													)}
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
														<AppText.Sm color={AppColors.sub}>선택 가능한 근무자가 없습니다.</AppText.Sm>
													) : (
														candidates.map(candidate => (
															<AppPressable
																key={candidate.id}
																accessibilityLabel={`${candidate.name} 대타 등록`}
																accessibilityRole="button"
																border
																onPress={() => handleSubstituteRegistration(entry, candidate)}
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
												{allowTemporaryWorker && (
													<>
														<AppPressable
															accessibilityLabel="임시근로자 정보 입력"
															accessibilityRole="button"
															border
															onPress={() => {
																setTemporaryWorkerFormForId(current => (current === entry.id ? null : entry.id));
																setTemporaryWorkerDraft(emptyTemporaryWorkerDraft);
															}}
															radius="base"
															style={styles.temporaryWorkerButton}
														>
															<AppText.Sm bold color={AppColors.primary}>임시근로자</AppText.Sm>
														</AppPressable>
														{showingTemporaryWorkerForm && (
															<View style={styles.temporaryWorkerForm}>
																<AppText.Xs color={AppColors.sub}>퇴사자 또는 외부 임시근로자의 정보를 입력해 주세요.</AppText.Xs>
																<View style={styles.inputGroup}>
																	<AppText.Xs bold color={AppColors.sub}>이름</AppText.Xs>
																	<TextInput accessibilityLabel="임시근로자 이름" autoCapitalize="none" autoFocus disableFullscreenUI onChangeText={name => setTemporaryWorkerDraft(current => ({ ...current, name }))} placeholder="이름 입력" placeholderTextColor={AppColors.placeholder} returnKeyType="next" style={styles.textInput} value={temporaryWorkerDraft.name} />
																</View>
																<View style={styles.inputGroup}>
																	<AppText.Xs bold color={AppColors.sub}>연락처</AppText.Xs>
																	<TextInput accessibilityLabel="임시근로자 연락처" disableFullscreenUI keyboardType="phone-pad" maxLength={11} onChangeText={phone => setTemporaryWorkerDraft(current => ({ ...current, phone: phone.replace(/\D/g, "") }))} placeholder="숫자만 입력" placeholderTextColor={AppColors.placeholder} style={styles.textInput} value={temporaryWorkerDraft.phone} />
																</View>
																<View style={styles.inputGroup}>
																	<AppText.Xs bold color={AppColors.sub}>시급</AppText.Xs>
																	<TextInput accessibilityLabel="임시근로자 시급" disableFullscreenUI keyboardType="number-pad" maxLength={7} onChangeText={hourlyWage => setTemporaryWorkerDraft(current => ({ ...current, hourlyWage: hourlyWage.replace(/\D/g, "") }))} placeholder="예: 10320" placeholderTextColor={AppColors.placeholder} style={styles.textInput} value={temporaryWorkerDraft.hourlyWage} />
																</View>
																<AppPressable accessibilityLabel="임시근로자 근무시간 입력" accessibilityRole="button" onPress={() => handleTemporaryWorkerRegistration(entry)} pressedColor="#003E7A" radius="base" style={styles.temporaryWorkerConfirmButton}>
																	<AppText.Sm bold color={AppColors.textOnPrimary}>근무시간 입력하기</AppText.Sm>
																</AppPressable>
															</View>
														)}
													</>
												)}
											</View>
										)}
									</View>
								);
							})}
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

				{pendingRegistration && (
					<AttendanceDurationPicker
						employeeName={
							pendingRegistration.mode === "substitute"
								? pendingRegistration.substituteEmployee.name
								: pendingRegistration.mode === "temporary"
									? pendingRegistration.temporaryWorker.name
									: pendingRegistration.entry.employeeName
						}
						initialMinutes={pendingRegistration.entry.scheduledMinutes}
						mode={pendingRegistration.mode}
						onCancel={() => setPendingRegistration(null)}
						onConfirm={handleRegistrationConfirmation}
					/>
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
		gap: AppSpacing.xs,
	},
	nameRow: {
		flexDirection: "row",
		alignItems: "center",
		flexWrap: "wrap",
		gap: AppSpacing.xs,
		paddingBottom: 4,
	},
	shiftBadge: {
		alignSelf: "flex-start",
		minWidth: 42,
		minHeight: 22,
		alignItems: "center",
		justifyContent: "center",
		borderRadius: 4,
		paddingHorizontal: AppSpacing.xs,
	},
	replacedEmployeeName: {
		color: AppColors.sub,
		textDecorationLine: "line-through",
	},
	substituteBadge: {
		maxWidth: 160,
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
	vacantStatus: {
		borderWidth: 1,
		borderColor: "#CBD5E1",
		backgroundColor: "#F8FAFC",
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
	temporaryWorkerButton: {
		width: "100%",
		minHeight: 42,
		alignItems: "center",
		justifyContent: "center",
		borderColor: "rgba(0, 75, 147, 0.34)",
		backgroundColor: "#F5F9FD",
	},
	temporaryWorkerForm: {
		gap: AppSpacing.sm,
		borderTopWidth: 1,
		borderTopColor: "#D7E4F0",
		paddingTop: AppSpacing.sm,
	},
	inputGroup: {
		gap: AppSpacing.xs,
	},
	textInput: {
		width: "100%",
		minHeight: 44,
		borderWidth: 1,
		borderColor: "#CBD5E1",
		borderRadius: 4,
		backgroundColor: AppColors.background,
		color: AppColors.text,
		fontFamily: AppFonts.regular,
		fontSize: 14,
		paddingHorizontal: AppSpacing.sm,
		paddingVertical: AppSpacing.sm,
	},
	temporaryWorkerConfirmButton: {
		width: "100%",
		minHeight: 44,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: AppColors.primary,
		marginTop: AppSpacing.xs,
	},
	toastViewport: {
		position: "absolute",
		top: AppSpacing.xl,
		right: 0,
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
