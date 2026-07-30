import type {
	ManualCategory,
	ManualCategoryRecord,
	ManualContentBlock,
	ManualEntry,
	ManualEntryBlockRecord,
	ManualEntryRecord,
} from "@/database/manual/manual.type";

const fallbackImage = require("../../../assets/images/skeleton/fallbackImg.jpg");

export const manualCategoryRecords: ManualCategoryRecord[] = [
	{
		id: "category-open",
		slug: "open",
		title: "오픈",
		description: "영업 시작 전 준비와 오전 운영 체크리스트",
		icon_name: "sunny-outline",
		sort_order: 1,
		is_active: true,
	},
	{
		id: "category-middle",
		slug: "middle",
		title: "미들",
		description: "피크 타임 대응과 재고 보충 기준",
		icon_name: "time-outline",
		sort_order: 2,
		is_active: true,
	},
	{
		id: "category-close",
		slug: "close",
		title: "마감",
		description: "청소, 정산, 다음날 준비 절차",
		icon_name: "moon-outline",
		sort_order: 3,
		is_active: true,
	},
	{
		id: "category-delivery",
		slug: "delivery",
		title: "배달",
		description: "배달 접수, 포장, 전달 실수 방지 기준",
		icon_name: "bicycle-outline",
		sort_order: 4,
		is_active: true,
	},
	{
		id: "category-claim",
		slug: "claim",
		title: "클레임",
		description: "고객 불편 접수와 보고 대응 절차",
		icon_name: "alert-circle-outline",
		sort_order: 5,
		is_active: true,
	},
];

export const manualEntryRecords: ManualEntryRecord[] = [
	{ id: "open-ready", category_slug: "open", title: "오픈 전 매장 준비", sort_order: 1, is_published: true },
	{ id: "open-machine", category_slug: "open", title: "머신 예열과 첫 추출 확인", sort_order: 2, is_published: true },
	{ id: "middle-stock", category_slug: "middle", title: "피크 타임 재고 보충", sort_order: 1, is_published: true },
	{ id: "middle-handoff", category_slug: "middle", title: "교대 전 인수인계", sort_order: 2, is_published: true },
	{ id: "close-clean", category_slug: "close", title: "마감 청소 순서", sort_order: 1, is_published: true },
	{ id: "close-cash", category_slug: "close", title: "마감 정산 확인", sort_order: 2, is_published: true },
	{ id: "delivery-pack", category_slug: "delivery", title: "배달 포장 체크", sort_order: 1, is_published: true },
	{ id: "delivery-delay", category_slug: "delivery", title: "배달 지연 대응", sort_order: 2, is_published: true },
	{ id: "claim-first", category_slug: "claim", title: "클레임 첫 응대", sort_order: 1, is_published: true },
	{ id: "claim-report", category_slug: "claim", title: "클레임 기록과 보고", sort_order: 2, is_published: true },
];

export const manualEntryBlockRecords: ManualEntryBlockRecord[] = [
	{
		id: "open-ready-text",
		entry_id: "open-ready",
		block_type: "text",
		body: "간판, 조명, 출입문 주변 상태를 확인하고 포스, 키오스크, 배달 앱 접속 상태를 순서대로 점검합니다.",
		storage_path: null,
		alt_text: null,
		sort_order: 1,
	},
	{
		id: "open-ready-image",
		entry_id: "open-ready",
		block_type: "image",
		body: null,
		storage_path: "manual/open-ready.jpg",
		alt_text: "오픈 준비 예시 이미지",
		sort_order: 2,
	},
	{
		id: "open-machine-text",
		entry_id: "open-machine",
		block_type: "text",
		body: "에스프레소 머신 예열 상태를 확인한 뒤 첫 샷은 맛과 추출 시간을 함께 확인합니다. 이상이 있으면 바로 사장님께 공유합니다.",
		storage_path: null,
		alt_text: null,
		sort_order: 1,
	},
	{
		id: "middle-stock-text",
		entry_id: "middle-stock",
		block_type: "text",
		body: "컵, 빨대, 홀더, 시럽, 우유류는 피크 전에 한 번에 채웁니다. 손님 동선과 제조 동선을 막지 않는 위치부터 보충합니다.",
		storage_path: null,
		alt_text: null,
		sort_order: 1,
	},
	{
		id: "middle-handoff-text",
		entry_id: "middle-handoff",
		block_type: "text",
		body: "품절 예정 품목, 진행 중인 고객 요청, 배달 앱 특이사항을 다음 근무자에게 짧고 정확하게 전달합니다.",
		storage_path: null,
		alt_text: null,
		sort_order: 1,
	},
	{
		id: "close-clean-text",
		entry_id: "close-clean",
		block_type: "text",
		body: "제조대, 싱크대, 바닥, 홀 테이블 순서로 정리합니다. 세척 완료 물품은 완전히 물기를 뺀 뒤 지정 위치에 둡니다.",
		storage_path: null,
		alt_text: null,
		sort_order: 1,
	},
	{
		id: "close-cash-text",
		entry_id: "close-cash",
		block_type: "text",
		body: "포스 매출, 현금함, 배달 앱 정산 화면을 확인합니다. 차이가 있으면 금액과 상황을 메모해 공유합니다.",
		storage_path: null,
		alt_text: null,
		sort_order: 1,
	},
	{
		id: "delivery-pack-text",
		entry_id: "delivery-pack",
		block_type: "text",
		body: "주문번호, 음료 수량, 옵션, 빨대와 스푼, 영수증을 확인한 뒤 봉투를 닫습니다. 흔들림이 큰 음료는 컵홀더를 추가합니다.",
		storage_path: null,
		alt_text: null,
		sort_order: 1,
	},
	{
		id: "delivery-pack-image",
		entry_id: "delivery-pack",
		block_type: "image",
		body: null,
		storage_path: "manual/delivery-pack.jpg",
		alt_text: "배달 포장 예시 이미지",
		sort_order: 2,
	},
	{
		id: "delivery-delay-text",
		entry_id: "delivery-delay",
		block_type: "text",
		body: "제조 지연이 예상되면 배달 앱에서 조리 시간을 먼저 조정하고, 이미 접수된 주문은 매장 상황을 사장님께 공유합니다.",
		storage_path: null,
		alt_text: null,
		sort_order: 1,
	},
	{
		id: "claim-first-text",
		entry_id: "claim-first",
		block_type: "text",
		body: "먼저 불편을 인정하고 주문 정보와 상황을 확인합니다. 현장에서 판단하기 어려운 보상이나 환불은 즉시 사장님께 연결합니다.",
		storage_path: null,
		alt_text: null,
		sort_order: 1,
	},
	{
		id: "claim-report-text",
		entry_id: "claim-report",
		block_type: "text",
		body: "발생 시간, 주문 채널, 고객 요청, 응대한 내용을 남깁니다. 같은 문제가 반복되면 원인과 개선안을 함께 적습니다.",
		storage_path: null,
		alt_text: null,
		sort_order: 1,
	},
];

export function toManualCategory(record: ManualCategoryRecord): ManualCategory {
	return {
		description: record.description,
		icon: record.icon_name,
		slug: record.slug,
		title: record.title,
	};
}

export function toManualContentBlock(record: ManualEntryBlockRecord): ManualContentBlock {
	if (record.block_type === "image") {
		return {
			alt: record.alt_text ?? "매뉴얼 이미지",
			id: record.id,
			source: fallbackImage,
			type: "image",
		};
	}

	return {
		body: record.body ?? "",
		id: record.id,
		type: "text",
	};
}

export function toManualEntry(record: ManualEntryRecord, blockRecords: ManualEntryBlockRecord[]): ManualEntry {
	return {
		blocks: blockRecords
			.filter(block => block.entry_id === record.id)
			.sort((a, b) => a.sort_order - b.sort_order)
			.map(toManualContentBlock),
		categorySlug: record.category_slug,
		id: record.id,
		title: record.title,
	};
}

export function getManualCategoriesSnapshot(): ManualCategory[] {
	return manualCategoryRecords
		.filter(category => category.is_active)
		.sort((a, b) => a.sort_order - b.sort_order)
		.map(toManualCategory);
}

export function getManualCategorySnapshot(slug?: string): ManualCategory | undefined {
	return getManualCategoriesSnapshot().find(category => category.slug === slug);
}

export function getManualEntriesByCategorySnapshot(slug?: string): ManualEntry[] {
	return manualEntryRecords
		.filter(entry => entry.is_published && entry.category_slug === slug)
		.sort((a, b) => a.sort_order - b.sort_order)
		.map(entry => toManualEntry(entry, manualEntryBlockRecords));
}

export async function fetchManualCategories(): Promise<ManualCategory[]> {
	return getManualCategoriesSnapshot();
}

export async function fetchManualCategory(slug?: string): Promise<ManualCategory | undefined> {
	return getManualCategorySnapshot(slug);
}

export async function fetchManualEntriesByCategory(slug?: string): Promise<ManualEntry[]> {
	return getManualEntriesByCategorySnapshot(slug);
}
