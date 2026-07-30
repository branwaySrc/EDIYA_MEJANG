import type {
	TutorialContentBlock,
	TutorialEntry,
	TutorialEntryBlockRecord,
	TutorialEntryRecord,
	TutorialTopic,
	TutorialTopicRecord,
} from "@/database/tutorial/tutorial.type";

const fallbackImage = require("../../../assets/images/skeleton/fallbackImg.jpg");

export const tutorialTopicRecords: TutorialTopicRecord[] = [
	{
		id: "topic-store-dispatch",
		slug: "store-dispatch",
		title: "가게배차 받는 방법",
		description: "배달 앱에서 매장 직접 배차를 접수하는 절차",
		icon_name: "bicycle-outline",
		sort_order: 1,
		is_active: true,
	},
	{
		id: "topic-close-kiosk",
		slug: "close-kiosk",
		title: "마감하는 방법(키오스크)",
		description: "키오스크 마감 처리와 출력물 확인",
		icon_name: "tablet-landscape-outline",
		sort_order: 2,
		is_active: true,
	},
	{
		id: "topic-close-pos",
		slug: "close-pos",
		title: "마감하는 방법(포스)",
		description: "포스 마감 정산과 결제 내역 확인",
		icon_name: "card-outline",
		sort_order: 3,
		is_active: true,
	},
	{
		id: "topic-popcorn",
		slug: "popcorn",
		title: "팝콘 튀기는 방법",
		description: "팝콘 제조 전 준비와 보관 기준",
		icon_name: "restaurant-outline",
		sort_order: 4,
		is_active: true,
	},
	{
		id: "topic-bill-paper",
		slug: "bill-paper",
		title: "빌지 갈아 끼우는 방법",
		description: "영수증 용지 교체와 테스트 출력",
		icon_name: "receipt-outline",
		sort_order: 5,
		is_active: true,
	},
	{
		id: "topic-awning",
		slug: "awning",
		title: "야외 천막어닝 작동 방법",
		description: "어닝 리모컨 조작과 날씨별 주의사항",
		icon_name: "partly-sunny-outline",
		sort_order: 6,
		is_active: true,
	},
	{
		id: "topic-return-kiosk",
		slug: "return-kiosk",
		title: "반품하는방법(키오스크)",
		description: "키오스크 주문 취소와 환불 처리",
		icon_name: "return-up-back-outline",
		sort_order: 7,
		is_active: true,
	},
	{
		id: "topic-return-pos",
		slug: "return-pos",
		title: "반품하는방법(포스)",
		description: "포스 결제 취소와 영수증 확인",
		icon_name: "swap-horizontal-outline",
		sort_order: 8,
		is_active: true,
	},
];

export const tutorialEntryRecords: TutorialEntryRecord[] = [
	{ id: "store-dispatch-ready", topic_slug: "store-dispatch", title: "배차 전 확인", sort_order: 1, is_published: true },
	{ id: "store-dispatch-flow", topic_slug: "store-dispatch", title: "가게배차 접수 순서", sort_order: 2, is_published: true },
	{ id: "close-kiosk-ready", topic_slug: "close-kiosk", title: "키오스크 마감 전 확인", sort_order: 1, is_published: true },
	{ id: "close-kiosk-flow", topic_slug: "close-kiosk", title: "키오스크 마감 순서", sort_order: 2, is_published: true },
	{ id: "close-pos-ready", topic_slug: "close-pos", title: "포스 마감 전 확인", sort_order: 1, is_published: true },
	{ id: "close-pos-flow", topic_slug: "close-pos", title: "포스 마감 순서", sort_order: 2, is_published: true },
	{ id: "popcorn-ready", topic_slug: "popcorn", title: "팝콘 제조 전 준비", sort_order: 1, is_published: true },
	{ id: "popcorn-flow", topic_slug: "popcorn", title: "팝콘 튀기는 순서", sort_order: 2, is_published: true },
	{ id: "bill-paper-ready", topic_slug: "bill-paper", title: "용지 방향 확인", sort_order: 1, is_published: true },
	{ id: "bill-paper-flow", topic_slug: "bill-paper", title: "빌지 교체 순서", sort_order: 2, is_published: true },
	{ id: "awning-ready", topic_slug: "awning", title: "작동 전 확인", sort_order: 1, is_published: true },
	{ id: "awning-flow", topic_slug: "awning", title: "천막어닝 조작 순서", sort_order: 2, is_published: true },
	{ id: "return-kiosk-ready", topic_slug: "return-kiosk", title: "키오스크 반품 전 확인", sort_order: 1, is_published: true },
	{ id: "return-kiosk-flow", topic_slug: "return-kiosk", title: "키오스크 반품 순서", sort_order: 2, is_published: true },
	{ id: "return-pos-ready", topic_slug: "return-pos", title: "포스 반품 전 확인", sort_order: 1, is_published: true },
	{ id: "return-pos-flow", topic_slug: "return-pos", title: "포스 반품 순서", sort_order: 2, is_published: true },
];

export const tutorialEntryBlockRecords: TutorialEntryBlockRecord[] = [
	{
		id: "store-dispatch-ready-text",
		entry_id: "store-dispatch-ready",
		block_type: "text",
		body: "주문번호, 픽업 시간, 제조 완료 가능 시간을 먼저 확인합니다. 매장 상황상 늦어질 것 같으면 배차를 받기 전에 조리 시간을 조정합니다.",
		storage_path: null,
		alt_text: null,
		sort_order: 1,
	},
	{
		id: "store-dispatch-flow-text",
		entry_id: "store-dispatch-flow",
		block_type: "text",
		body: "배달 앱 주문 상세에서 가게배차 버튼을 누르고, 예상 준비 시간을 확인한 뒤 배차를 확정합니다. 기사님 도착 전 음료 누락과 옵션을 다시 확인합니다.",
		storage_path: null,
		alt_text: null,
		sort_order: 1,
	},
	{
		id: "store-dispatch-flow-image",
		entry_id: "store-dispatch-flow",
		block_type: "image",
		body: null,
		storage_path: "tutorial/store-dispatch.jpg",
		alt_text: "가게배차 화면 예시",
		sort_order: 2,
	},
	{
		id: "close-kiosk-ready-text",
		entry_id: "close-kiosk-ready",
		block_type: "text",
		body: "마지막 주문이 완료되었는지 확인하고, 키오스크 화면에 결제 진행 중인 건이 없는지 확인합니다.",
		storage_path: null,
		alt_text: null,
		sort_order: 1,
	},
	{
		id: "close-kiosk-flow-text",
		entry_id: "close-kiosk-flow",
		block_type: "text",
		body: "관리자 메뉴로 들어가 마감 메뉴를 선택한 뒤 출력물을 확인합니다. 출력이 안 되면 프린터 전원과 용지를 먼저 확인합니다.",
		storage_path: null,
		alt_text: null,
		sort_order: 1,
	},
	{
		id: "close-pos-ready-text",
		entry_id: "close-pos-ready",
		block_type: "text",
		body: "현금함, 카드 결제 내역, 배달 앱 정산 화면을 확인할 수 있게 준비합니다. 취소 건이 있으면 메모를 먼저 남깁니다.",
		storage_path: null,
		alt_text: null,
		sort_order: 1,
	},
	{
		id: "close-pos-flow-text",
		entry_id: "close-pos-flow",
		block_type: "text",
		body: "포스 마감 정산 메뉴에서 일 매출을 출력하고, 현금과 카드 내역 차이를 확인합니다. 차이가 있으면 금액과 주문번호를 같이 기록합니다.",
		storage_path: null,
		alt_text: null,
		sort_order: 1,
	},
	{
		id: "popcorn-ready-text",
		entry_id: "popcorn-ready",
		block_type: "text",
		body: "팝콘 재료, 계량컵, 보관 용기, 집게를 준비합니다. 튀김기 주변에 물기가 없는지 먼저 확인합니다.",
		storage_path: null,
		alt_text: null,
		sort_order: 1,
	},
	{
		id: "popcorn-flow-text",
		entry_id: "popcorn-flow",
		block_type: "text",
		body: "정해진 양만 넣고 뚜껑을 닫은 뒤 작동합니다. 튀겨진 뒤에는 충분히 식혀 눅눅해지지 않게 보관 용기에 옮깁니다.",
		storage_path: null,
		alt_text: null,
		sort_order: 1,
	},
	{
		id: "popcorn-flow-image",
		entry_id: "popcorn-flow",
		block_type: "image",
		body: null,
		storage_path: "tutorial/popcorn.jpg",
		alt_text: "팝콘 제조 예시",
		sort_order: 2,
	},
	{
		id: "bill-paper-ready-text",
		entry_id: "bill-paper-ready",
		block_type: "text",
		body: "용지의 인쇄면 방향을 확인합니다. 방향이 반대이면 출력은 되지만 글자가 보이지 않을 수 있습니다.",
		storage_path: null,
		alt_text: null,
		sort_order: 1,
	},
	{
		id: "bill-paper-flow-text",
		entry_id: "bill-paper-flow",
		block_type: "text",
		body: "프린터 커버를 열고 기존 심지를 제거한 뒤 새 용지를 넣습니다. 끝부분을 조금 빼낸 상태에서 커버를 닫고 테스트 출력합니다.",
		storage_path: null,
		alt_text: null,
		sort_order: 1,
	},
	{
		id: "awning-ready-text",
		entry_id: "awning-ready",
		block_type: "text",
		body: "비나 강풍이 있으면 작동하지 않습니다. 주변에 사람이나 물건이 없는지 확인한 뒤 조작합니다.",
		storage_path: null,
		alt_text: null,
		sort_order: 1,
	},
	{
		id: "awning-flow-text",
		entry_id: "awning-flow",
		block_type: "text",
		body: "리모컨의 펼침/접힘 버튼을 짧게 누르고 끝까지 움직이는지 확인합니다. 중간에 걸리는 소리가 나면 즉시 정지하고 사장님께 공유합니다.",
		storage_path: null,
		alt_text: null,
		sort_order: 1,
	},
	{
		id: "return-kiosk-ready-text",
		entry_id: "return-kiosk-ready",
		block_type: "text",
		body: "주문번호, 결제 수단, 고객 요청 내용을 확인합니다. 이미 제조가 완료된 건은 환불 전 반드시 사장님께 확인합니다.",
		storage_path: null,
		alt_text: null,
		sort_order: 1,
	},
	{
		id: "return-kiosk-flow-text",
		entry_id: "return-kiosk-flow",
		block_type: "text",
		body: "키오스크 관리자 화면에서 해당 주문을 찾아 취소 또는 반품 처리를 진행합니다. 처리 후 영수증이나 취소 화면을 확인합니다.",
		storage_path: null,
		alt_text: null,
		sort_order: 1,
	},
	{
		id: "return-pos-ready-text",
		entry_id: "return-pos-ready",
		block_type: "text",
		body: "카드 결제인지 현금 결제인지 먼저 확인하고, 원 결제 영수증 또는 주문번호를 준비합니다.",
		storage_path: null,
		alt_text: null,
		sort_order: 1,
	},
	{
		id: "return-pos-flow-text",
		entry_id: "return-pos-flow",
		block_type: "text",
		body: "포스에서 반품/취소 메뉴를 선택하고 원 거래를 조회합니다. 취소 완료 후 출력물을 보관하고 특이사항을 공유합니다.",
		storage_path: null,
		alt_text: null,
		sort_order: 1,
	},
];

export function toTutorialTopic(record: TutorialTopicRecord): TutorialTopic {
	return {
		description: record.description,
		icon: record.icon_name,
		slug: record.slug,
		title: record.title,
	};
}

export function toTutorialContentBlock(record: TutorialEntryBlockRecord): TutorialContentBlock {
	if (record.block_type === "image") {
		return {
			alt: record.alt_text ?? "튜토리얼 이미지",
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

export function toTutorialEntry(record: TutorialEntryRecord, blockRecords: TutorialEntryBlockRecord[]): TutorialEntry {
	return {
		blocks: blockRecords
			.filter(block => block.entry_id === record.id)
			.sort((a, b) => a.sort_order - b.sort_order)
			.map(toTutorialContentBlock),
		id: record.id,
		title: record.title,
		topicSlug: record.topic_slug,
	};
}

export function getTutorialTopicsSnapshot(): TutorialTopic[] {
	return tutorialTopicRecords
		.filter(topic => topic.is_active)
		.sort((a, b) => a.sort_order - b.sort_order)
		.map(toTutorialTopic);
}

export function getTutorialTopicSnapshot(slug?: string): TutorialTopic | undefined {
	return getTutorialTopicsSnapshot().find(topic => topic.slug === slug);
}

export function getTutorialEntriesByTopicSnapshot(slug?: string): TutorialEntry[] {
	return tutorialEntryRecords
		.filter(entry => entry.is_published && entry.topic_slug === slug)
		.sort((a, b) => a.sort_order - b.sort_order)
		.map(entry => toTutorialEntry(entry, tutorialEntryBlockRecords));
}

export async function fetchTutorialTopics(): Promise<TutorialTopic[]> {
	return getTutorialTopicsSnapshot();
}

export async function fetchTutorialTopic(slug?: string): Promise<TutorialTopic | undefined> {
	return getTutorialTopicSnapshot(slug);
}

export async function fetchTutorialEntriesByTopic(slug?: string): Promise<TutorialEntry[]> {
	return getTutorialEntriesByTopicSnapshot(slug);
}
