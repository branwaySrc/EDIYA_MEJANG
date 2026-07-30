import { NoticeList } from "@/components/features/notices/notice-list";
import { AppLayout } from "@/components/global/app-layout";
import { appRoutes } from "@/constants/route";

export default function NoticesScreen() {
	return (
		<AppLayout activeDrawerId="notices" title={appRoutes.notices.label} type="scrollview">
			<NoticeList />
		</AppLayout>
	);
}
