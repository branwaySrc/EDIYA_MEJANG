import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { sampleEmployeeRecords } from "@/database/employee/employee";
import type { EmployeeDocumentRecord, EmployeeRecord } from "@/database/employee/employee.type";
import { createFileStateStorage } from "@/lib/file-state-storage";

type EmployeeManagementState = {
	documents: EmployeeDocumentRecord[];
	records: EmployeeRecord[];
	removeDocumentRecord: (id: string) => void;
	removeEmployeeRecord: (id: string) => void;
	updateEmployeeRecord: (id: string, patch: Partial<EmployeeRecord>) => void;
	upsertDocumentRecord: (document: EmployeeDocumentRecord) => void;
	upsertEmployeeRecord: (record: EmployeeRecord) => void;
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
			records: sampleEmployeeRecords,
			removeDocumentRecord: id =>
				set(state => ({
					documents: state.documents.filter(document => document.id !== id),
				})),
			removeEmployeeRecord: id =>
				set(state => ({
					documents: state.documents.filter(document => document.employee_id !== id),
					records: state.records.filter(record => record.id !== id || record.is_owner),
				})),
			updateEmployeeRecord: (id, patch) =>
				set(state => ({
					records: state.records.map(record =>
						record.id === id
							? {
									...record,
									...patch,
									id: record.id,
									created_at: record.created_at,
									updated_at: new Date().toISOString(),
								}
							: record,
					),
				})),
			upsertDocumentRecord: document =>
				set(state => ({
					documents: upsertById(state.documents, document),
				})),
			upsertEmployeeRecord: record =>
				set(state => ({
					records: upsertById(state.records, record),
				})),
		}),
		{
			name: "ediya-mejang:employees",
			partialize: state => ({
				documents: state.documents,
				records: state.records,
			}),
			storage: createJSONStorage(() => createFileStateStorage("employee-management")),
			version: 1,
		},
	),
);
