import { useLocalSearchParams, useRouter } from "expo-router";

import {
	ContentEditorForm,
	type ManagedContentType,
} from "@/components/features/sajang/content-management/content-editor-form";
import { AppLayout } from "@/components/global/app-layout";

const contentTypeLabels: Record<ManagedContentType, string> = {
	manual: "직원메뉴",
	notice: "공지사항",
	tutorial: "튜토리얼",
};

export default function SajangContentEditorScreen() {
	const router = useRouter();
	const params = useLocalSearchParams<{
		id?: string;
		type?: ManagedContentType;
	}>();
	const contentType: ManagedContentType =
		params.type === "manual" || params.type === "tutorial" ? params.type : "notice";

	return (
		<AppLayout
			activeDrawerId="owner-space"
			leadingMode="back"
			onPressBack={() => router.back()}
			scrollViewProps={{ keyboardShouldPersistTaps: "handled" }}
			title={`${contentTypeLabels[contentType]} ${params.id ? "수정" : "등록"}`}
			type="scrollview"
		>
			<ContentEditorForm contentId={params.id} contentType={contentType} />
		</AppLayout>
	);
}
