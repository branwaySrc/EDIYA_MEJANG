import { RoutePlaceholderScreen } from "@/components/features/route-placeholder-screen";
import { appRoutes } from "@/constants/route";

export default function MissingItemRequestScreen() {
	return (
		<RoutePlaceholderScreen
			activeDrawerId="missing-item-request"
			title={appRoutes["missing-item-request"].label}
			description="추후 이디야 물품 리스트 검색과 없는 물품 신청 기능이 구성될 화면입니다."
		/>
	);
}
