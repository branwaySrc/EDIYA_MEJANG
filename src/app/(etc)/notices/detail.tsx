import { useLocalSearchParams, useRouter } from "expo-router";

import { NoticeDetailView } from "@/components/features/notices/notice-detail-view";
import { AppLayout } from "@/components/global/app-layout";
import { appRoutes } from "@/constants/route";

function getRouteParam(value: string | string[] | undefined) {
	return Array.isArray(value) ? value[0] : value;
}

export default function NoticeDetailScreen() {
	const router = useRouter();
	const { id } = useLocalSearchParams<{ id?: string | string[] }>();
	const noticeId = getRouteParam(id);

	return (
		<AppLayout
			activeDrawerId="notices"
			drawerEnabled={false}
			leadingMode="back"
			onPressBack={() => {
				if (router.canGoBack()) {
					router.back();
					return;
				}

				router.replace("/notices");
			}}
			title={appRoutes.notices.label}
			type="scrollview"
		>
			<NoticeDetailView noticeId={noticeId} />
		</AppLayout>
	);
}
