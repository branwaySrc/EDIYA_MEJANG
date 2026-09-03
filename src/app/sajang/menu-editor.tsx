import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef } from "react";

import {
	FindEditorForm,
	type FindEditorFormRef,
} from "@/components/features/sajang/menu-management/find-editor-form";
import {
	RecipeEditorForm,
	type RecipeEditorFormRef,
} from "@/components/features/sajang/menu-management/recipe-editor-form";
import { ManagementHeaderSaveButton } from "@/components/features/sajang/management/management-ui";
import { AppLayout } from "@/components/global/app-layout";
import type { FindEntryKind } from "@/database/find/find.type";

export default function SajangMenuEditorScreen() {
	const router = useRouter();
	const recipeEditorRef = useRef<RecipeEditorFormRef>(null);
	const findEditorRef = useRef<FindEditorFormRef>(null);
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
			aside={
				<ManagementHeaderSaveButton
					onPress={() => {
						if (editorType === "recipe") {
							void recipeEditorRef.current?.save();
							return;
						}

						void findEditorRef.current?.save();
					}}
				/>
			}
			leadingMode="back"
			onPressBack={() => router.back()}
			scrollViewProps={{ keyboardShouldPersistTaps: "handled" }}
			title={`${editorType === "recipe" ? "메뉴" : "통합 아이템"} ${editing ? "수정" : "등록"}`}
			type="scrollview"
		>
			{editorType === "recipe" ? (
				<RecipeEditorForm ref={recipeEditorRef} recipeId={params.id} />
			) : (
				<FindEditorForm ref={findEditorRef} entryId={params.id} initialKind={params.kind} />
			)}
		</AppLayout>
	);
}
