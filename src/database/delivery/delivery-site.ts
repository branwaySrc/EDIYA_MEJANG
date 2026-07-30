import type { DeliverySiteData, DeliverySiteId } from "@/database/delivery/delivery-site.type";

export const deliverySiteIds = ["baemin", "coupang-eats", "yogiyo", "ediya-order"] as const satisfies readonly DeliverySiteId[];

export const deliverySites: Record<DeliverySiteId, DeliverySiteData> = {
	baemin: {
		id: "baemin",
		tabLabel: "배민",
		title: "배민 어드민",
		uri: "https://self.baemin.com/bridge",
		credential: {
			username: "배민 계정 입력 예정",
			password: "비밀번호 입력 예정",
			description: "월피동점 계정",
		},
	},
	"coupang-eats": {
		id: "coupang-eats",
		tabLabel: "쿠팡",
		title: "쿠팡이츠 어드민",
		uri: "https://store.coupangeats.com/",
		credential: {
			username: "쿠팡이츠 계정 입력 예정",
			password: "비밀번호 입력 예정",
			description: "월피동점 계정",
		},
	},
	yogiyo: {
		id: "yogiyo",
		tabLabel: "요기요",
		title: "요기요 어드민",
		uri: "https://ceo.yogiyo.co.kr/",
		credential: {
			username: "요기요 계정 입력 예정",
			password: "비밀번호 입력 예정",
			description: "월피동점 계정",
		},
	},
	"ediya-order": {
		id: "ediya-order",
		tabLabel: "발주",
		title: "이디야 발주",
		uri: "https://oms.ediya.com/",
		credential: {
			username: "이디야 발주 계정 입력 예정",
			password: "비밀번호 입력 예정",
			description: "월피동점 계정",
		},
	},
};
