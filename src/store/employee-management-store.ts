import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { sampleEmployeeRecords } from "@/database/employee/employee";
import type { EmployeeDocumentRecord, EmployeeEmploymentPeriodRecord, EmployeeRecord } from "@/database/employee/employee.type";
import {
	deleteSupabaseEmployeeDocumentAsync,
	deleteSupabaseEmployeeRecordAsync,
	fetchSupabaseEmployeeManagementAsync,
	updateSupabaseEmployeeRecordAsync,
	uploadSupabaseEmployeeDocumentAsync,
	upsertSupabaseEmployeeDocumentRecordAsync,
	upsertSupabaseEmployeeRecordAsync,
} from "@/lib/employee/supabase-employee-repository";
import { createFileStateStorage } from "@/lib/file-state-storage";

type EmployeeManagementState = {
	documents: EmployeeDocumentRecord[];
	employmentPeriods: EmployeeEmploymentPeriodRecord[];
	hydrateFromRemote: () => Promise<void>;
	records: EmployeeRecord[];
	removeDocumentRecord: (id: string) => Promise<void>;
	removeEmployeeRecord: (id: string) => Promise<void>;
	syncErrorMessage: string | null;
	syncing: boolean;
	updateEmployeeRecord: (id: string, patch: Partial<EmployeeRecord>) => Promise<void>;
	upsertDocumentRecord: (document: EmployeeDocumentRecord) => Promise<void>;
	upsertEmployeeRecord: (record: EmployeeRecord) => Promise<void>;
};

function upsertById<Item extends { id: string }>(items: Item[], nextItem: Item) {
	const existing = items.some(item => item.id === nextItem.id);

	if (!existing) {
		return [...items, nextItem];
	}

	return items.map(item => (item.id === nextItem.id ? nextItem : item));
}

export const useEmployeeManagementStore = create<EmployeeManagementState>()(
	persist(
		set => ({
			documents: [],
			employmentPeriods: [],
			syncErrorMessage: null,
			syncing: false,
			records: sampleEmployeeRecords,
			hydrateFromRemote: async () => {
				set({ syncing: true, syncErrorMessage: null });

				try {
					const remoteSnapshot = await fetchSupabaseEmployeeManagementAsync();

					if (remoteSnapshot) {
						set({
							documents: remoteSnapshot.documents,
							employmentPeriods: remoteSnapshot.employmentPeriods,
							records: remoteSnapshot.records,
						});
					}
				} catch (error) {
					console.error("Failed to hydrate employees from Supabase.", error);
					set({ syncErrorMessage: "직원 정보를 Supabase에서 불러오지 못했습니다." });
				} finally {
					set({ syncing: false });
				}
			},
			removeDocumentRecord: async id => {
				let removedDocument: EmployeeDocumentRecord | null = null;

				set(state => ({
					documents: state.documents.filter(document => {
						if (document.id === id) {
							removedDocument = document;
							return false;
						}

						return true;
					}),
					syncErrorMessage: null,
				}));

				if (!removedDocument) {
					return;
				}

				const documentToRestore = removedDocument;

				try {
					await deleteSupabaseEmployeeDocumentAsync(documentToRestore);
				} catch (error) {
					console.error("Failed to delete employee document from Supabase.", error);
					set(state => ({
						documents: upsertById(state.documents, documentToRestore),
						syncErrorMessage: "직원 서류를 Supabase에서 삭제하지 못했습니다.",
					}));
				}
			},
			removeEmployeeRecord: async id => {
				let removedDocuments: EmployeeDocumentRecord[] = [];
				let removedRecord: EmployeeRecord | null = null;

				set(state => ({
					documents: state.documents.filter(document => {
						if (document.employee_id === id) {
							removedDocuments = [...removedDocuments, document];
							return false;
						}

						return true;
					}),
					records: state.records.filter(record => {
						if (record.id === id && !record.is_owner) {
							removedRecord = record;
							return false;
						}

						return true;
					}),
					syncErrorMessage: null,
				}));

				if (!removedRecord) {
					return;
				}

				const recordToRestore = removedRecord;

				try {
					await deleteSupabaseEmployeeRecordAsync(id);
				} catch (error) {
					console.error("Failed to delete employee from Supabase.", error);
					set(state => ({
						documents: [...state.documents, ...removedDocuments],
						records: upsertById(state.records, recordToRestore),
						syncErrorMessage: "직원을 Supabase에서 삭제하지 못했습니다.",
					}));
				}
			},
			updateEmployeeRecord: async (id, patch) => {
				let localRecord: EmployeeRecord | null = null;
				const employmentStatusChanged = "employment_status" in patch || "terminated_at" in patch;

				set(state => ({
					records: state.records.map(record =>
						record.id === id
							? (localRecord = {
									...record,
									...patch,
									id: record.id,
									created_at: record.created_at,
									updated_at: new Date().toISOString(),
								})
							: record,
					),
					syncErrorMessage: null,
				}));

				if (!localRecord) {
					return;
				}

				try {
					const remoteRecord = await updateSupabaseEmployeeRecordAsync(id, patch);

					if (remoteRecord) {
						set(state => ({
							records: upsertById(state.records, remoteRecord),
						}));
					}

					if (employmentStatusChanged) {
						const refreshedSnapshot = await fetchSupabaseEmployeeManagementAsync();

						if (refreshedSnapshot) {
							set({
								documents: refreshedSnapshot.documents,
								employmentPeriods: refreshedSnapshot.employmentPeriods,
								records: refreshedSnapshot.records,
							});
						}
					}
				} catch (error) {
					console.error("Failed to sync employee update to Supabase.", error);
					set({ syncErrorMessage: "직원 정보를 Supabase에 저장하지 못했습니다. 로컬 화면에는 임시 반영되었습니다." });
				}
			},
			upsertDocumentRecord: async document => {
				set(state => ({
					documents: upsertById(state.documents, document),
					syncErrorMessage: null,
				}));

				try {
					const remoteDocument = document.storage_path
						? await upsertSupabaseEmployeeDocumentRecordAsync(document)
						: await uploadSupabaseEmployeeDocumentAsync(document);

					if (remoteDocument) {
						set(state => ({
							documents: upsertById(state.documents, remoteDocument),
						}));
					}
				} catch (error) {
					console.error("Failed to sync employee document to Supabase.", error);
					set({ syncErrorMessage: "직원 서류를 Supabase에 업로드하지 못했습니다. 로컬 화면에는 임시 반영되었습니다." });
				}
			},
			upsertEmployeeRecord: async record => {
				set(state => ({
					records: upsertById(state.records, record),
					syncErrorMessage: null,
				}));

				try {
					const remoteRecord = await upsertSupabaseEmployeeRecordAsync(record);

					if (remoteRecord) {
						set(state => ({
							records: upsertById(state.records, remoteRecord),
						}));
					}
				} catch (error) {
					console.error("Failed to sync employee to Supabase.", error);
					set({ syncErrorMessage: "신규 직원 정보를 Supabase에 저장하지 못했습니다. 로컬 화면에는 임시 반영되었습니다." });
				}
			},
		}),
		{
			name: "ediya-mejang:employees",
			partialize: state => ({
				documents: state.documents,
				employmentPeriods: state.employmentPeriods,
				records: state.records,
			}),
			storage: createJSONStorage(() => createFileStateStorage("employee-management")),
			version: 1,
		},
	),
);
