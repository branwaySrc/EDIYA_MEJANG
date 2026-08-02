import { useLocalSearchParams, useRouter } from "expo-router";

import { VendorEditorForm } from "@/components/features/sajang/vendor-management/vendor-editor-form";
import { AppLayout } from "@/components/global/app-layout";

export default function SajangVendorEditorScreen() {
	const router = useRouter();
	const { id } = useLocalSearchParams<{ id?: string }>();

	return (
		<AppLayout
			activeDrawerId="owner-space"
			leadingMode="back"
			onPressBack={() => router.back()}
			scrollViewProps={{ keyboardShouldPersistTaps: "handled" }}
			title={`거래처 ${id ? "수정" : "등록"}`}
			type="scrollview"
		>
			<VendorEditorForm vendorId={id} />
		</AppLayout>
	);
}
