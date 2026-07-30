import type { Notice } from "@/database/notices/notice.type";

export type { Notice } from "@/database/notices/notice.type";

export const sampleNotices: Notice[] = [
	{
		id: "notice-2026-07-31-store-open",
		title: "오픈 전 체크리스트 확인 안내",
		uploadedAt: "2026-07-31",
		keywords: ["오픈", "체크리스트", "위생", "재고"],
		body: [
			"오픈 담당자는 영업 시작 전 머신 예열, 원두 잔량, 우유 유통기한, 베이커리 진열 상태를 순서대로 확인해 주세요.",
			"점검 중 누락되거나 보충이 필요한 항목은 사장님 공간에서 업데이트되는 공지와 함께 다시 안내될 예정입니다.",
		],
	},
	{
		id: "notice-2026-07-30-delivery-packaging",
		title: "배달 포장 스티커 부착 위치 변경",
		uploadedAt: "2026-07-30",
		keywords: ["배달", "포장", "스티커"],
		body: [
			"배달 음료 포장 시 스티커는 컵 뚜껑과 컵 본체가 함께 고정되도록 전면 중앙에 부착해 주세요.",
			"포장 전 주문명, 옵션, 수량을 한 번 더 확인한 뒤 픽업대에 전달해 주세요.",
		],
	},
	{
		id: "notice-2026-07-29-prepaid-customer",
		title: "선불 고객 잔액 확인 요청",
		uploadedAt: "2026-07-29",
		keywords: ["선불", "결제", "고객"],
		body: [
			"선불 고객 결제 처리 후에는 잔액이 정상 차감되었는지 화면에서 확인해 주세요.",
			"금액 정정이 필요한 경우 같은 근무 시간대 담당자에게 먼저 공유한 뒤 기록을 남겨 주세요.",
		],
	},
];

const noticesById = new Map(sampleNotices.map(notice => [notice.id, notice]));

export function getNoticesSnapshot() {
	return sampleNotices.map(notice => ({
		...notice,
		keywords: [...notice.keywords],
		body: [...notice.body],
	}));
}

export function getNoticeSnapshot(id?: string) {
	const notice = id ? noticesById.get(id) : undefined;

	if (!notice) {
		return undefined;
	}

	return {
		...notice,
		keywords: [...notice.keywords],
		body: [...notice.body],
	};
}

export async function fetchNotices() {
	return getNoticesSnapshot();
}

export async function fetchNotice(id?: string) {
	return getNoticeSnapshot(id);
}
