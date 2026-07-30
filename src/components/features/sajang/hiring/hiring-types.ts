export type HiringWeekday = "월" | "화" | "수" | "목" | "금" | "토" | "일";

export type HiringDraft = {
	employeeName: string;
	age: string;
	birthDate: string;
	phone: string;
	employeeEmail: string;
	address: string;
	startDate: string;
	workDays: HiringWeekday[];
	workTime: string;
	workCondition: string;
	hourlyWage: string;
	ownerName: string;
	ownerEmail: string;
	storeName: string;
	storeAddress: string;
	storePhone: string;
	notice: string;
};

export type HiringContractPage = {
	id: string;
	title: string;
	html: string;
};

export type HiringContractResult = {
	fileName: string;
	metadataUri: string;
	pdfUri: string;
	sentAt: string;
	storageBucket: string | null;
	storagePath: string | null;
};

export type HiringContractMetadata = {
	draft: HiringDraft;
	fileName: string;
	pdfUri: string;
	signedAt: string;
	signatureImageDataUrl: string;
	storageBucket: string | null;
	storagePath: string | null;
};

export const hiringWeekdays: HiringWeekday[] = ["월", "화", "수", "목", "금", "토", "일"];

export const initialHiringDraft: HiringDraft = {
	employeeName: "",
	age: "",
	birthDate: "",
	phone: "",
	employeeEmail: "",
	address: "",
	startDate: "",
	workDays: [],
	workTime: "",
	workCondition: "이디야 월피동점 매장 운영 기준에 따라 근무하며, 세부 업무는 음료 제조, 고객 응대, 매장 정리 및 위생 관리로 합니다.",
	hourlyWage: "",
	ownerName: "사장",
	ownerEmail: "",
	storeName: "EDIYA-월피동점",
	storeAddress: "매장 주소 등록 예정",
	storePhone: "매장 전화번호 등록 예정",
	notice: "근무 중 알게 된 매장 운영 정보와 고객 정보는 외부에 공유하지 않습니다.",
};

export const requiredHiringDraftKeys = [
	"employeeName",
	"age",
	"phone",
	"employeeEmail",
	"startDate",
	"workTime",
	"hourlyWage",
	"ownerEmail",
] as const;

export function isHiringDraftReady(draft: HiringDraft) {
	return requiredHiringDraftKeys.every(key => draft[key].trim().length > 0) && draft.workDays.length > 0;
}
