import type { Recipe } from "@/database/recipe/recipe.type";
import type { RecipeDetail, RecipeStep, RecipeVisual } from "@/database/recipe/recipe-details.type";
export type { RecipeDetail, RecipeStep, RecipeVisual } from "@/database/recipe/recipe-details.type";

type StoredRecipeDetail = Omit<RecipeDetail, "delivery"> & {
	delivery?: RecipeVisual[];
};

const detailByRecipeId: Partial<Record<string, StoredRecipeDetail>> = {
	"hot-americano": {
		heroVisuals: [
			{
				id: "americano-finished",
				title: "완성 이미지",
				description: "매장 제공 컵에 담긴 아메리카노 완성 상태",
			},
			{
				id: "americano-finished-sub",
				title: "제공 이미지",
				description: "제공 직전 컵 외관과 뚜껑 상태",
			},
		],
		steps: [
			{
				id: "americano-shot",
				title: "1. 샷 추출",
				details: ["포터필터와 추출 버튼을 확인합니다.", "샷은 추출 직후 바로 사용합니다.", "추출 흐름이 평소와 다르면 원두와 그라인더 상태를 확인합니다."],
				visuals: [
					{
						id: "americano-shot-visual",
						title: "샷 상태",
						description: "크레마와 추출량을 확인하는 이미지 자리",
					},
				],
			},
			{
				id: "americano-water",
				title: "2. 물/얼음 준비",
				details: ["컵 사이즈에 맞는 기준선을 먼저 확인합니다.", "ICED는 얼음이 너무 적어 보이지 않게 담습니다.", "HOT은 고객 전달 전 컵 외부 물기를 정리합니다."],
				visuals: [
					{
						id: "americano-water-visual",
						title: "컵 기준선",
						description: "물과 얼음 기준선을 보여주는 이미지 자리",
					},
				],
			},
			{
				id: "americano-finish",
				title: "3. 마감",
				details: ["샷을 부은 뒤 표면 상태를 확인합니다.", "뚜껑이 제대로 닫혔는지 눌러 확인합니다.", "포장 주문은 캐리어 고정 상태까지 확인합니다."],
				visuals: [
					{
						id: "americano-finish-visual",
						title: "제공 상태",
						description: "매장 서빙 또는 포장 완료 이미지 자리",
					},
				],
			},
		],
		storeServing: [
			{
				id: "americano-store",
				title: "매장 제공",
				description: "컵 외부 물기와 슬리브 위치를 정리한 뒤 제공",
			},
		],
		packaging: [
			{
				id: "americano-takeout",
				title: "포장 상태",
				description: "뚜껑 밀착, 캐리어 고정, 빨대/스틱 동봉 확인",
			},
		],
	},
	"hot-cafe-latte": {
		heroVisuals: [
			{
				id: "latte-finished",
				title: "완성 이미지",
				description: "우유와 에스프레소가 섞인 카페 라떼 완성 상태",
			},
			{
				id: "latte-finished-sub",
				title: "제공 이미지",
				description: "제공 직전 표면과 컵 외관 상태",
			},
		],
		steps: [
			{
				id: "latte-milk",
				title: "1. 우유 준비",
				details: ["HOT은 스팀 후 큰 기포를 정리합니다.", "ICED는 컵 기준선에 맞춰 차가운 우유를 먼저 담습니다.", "우유 개봉일과 보관 상태를 확인합니다."],
				visuals: [
					{
						id: "latte-milk-visual",
						title: "우유 기준",
						description: "우유 기준선과 스팀 상태 이미지 자리",
					},
				],
			},
			{
				id: "latte-shot",
				title: "2. 샷 결합",
				details: ["샷은 오래 방치하지 않고 바로 사용합니다.", "ICED는 층이 과하게 분리되지 않도록 천천히 부어줍니다.", "HOT은 컵 가장자리 거품을 정리합니다."],
				visuals: [
					{
						id: "latte-shot-visual",
						title: "결합 상태",
						description: "샷과 우유가 섞인 상태 이미지 자리",
					},
				],
			},
		],
		storeServing: [
			{
				id: "latte-store",
				title: "매장 제공",
				description: "라떼 표면과 컵 외부를 정리한 뒤 제공",
			},
		],
		packaging: [
			{
				id: "latte-takeout",
				title: "포장 상태",
				description: "HOT은 슬리브, ICED는 빨대와 뚜껑 밀착 확인",
			},
		],
	},
};

function createFallbackSteps(recipe: Recipe): RecipeStep[] {
	if (recipe.category === "베이커리") {
		return [
			{
				id: `${recipe.id}-check`,
				title: "1. 상품 상태 확인",
				details: ["제품명과 주문 내용을 대조합니다.", "파손, 눅눅함, 냉장/상온 보관 상태를 확인합니다.", "필요한 경우 데우기 또는 커팅 여부를 다시 확인합니다."],
				visuals: [
					{
						id: `${recipe.id}-check-visual`,
						title: "상품 상태",
						description: "제공 전 상품 상태 이미지 자리",
					},
				],
			},
			{
				id: `${recipe.id}-serve`,
				title: "2. 제공 준비",
				details: ["매장 제공은 접시와 포크 위치를 정리합니다.", "포장은 흔들리지 않게 담고 냅킨을 함께 준비합니다.", "온장 상품은 제공 온도를 마지막으로 확인합니다."],
				visuals: [
					{
						id: `${recipe.id}-serve-visual`,
						title: "제공 준비",
						description: "매장 접시 또는 포장 봉투 이미지 자리",
					},
				],
			},
		];
	}

	if (recipe.category === "이벤트") {
		return [
			{
				id: `${recipe.id}-guide`,
				title: "1. 행사 조건 확인",
				details: ["POS 적용 조건과 안내 문구를 확인합니다.", "세트 구성품 누락이 없는지 확인합니다.", "품절 또는 대체 안내가 필요한 경우 관리자에게 공유합니다."],
				visuals: [
					{
						id: `${recipe.id}-guide-visual`,
						title: "행사 안내",
						description: "행사 안내 이미지 자리",
					},
				],
			},
		];
	}

	return [
		{
			id: `${recipe.id}-base`,
			title: "1. 베이스 준비",
			details: ["주문 옵션과 사이즈를 먼저 확인합니다.", "베이스통 라벨과 보관 상태를 확인합니다.", "계량 기준이 있는 재료는 기준량을 맞춥니다."],
			visuals: [
				{
					id: `${recipe.id}-base-visual`,
					title: "베이스통",
					description: "레시피에 필요한 베이스통 또는 재료 이미지 자리",
				},
			],
		},
		{
			id: `${recipe.id}-finish`,
			title: "2. 제조 및 마감",
			details: ["제조 순서와 토핑 누락 여부를 확인합니다.", "컵 외부 물기와 뚜껑 밀착 상태를 정리합니다.", "포장 주문은 캐리어와 부자재를 함께 확인합니다."],
			visuals: [
				{
					id: `${recipe.id}-finish-visual`,
					title: "완성 상태",
					description: "매장 서빙 또는 포장 완료 이미지 자리",
				},
			],
		},
	];
}

export function getRecipeDetail(recipe: Recipe): RecipeDetail {
	const storedDetail = detailByRecipeId[recipe.id];

	if (storedDetail) {
		return {
			...storedDetail,
			delivery: storedDetail.delivery ?? storedDetail.packaging,
		};
	}

	return (
		{
			delivery: [
				{
					id: `${recipe.id}-delivery`,
					title: "諛곕떖",
					description: "諛곕떖 ?꾨즺 紐⑥뒿怨?怨좎젙 ?곹깭 ?대?吏 ?먮━",
				},
			],
			heroVisuals: [
				{
					id: `${recipe.id}-hero`,
					title: "대표 이미지",
					description: `${recipe.name} 완성 상태 이미지 자리`,
				},
				{
					id: `${recipe.id}-hero-sub`,
					title: "보조 이미지",
					description: `${recipe.name} 제공 상태 이미지 자리`,
				},
			],
			steps: createFallbackSteps(recipe),
			storeServing: [
				{
					id: `${recipe.id}-store`,
					title: "매장",
					description: "매장 제공 모습과 필요한 제공 도구 이미지 자리",
				},
			],
			packaging: [
				{
					id: `${recipe.id}-packaging`,
					title: "포장",
					description: "포장 완료 모습과 부자재 확인 이미지 자리",
				},
			],
		}
	);
}
