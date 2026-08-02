import { useLocalSearchParams, useRouter } from "expo-router";

import { FindEditorForm } from "@/components/features/sajang/menu-management/find-editor-form";
import { RecipeEditorForm } from "@/components/features/sajang/menu-management/recipe-editor-form";
import { AppLayout } from "@/components/global/app-layout";
import type { FindEntryKind } from "@/database/find/find.type";

export default function SajangMenuEditorScreen() {
	const router = useRouter();
	const params = useLocalSearchParams<{
		id?: string;
		kind?: FindEntryKind;
		type?: "find" | "recipe";
	}>();
	const editorType = params.type === "find" ? "find" : "recipe";
	const editing = Boolean(params.id);

	return (
		<AppLayout
			activeDrawerId="owner-space"
			leadingMode="back"
			onPressBack={() => router.back()}
			scrollViewProps={{ keyboardShouldPersistTaps: "handled" }}
			title={`${editorType === "recipe" ? "메뉴" : "통합 아이템"} ${editing ? "수정" : "등록"}`}
			type="scrollview"
		>
			{editorType === "recipe" ? (
				<RecipeEditorForm recipeId={params.id} />
			) : (
				<FindEditorForm entryId={params.id} initialKind={params.kind} />
			)}
		</AppLayout>
	);
}
