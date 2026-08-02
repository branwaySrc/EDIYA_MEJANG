import * as Clipboard from "expo-clipboard";
import { useMemo, useState } from "react";
import { StyleSheet, Switch, View } from "react-native";

import { AppBadge } from "@/components/base/app-badge";
import { AppIcon } from "@/components/base/app-icon";
import { AppPressable } from "@/components/base/app-pressable";
import { AppText } from "@/components/base/app-text";
import { deleteHiringContractFilesAsync } from "@/components/features/sajang/hiring/hiring-pdf-service";
import { ManagementField, ManagementOptionSelector, ManagementSection } from "@/components/features/sajang/management/management-ui";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { TimeField } from "@/components/ui/time-field";
import { AppColors, AppSpacing } from "@/constants/theme";
import { employeeShiftGroups, formatEmployeeWorkTime, toEmployee } from "@/database/employee/employee";
import { employeeDocumentLabels } from "@/database/employee/employee-document";
import type { EmployeeDocumentType, EmployeeRecord, EmployeeShiftGroup, EmployeeWeekday } from "@/database/employee/employee.type";
import { hiringWorkplaces, type HiringWorkplaceId } from "@/database/sajang/workplace";
import { deleteEmployeeDocumentFileAsync, pickEmployeeDocumentAsync } from "@/lib/employee-document-storage";
import { useAppToastStore } from "@/store/app-toast-store";
import { useEmployeeManagementStore } from "@/store/employee-management-store";
import { useHiringContractStore } from "@/store/hiring-contract-store";

type PendingDelete = { id: string; kind: "contract" } | { id: string; kind: "document"; localUri: string };

type DocumentDisplayItem = {
	id: string;
	name: string;
	source: PendingDelete["kind"];
	uploadedAt: string;
};

const weekdays: EmployeeWeekday[] = ["월", "화", "수", "목", "금", "토", "일"];
const managedDocumentTypes: EmployeeDocumentType[] = ["contract", "health_certificate", "bankbook_copy", "id_card_copy", "other"];

function cloneRecord(record: EmployeeRecord) {
	return {
		...record,
		work_days: [...record.work_days],
	};
}

function formatUploadedAt(value: string) {
	const date = new Date(value);

	if (Number.isNaN(date.getTime())) {
		return value;
	}

	return date.toLocaleDateString("ko-KR", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	});
}

function DetailRow({ label, value }: { label: string; value: string }) {
	return (
		<View style={styles.detailRow}>
			<AppText.Base bold color={AppColors.placeholder} style={styles.detailLabel}>
				{label}
			</AppText.Base>
			<AppText.Base style={styles.detailValue}>{value || "미입력"}</AppText.Base>
		</View>
	);
}

function DocumentItemRow({ item, onDelete }: { item: DocumentDisplayItem; onDelete: (item: DocumentDisplayItem) => void }) {
	return (
		<View style={styles.documentRow}>
			<AppIcon.Base color={AppColors.primary} name="document-text-outline" pressable={false} />
			<View style={styles.documentText}>
				<AppText.Base bold numberOfLines={2}>
					{item.name}
				</AppText.Base>
				<AppText.Base color={AppColors.sub}>업로드 {formatUploadedAt(item.uploadedAt)}</AppText.Base>
			</View>
			<AppPressable
				accessibilityLabel={`${item.name} 삭제`}
				accessibilityRole="button"
				onPress={() => onDelete(item)}
				style={styles.documentDeleteButton}
			>
				<AppText.Base color="#B91C1C" style={styles.underlinedText}>
					삭제
				</AppText.Base>
			</AppPressable>
		</View>
	);
}

function DocumentSlot({
	busy,
	items,
	onDelete,
	onUpload,
	type,
}: {
	busy: boolean;
	items: DocumentDisplayItem[];
	onDelete: (item: DocumentDisplayItem) => void;
	onUpload: () => void;
	type: EmployeeDocumentType;
}) {
	return (
		<View style={styles.documentSlot}>
			<View style={styles.documentSlotHeader}>
				<AppText.Base bold>{employeeDocumentLabels[type]}</AppText.Base>
				<AppPressable
					accessibilityLabel={`${employeeDocumentLabels[type]} 업로드`}
					accessibilityRole="button"
					disabled={busy}
					onPress={onUpload}
					pressedColor="#003E7A"
					radius="base"
					style={styles.uploadButton}
				>
					<AppText.Sm bold color={AppColors.textOnPrimary}>
						{busy ? "등록" : "업로드"}
					</AppText.Sm>
				</AppPressable>
			</View>
			{items.length === 0 ? (
				<AppText.Base color={AppColors.placeholder}>등록된 파일이 없습니다.</AppText.Base>
			) : (
				<View style={styles.documentList}>
					{items.map(item => (
						<DocumentItemRow key={`${item.source}-${item.id}`} item={item} onDelete={onDelete} />
					))}
				</View>
			)}
		</View>
	);
}

export function EmployeeDetailView({ employeeId }: { employeeId: string }) {
	const records = useEmployeeManagementStore(state => state.records);
	const documents = useEmployeeManagementStore(state => state.documents);
	const updateEmployeeRecord = useEmployeeManagementStore(state => state.updateEmployeeRecord);
	const upsertDocumentRecord = useEmployeeManagementStore(state => state.upsertDocumentRecord);
	const removeDocumentRecord = useEmployeeManagementStore(state => state.removeDocumentRecord);
	const contracts = useHiringContractStore(state => state.contracts);
	const removeContract = useHiringContractStore(state => state.removeContract);
	const showToast = useAppToastStore(state => state.showToast);
	const record = records.find(item => item.id === employeeId);
	const employee = useMemo(() => (record ? toEmployee(record) : null), [record]);
	const employeeDocuments = useMemo(() => documents.filter(document => document.employee_id === employeeId), [documents, employeeId]);
	const employeeContracts = useMemo(() => contracts.filter(contract => contract.employeeId === employeeId), [contracts, employeeId]);
	const [draft, setDraft] = useState<EmployeeRecord | null>(null);
	const [bankDraft, setBankDraft] = useState<{ accountNumber: string; bankName: string } | null>(null);
	const [busyDocumentType, setBusyDocumentType] = useState<EmployeeDocumentType | null>(null);
	const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);

	if (!record || !employee) {
		return (
			<View style={styles.notFound}>
				<AppIcon.Lg color={AppColors.sub} name="person-outline" pressable={false} />
				<AppText.Base bold>직원 정보를 찾을 수 없습니다.</AppText.Base>
			</View>
		);
	}

	const editing = draft !== null;
	const editorDraft = draft ?? record;
	const bankEditing = bankDraft !== null || !record.bank_account_number;
	const accountNumber = bankDraft?.accountNumber ?? record.bank_account_number ?? "";
	const bankName = bankDraft?.bankName ?? record.bank_name ?? "";

	const setDraftField = <Key extends keyof EmployeeRecord>(key: Key, value: EmployeeRecord[Key]) => {
		setDraft(current => (current ? { ...current, [key]: value } : current));
	};

	const toggleWorkday = (day: EmployeeWeekday) => {
		setDraft(current => {
			if (!current) {
				return current;
			}

			const workDays = current.work_days.includes(day) ? current.work_days.filter(item => item !== day) : [...current.work_days, day];

			return { ...current, work_days: workDays };
		});
	};

	const saveEmployee = () => {
		if (!draft) {
			return;
		}

		if (!draft.name.trim() || !draft.phone.trim()) {
			showToast("이름과 연락처를 입력해 주세요.");
			return;
		}

		updateEmployeeRecord(employeeId, {
			address: draft.address?.trim() || null,
			birth_date: draft.birth_date?.trim() || null,
			email: draft.email?.trim() || null,
			hourly_wage: draft.hourly_wage,
			joined_at: draft.joined_at.trim(),
			name: draft.name.trim(),
			phone: draft.phone.trim(),
			phone_public: draft.phone_public,
			shift_group: draft.shift_group,
			work_days: [...draft.work_days],
			work_end_minutes: draft.work_end_minutes,
			workplace_id: draft.workplace_id,
			workplace_name: draft.workplace_name,
			work_start_minutes: draft.work_start_minutes,
		});
		setDraft(null);
		showToast("저장이 완료되었습니다.");
	};

	const cancelEmployeeEdit = () => {
		setDraft(null);
	};

	const saveBankAccount = () => {
		if (!bankName.trim() || !accountNumber.trim()) {
			showToast("은행과 계좌번호를 입력해 주세요.");
			return;
		}

		updateEmployeeRecord(employeeId, {
			bank_account_number: accountNumber.trim(),
			bank_name: bankName.trim(),
		});
		setBankDraft(null);
		showToast("계좌정보가 저장되었습니다.");
	};

	const copyAccountNumber = async () => {
		if (!record.bank_account_number) {
			return;
		}

		await Clipboard.setStringAsync(record.bank_account_number);
		showToast("계좌번호를 복사했습니다.");
	};

	const uploadDocument = async (documentType: EmployeeDocumentType) => {
		try {
			setBusyDocumentType(documentType);
			const nextDocument = await pickEmployeeDocumentAsync(employeeId, documentType);

			if (nextDocument) {
				upsertDocumentRecord(nextDocument);
				showToast("파일이 등록되었습니다.");
			}
		} catch {
			showToast("파일을 등록하지 못했습니다.");
		} finally {
			setBusyDocumentType(null);
		}
	};

	const requestDelete = (item: DocumentDisplayItem) => {
		if (item.source === "contract") {
			setPendingDelete({ id: item.id, kind: "contract" });
			return;
		}

		const document = employeeDocuments.find(candidate => candidate.id === item.id);

		if (document) {
			setPendingDelete({
				id: document.id,
				kind: "document",
				localUri: document.local_uri,
			});
		}
	};

	const confirmDelete = async () => {
		if (!pendingDelete) {
			return;
		}

		if (pendingDelete.kind === "contract") {
			const contract = employeeContracts.find(item => item.id === pendingDelete.id);

			if (contract) {
				await deleteHiringContractFilesAsync(contract);
			}
			removeContract(pendingDelete.id);
		} else {
			await deleteEmployeeDocumentFileAsync(pendingDelete.localUri);
			removeDocumentRecord(pendingDelete.id);
		}

		setPendingDelete(null);
		showToast("삭제되었습니다.");
	};

	const documentsByType = (type: EmployeeDocumentType): DocumentDisplayItem[] => {
		const uploadedItems = employeeDocuments
			.filter(document => document.document_type === type)
			.map(document => ({
				id: document.id,
				name: document.file_name,
				source: "document" as const,
				uploadedAt: document.uploaded_at,
			}));

		if (type !== "contract") {
			return uploadedItems;
		}

		return [
			...employeeContracts.map(contract => ({
				id: contract.id,
				name: contract.fileName,
				source: "contract" as const,
				uploadedAt: contract.signedAt,
			})),
			...uploadedItems,
		];
	};

	return (
		<View style={styles.container}>
			{!editing ? (
				<View style={styles.hero}>
					<View style={styles.heroText}>
						<AppText.Sm bold color={AppColors.primary}>
							{employee.shiftGroup} / {employee.workplaceName || "근무지 미입력"}
						</AppText.Sm>
						<AppText.Xl bold>{employee.name}</AppText.Xl>
						<AppText.Sm color={AppColors.sub}>
							{employee.workTime} · {employee.workDays.join(", ")}
						</AppText.Sm>
					</View>
					<AppPressable
						accessibilityLabel="직원정보 수정하기"
						onPress={() => setDraft(cloneRecord(record))}
						radius="base"
						style={styles.editOpenButton}
					>
						<AppIcon.Sm color={AppColors.primary} name="settings-outline" pressable={false} />
						<AppText.Sm bold color={AppColors.primary}>
							수정하기
						</AppText.Sm>
					</AppPressable>
				</View>
			) : null}

			<ManagementSection title="직원 정보">
				{editing ? (
					<>
						<ManagementField label="이름" onChangeText={value => setDraftField("name", value)} value={editorDraft.name} />
						<ManagementField
							label="생년월일"
							onChangeText={value => setDraftField("birth_date", value)}
							placeholder="YYYY-MM-DD"
							value={editorDraft.birth_date ?? ""}
						/>
						<ManagementField
							keyboardType="phone-pad"
							label="연락처"
							onChangeText={value => setDraftField("phone", value)}
							value={editorDraft.phone}
						/>
						<View style={styles.switchRow}>
							<View style={styles.switchText}>
								<AppText.Base bold>연락처 공개</AppText.Base>
								<AppText.Sm color={AppColors.sub}>직원 카드에 전화번호를 표시합니다.</AppText.Sm>
							</View>
							<Switch
								accessibilityLabel="연락처 공개 여부"
								onValueChange={value => setDraftField("phone_public", value)}
								thumbColor={AppColors.background}
								trackColor={{ false: "#CBD5E1", true: AppColors.primary }}
								value={editorDraft.phone_public}
							/>
						</View>
						<ManagementField
							keyboardType="email-address"
							label="이메일"
							onChangeText={value => setDraftField("email", value)}
							value={editorDraft.email ?? ""}
						/>
						<ManagementField label="주소" multiline onChangeText={value => setDraftField("address", value)} value={editorDraft.address ?? ""} />
						<ManagementField
							label="입사일"
							onChangeText={value => setDraftField("joined_at", value)}
							placeholder="YYYY-MM-DD"
							value={editorDraft.joined_at}
						/>
						<ManagementOptionSelector
							label="근무지"
							onChange={(workplaceId: HiringWorkplaceId) => {
								const workplace = hiringWorkplaces.find(item => item.id === workplaceId);
								setDraft(current =>
									current
										? {
												...current,
												workplace_id: workplaceId,
												workplace_name: workplace?.name ?? null,
											}
										: current,
								);
							}}
							options={hiringWorkplaces.map(workplace => ({
								label: workplace.name,
								value: workplace.id,
							}))}
							value={(editorDraft.workplace_id as HiringWorkplaceId | null) ?? "wolpi"}
						/>
						<ManagementOptionSelector
							label="근무조"
							onChange={(shiftGroup: EmployeeShiftGroup) => setDraftField("shift_group", shiftGroup)}
							options={employeeShiftGroups.map(value => ({ label: value, value }))}
							value={editorDraft.shift_group}
						/>
						<View style={styles.field}>
							<AppText.Sm bold color={AppColors.sub}>
								근무일
							</AppText.Sm>
							<View style={styles.weekdayRow}>
								{weekdays.map(day => (
									<AppPressable
										key={day}
										accessibilityLabel={`${day}요일 ${editorDraft.work_days.includes(day) ? "해제" : "선택"}`}
										onPress={() => toggleWorkday(day)}
										radius="full"
									>
										<AppBadge size="sm" tone={editorDraft.work_days.includes(day) ? "primary" : "neutral"}>
											{day}
										</AppBadge>
									</AppPressable>
								))}
							</View>
						</View>
						<View style={styles.timeRow}>
							<View style={styles.timeField}>
								<TimeField label="근무 시작" onChange={value => setDraftField("work_start_minutes", value)} value={editorDraft.work_start_minutes} />
							</View>
							<View style={styles.timeField}>
								<TimeField label="근무 종료" onChange={value => setDraftField("work_end_minutes", value)} value={editorDraft.work_end_minutes} />
							</View>
						</View>
						<ManagementField
							keyboardType="number-pad"
							label="시급"
							onChangeText={value => setDraftField("hourly_wage", Number(value.replace(/\D/g, "")) || null)}
							value={editorDraft.hourly_wage?.toString() ?? ""}
						/>
					</>
				) : (
					<View style={styles.detailTable}>
						<DetailRow label="연락처" value={employee.phone} />
						<DetailRow label="공개 여부" value={employee.phonePublic ? "공개" : "비공개 · 카카오톡 안내"} />
						<DetailRow label="생년월일" value={employee.birthDate} />
						<DetailRow label="이메일" value={employee.email} />
						<DetailRow label="주소" value={employee.address} />
						<DetailRow label="입사일" value={employee.joinedAt} />
						<DetailRow label="근무지" value={employee.workplaceName} />
						<DetailRow label="근무조" value={employee.shiftGroup} />
						<DetailRow label="근무시간" value={formatEmployeeWorkTime(employee)} />
						<DetailRow label="근무일" value={employee.workDays.join(", ")} />
						<DetailRow label="시급" value={employee.hourlyWage ? `${employee.hourlyWage.toLocaleString("ko-KR")}원` : ""} />
					</View>
				)}
			</ManagementSection>

			{editing ? (
				<View style={styles.employeeEditActions}>
					<AppPressable onPress={cancelEmployeeEdit} radius="base" style={styles.secondaryButton}>
						<AppText.Base bold>되돌리기</AppText.Base>
					</AppPressable>
					<AppPressable onPress={saveEmployee} pressedColor="#003E7A" radius="base" style={styles.primaryButton}>
						<AppText.Base bold color={AppColors.textOnPrimary}>
							저장하기
						</AppText.Base>
					</AppPressable>
				</View>
			) : (
				<>
					<ManagementSection title="급여 계좌">
						{bankEditing ? (
							<>
								<ManagementField
									label="계좌번호"
									onChangeText={value =>
										setBankDraft(current => ({
											accountNumber: value,
											bankName: current?.bankName ?? record.bank_name ?? "",
										}))
									}
									placeholder="계좌번호 입력"
									value={accountNumber}
								/>
								<ManagementField
									label="은행"
									onChangeText={value =>
										setBankDraft(current => ({
											accountNumber: current?.accountNumber ?? record.bank_account_number ?? "",
											bankName: value,
										}))
									}
									placeholder="은행명 입력"
									value={bankName}
								/>
								<View style={styles.formActions}>
									{record.bank_account_number ? (
										<AppPressable
											onPress={() => {
												setBankDraft(null);
											}}
											radius="base"
											style={styles.secondaryButton}
										>
											<AppText.Base bold>취소</AppText.Base>
										</AppPressable>
									) : null}
									<AppPressable onPress={saveBankAccount} pressedColor="#003E7A" radius="base" style={styles.primaryButton}>
										<AppText.Base bold color={AppColors.textOnPrimary}>
											계좌정보 저장
										</AppText.Base>
									</AppPressable>
								</View>
							</>
						) : (
							<>
								<View style={styles.accountRow}>
									<View style={styles.accountText}>
										<AppText.Xs bold color={AppColors.sub}>
											계좌번호
										</AppText.Xs>
										<AppText.Base bold>{record.bank_account_number}</AppText.Base>
									</View>
									<AppPressable onPress={copyAccountNumber} radius="base" style={styles.compactButton}>
										<AppIcon.Xs color={AppColors.primary} name="copy-outline" pressable={false} />
										<AppText.Xs bold color={AppColors.primary}>
											복사
										</AppText.Xs>
									</AppPressable>
									<AppPressable
										onPress={() =>
											setBankDraft({
												accountNumber: record.bank_account_number ?? "",
												bankName: record.bank_name ?? "",
											})
										}
										radius="base"
										style={styles.compactButton}
									>
										<AppIcon.Xs color={AppColors.primary} name="create-outline" pressable={false} />
										<AppText.Xs bold color={AppColors.primary}>
											수정
										</AppText.Xs>
									</AppPressable>
								</View>
								<DetailRow label="은행" value={record.bank_name ?? ""} />
							</>
						)}
					</ManagementSection>

					<ManagementSection title="서류 보관함">
						{managedDocumentTypes.map(type => (
							<DocumentSlot
								key={type}
								busy={busyDocumentType === type}
								items={documentsByType(type)}
								onDelete={requestDelete}
								onUpload={() => uploadDocument(type)}
								type={type}
							/>
						))}
					</ManagementSection>
				</>
			)}

			<ConfirmDialog
				message="정말로 삭제하시겠습니까?"
				onCancel={() => setPendingDelete(null)}
				onConfirm={() => {
					void confirmDelete();
				}}
				open={pendingDelete !== null}
				title="서류 삭제"
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		width: "100%",
		paddingBottom: AppSpacing.xl,
	},
	notFound: {
		minHeight: 240,
		alignItems: "center",
		justifyContent: "center",
		gap: AppSpacing.sm,
		padding: AppSpacing.md,
	},
	hero: {
		minHeight: 116,
		flexDirection: "row",
		alignItems: "flex-start",
		gap: AppSpacing.sm,
		borderBottomWidth: 1,
		borderBottomColor: "#E2E8F0",
		padding: AppSpacing.md,
	},
	heroText: {
		flex: 1,
		minWidth: 0,
		gap: AppSpacing.xs,
	},
	editOpenButton: {
		minHeight: 44,
		flexDirection: "row",
		alignItems: "center",
		gap: AppSpacing.xs,
		borderWidth: 1,
		borderColor: "rgba(0, 75, 147, 0.3)",
		paddingHorizontal: AppSpacing.md,
	},
	detailTable: {
		width: "100%",
	},
	detailRow: {
		minHeight: 48,
		flexDirection: "row",
		alignItems: "center",
		gap: AppSpacing.sm,
		borderBottomWidth: 1,
		borderBottomColor: "rgba(71, 85, 105, 0.16)",
		paddingVertical: AppSpacing.sm,
	},
	detailLabel: {
		width: 82,
	},
	detailValue: {
		flex: 1,
		minWidth: 0,
	},
	switchRow: {
		minHeight: 64,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: AppSpacing.md,
		borderWidth: 1,
		borderColor: "rgba(71, 85, 105, 0.24)",
		borderRadius: 4,
		paddingHorizontal: AppSpacing.md,
	},
	switchText: {
		flex: 1,
		minWidth: 0,
	},
	field: {
		width: "100%",
		gap: AppSpacing.xs,
	},
	weekdayRow: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: AppSpacing.xs,
	},
	timeRow: {
		width: "100%",
		flexDirection: "row",
		gap: AppSpacing.sm,
	},
	timeField: {
		flex: 1,
		minWidth: 0,
	},
	formActions: {
		width: "100%",
		flexDirection: "row",
		gap: AppSpacing.sm,
	},
	employeeEditActions: {
		width: "100%",
		flexDirection: "row",
		gap: AppSpacing.sm,
		paddingHorizontal: AppSpacing.md,
		paddingTop: AppSpacing.sm,
		paddingBottom: AppSpacing.lg,
		backgroundColor: AppColors.background,
	},
	primaryButton: {
		minHeight: 50,
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: AppColors.primary,
		paddingHorizontal: AppSpacing.md,
	},
	secondaryButton: {
		minHeight: 50,
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		borderWidth: 1,
		borderColor: "#CBD5E1",
		paddingHorizontal: AppSpacing.md,
	},
	accountRow: {
		minHeight: 64,
		flexDirection: "row",
		alignItems: "center",
		gap: AppSpacing.sm,
	},
	accountText: {
		flex: 1,
		minWidth: 0,
		gap: AppSpacing.xs,
	},
	compactButton: {
		minHeight: 38,
		flexDirection: "row",
		alignItems: "center",
		gap: AppSpacing.xs,
		borderWidth: 1,
		borderColor: "rgba(0, 75, 147, 0.28)",
		paddingHorizontal: AppSpacing.sm,
	},
	documentSlot: {
		width: "100%",
		gap: AppSpacing.sm,
		borderBottomWidth: 1,
		borderBottomColor: "#E2E8F0",
		paddingBottom: AppSpacing.md,
	},
	documentSlotHeader: {
		minHeight: 42,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: AppSpacing.sm,
	},
	uploadButton: {
		minHeight: 44,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: AppColors.primary,
		paddingHorizontal: AppSpacing.md,
	},
	documentList: {
		width: "100%",
	},
	documentRow: {
		minHeight: 64,
		flexDirection: "row",
		alignItems: "center",
		gap: AppSpacing.sm,
		borderTopWidth: 1,
		borderTopColor: "rgba(71, 85, 105, 0.14)",
		paddingVertical: AppSpacing.sm,
	},
	documentText: {
		flex: 1,
		minWidth: 0,
		gap: AppSpacing.xs,
	},
	documentDeleteButton: {
		minHeight: 44,
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: AppSpacing.md,
	},
	underlinedText: {
		textDecorationLine: "underline",
	},
});
