import type { EmployeeShiftGroup, EmployeeWeekday } from "@/database/employee/employee.type";
import type { HiringWorkplaceId } from "@/database/sajang/workplace";

export type HiringWeekday = EmployeeWeekday;

export type HiringDocumentKey = "bankbookCopy" | "healthCertificate" | "idCardCopy";

export type HiringDocumentChecklist = Record<HiringDocumentKey, boolean>;

export type HiringSignatureImages = {
	employeeSignatureImageDataUrl: string;
	ownerSignatureImageDataUrl: string;
};

export type HiringDraft = {
	address: string;
	birthDate: number | null;
	contractMemo: string;
	documents: HiringDocumentChecklist;
	employeeEmail: string;
	employeeName: string;
	hourlyWage: string;
	ownerEmail: string;
	ownerName: string;
	phone: string;
	phonePublic: boolean;
	selectedWorkplaceId: HiringWorkplaceId | null;
	shiftGroup: EmployeeShiftGroup;
	startDate: string;
	storeAddress: string;
	storeName: string;
	storePhone: string;
	workCondition: string;
	workDays: HiringWeekday[];
	workEndMinutes: number | null;
	workStartMinutes: number | null;
};

export type HiringContractPage = {
	html: string;
	id: string;
	title: string;
};

export type HiringContractResult = {
	contractId: string;
	employeeId: string;
	fileName: string;
	metadataUri: string;
	pdfUri: string;
	savedAt: string;
	sentAt: string;
	storageBucket: string | null;
	storagePath: string | null;
};

export type HiringContractRecord = {
	createdAt: string;
	draft: HiringDraft;
	employeeId: string;
	fileName: string;
	id: string;
	metadataUri: string;
	pdfUri: string;
	signedAt: string;
	storageBucket: string | null;
	storagePath: string | null;
};

export type HiringContractMetadata = {
	contractRecord: HiringContractRecord;
	draft: HiringDraft;
	fileName: string;
	pdfUri: string;
	signatures: HiringSignatureImages;
	signedAt: string;
	storageBucket: string | null;
	storagePath: string | null;
};

export const hiringWeekdays: HiringWeekday[] = ["월", "화", "수", "목", "금", "토", "일"];

export const hiringDocumentLabels: Record<HiringDocumentKey, string> = {
	healthCertificate: "보건증",
	bankbookCopy: "통장사본",
	idCardCopy: "신분증사본",
};

export const hiringDocumentKeys = Object.keys(hiringDocumentLabels) as HiringDocumentKey[];

export const hiringOwnerName = "김민석";

export const initialHiringDraft: HiringDraft = {
	employeeName: "",
	birthDate: null,
	phone: "",
	phonePublic: false,
	employeeEmail: "",
	address: "",
	selectedWorkplaceId: null,
	documents: {
		healthCertificate: false,
		bankbookCopy: false,
		idCardCopy: false,
	},
	startDate: "",
	workDays: [],
	workEndMinutes: null,
	workStartMinutes: null,
	shiftGroup: "미들",
	workCondition: "매장 운영 기준에 따라 음료 제조, 고객 응대, 매장 정리 및 위생 관리 업무를 수행합니다.",
	hourlyWage: "",
	ownerName: hiringOwnerName,
	ownerEmail: "",
	storeName: "",
	storeAddress: "",
	storePhone: "",
	contractMemo: "근무 중 알게 된 매장 운영 정보와 고객 정보를 외부에 공유하지 않습니다.",
};

export function isEmployeeInfoReady(draft: HiringDraft) {
	return Boolean(draft.birthDate) && [draft.employeeName, draft.phone, draft.employeeEmail, draft.address].every(value => value.trim().length > 0);
}

export function isWorkplaceReady(draft: HiringDraft) {
	return Boolean(draft.selectedWorkplaceId && draft.storeName && draft.storeAddress);
}

export function isDocumentChecklistReady(draft: HiringDraft) {
	return hiringDocumentKeys.every(key => draft.documents[key]);
}

export function isContractInfoReady(draft: HiringDraft) {
	return [draft.startDate, draft.workCondition, draft.contractMemo].every(value => value.trim().length > 0);
}

export function isWorkTermsReady(draft: HiringDraft) {
	return (
		draft.workDays.length > 0 &&
		draft.workStartMinutes !== null &&
		draft.workEndMinutes !== null &&
		draft.hourlyWage.trim().length > 0
	);
}

export function isHiringDraftReady(draft: HiringDraft) {
	return isEmployeeInfoReady(draft) && isWorkplaceReady(draft) && isDocumentChecklistReady(draft) && isContractInfoReady(draft) && isWorkTermsReady(draft);
}
