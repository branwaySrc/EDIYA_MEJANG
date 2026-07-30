import { getChosung } from "@/lib/chosung-search";
import type { FindEntry, FindMaterialEntry, FindPosEntry } from "@/database/find/find.type";
export type {
	FindEntry,
	FindEntryKind,
	FindMaterialDetailBlock,
	FindMaterialDetailImage,
	FindMaterialEntry,
	FindPosEntry,
} from "@/database/find/find.type";
export { findEntryDetailTitleLabels, findEntryKindLabels } from "@/database/find/find.type";

const sampleTimestamp = "2026-07-31T00:00:00.000Z";
const fallbackImage = require("../../../assets/images/skeleton/fallbackImg.jpg");

function withChosung<T extends Omit<FindEntry, "chosung" | "updatedAt">>(entry: T): T & { chosung: string; updatedAt: string } {
	return {
		...entry,
		chosung: getChosung(entry.title).replace(/\s/g, ""),
		updatedAt: sampleTimestamp,
	};
}

export const sampleFindMaterialEntries: FindMaterialEntry[] = [
	withChosung({
		id: "signature-base-material",
		recipeId: "signature-base",
		kind: "material",
		title: "시그니처 베이스",
		summary: "원팩 상태와 소분통 상태를 확인합니다.",
		keywords: ["시그니처", "베이스", "원팩", "소분통", "소분"],
		materialGroups: [
			{
				id: "signature-base-material-group-pack",
				title: "원팩",
				description: "시그니처 베이스는 원팩 단위로 입고됩니다.",
				images: [
					{
						id: "signature-base-one-pack-image",
						alt: "시그니처 베이스 원팩 이미지",
						source: fallbackImage,
						title: "원팩",
					},
				],
			},
			{
				id: "signature-base-material-group-portion",
				title: "소분통",
				description: "사용분은 소분통에 따로 소분되어 있어야 합니다.",
				images: [
					{
						id: "signature-base-portion-container-image",
						alt: "시그니처 베이스 소분통 이미지",
						source: fallbackImage,
						title: "소분통",
					},
				],
			},
		],
		storageLocations: [
			{
				id: "signature-base-location-one-pack",
				title: "원팩 보관",
				description: "미개봉 원팩 보관 구역을 확인합니다.",
				images: [
					{
						id: "signature-base-location-one-pack-image",
						alt: "시그니처 베이스 원팩 보관 위치 이미지",
						source: fallbackImage,
						title: "원팩 보관",
					},
				],
			},
			{
				id: "signature-base-location-portion",
				title: "소분통 보관",
				description: "영업 중 사용하는 소분통 위치를 확인합니다.",
				images: [
					{
						id: "signature-base-location-portion-image",
						alt: "시그니처 베이스 소분통 보관 위치 이미지",
						source: fallbackImage,
						title: "소분통 보관",
					},
				],
			},
		],
		notes: "시그니처 베이스는 원팩으로 입고되며, 영업 중 사용할 분량은 소분통에 따로 소분되어 있어야 합니다.",
	}),
];

export const sampleFindPosEntries: FindPosEntry[] = [
	withChosung({
		id: "hot-americano-pos",
		recipeId: "hot-americano",
		kind: "pos",
		title: "HOT 아메리카노",
		summary: "POS 음료 메뉴에서 커피 카테고리로 진입합니다.",
		keywords: ["포스", "커피", "아메리카노", "핫아메리카노", "음료"],
		screenName: "음료",
		buttonLabel: "HOT 아메리카노",
		posImages: [
			{
				id: "hot-americano-pos-main-image",
				alt: "HOT 아메리카노 POS 위치 이미지",
				source: fallbackImage,
				title: "POS 위치",
			},
		],
		posPath: ["메인", "음료", "커피", "HOT 아메리카노"],
		notes: "HOT/ICED와 사이즈를 먼저 선택한 뒤 옵션을 확인합니다.",
	}),
	withChosung({
		id: "hot-cafe-latte-pos",
		recipeId: "hot-cafe-latte",
		kind: "pos",
		title: "HOT 카페라떼",
		summary: "POS 음료 메뉴에서 커피 카테고리의 라떼 버튼을 찾습니다.",
		keywords: ["포스", "라떼", "카페라떼", "핫카페라떼", "음료"],
		screenName: "음료",
		buttonLabel: "HOT 카페라떼",
		posImages: [
			{
				id: "hot-cafe-latte-pos-main-image",
				alt: "HOT 카페라떼 POS 위치 이미지",
				source: fallbackImage,
				title: "POS 위치",
			},
		],
		posPath: ["메인", "음료", "커피", "HOT 카페라떼"],
		notes: "샷 추가나 우유 변경 옵션이 있으면 결제 전 확인합니다.",
	}),
	withChosung({
		id: "plain-bagel-pos",
		recipeId: "plain-bagel",
		kind: "pos",
		title: "플레인 베이글",
		summary: "POS 베이커리 메뉴에서 베이글 카테고리로 진입합니다.",
		keywords: ["포스", "베이글", "베이커리", "빵"],
		screenName: "베이커리",
		buttonLabel: "플레인 베이글",
		posImages: [
			{
				id: "plain-bagel-pos-main-image",
				alt: "플레인 베이글 POS 위치 이미지",
				source: fallbackImage,
				title: "POS 위치",
			},
		],
		posPath: ["메인", "베이커리", "베이글", "플레인 베이글"],
		notes: "크림치즈 추가 구매 여부를 함께 확인합니다.",
	}),
];

export const sampleFindEntries: FindEntry[] = [...sampleFindMaterialEntries, ...sampleFindPosEntries];
