import { forwardRef, useImperativeHandle, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";

import { AppIcon } from "@/components/base/app-icon";
import { AppText } from "@/components/base/app-text";
import { RecipeReferencePicker } from "@/components/features/sajang/menu-management/recipe-reference-picker";
import { DynamicTextList } from "@/components/features/sajang/management/dynamic-text-list";
import {
	ManagementActionButton,
	ManagementField,
	ManagementOptionSelector,
	ManagementSection,
} from "@/components/features/sajang/management/management-ui";
import {
	type ManagedVisualDraft,
	VisualEditorList,
} from "@/components/features/sajang/management/visual-editor-list";
import { AppColors, AppSpacing } from "@/constants/theme";
import type {
	FindEntry,
	FindEntryKind,
	FindMaterialDetailBlock,
	FindMaterialDetailImage,
	FindMaterialEntry,
	FindPosEntry,
} from "@/database/find/find.type";
import { getChosung } from "@/lib/chosung-search";
import {
	getFindEntryStoragePaths,
	getRemovedStoragePaths,
	removeContentImagesBestEffortAsync,
	uploadFindEntryImagesAsync,
} from "@/lib/sajang-content/supabase-content-images";
import { upsertSupabaseFindEntryAsync } from "@/lib/sajang-content/supabase-content-repository";
import { useAppToastStore } from "@/store/app-toast-store";
import { useSajangMenuContentStore } from "@/store/sajang-menu-content-store";

type FindBlockDraft = {
	id: string;
	images: ManagedVisualDraft[];
	title: string;
};

export type FindEditorFormRef = {
	save: () => Promise<void>;
};

const kindOptions: readonly { label: string; value: FindEntryKind }[] = [
	{ label: "재료", value: "material" },
	{ label: "POS", value: "pos" },
];

function getImageUri(image: FindMaterialDetailImage) {
	const source = image.image ?? image.source;

	if (source && typeof source === "object" && !Array.isArray(source) && "uri" in source) {
		return source.uri ?? "";
	}

	return "";
}

function imageToDraft(image: FindMaterialDetailImage): ManagedVisualDraft {
	return {
		desc: image.desc ?? "",
		id: image.id,
		imageUri: getImageUri(image),
		storagePath: image.storagePath,
		title: image.title ?? "",
	};
}

function draftToImage(image: ManagedVisualDraft): FindMaterialDetailImage {
	return {
		alt: image.title.trim() || "등록 이미지",
		desc: image.desc.trim() || undefined,
		id: image.id,
		source: image.imageUri ? { uri: image.imageUri } : undefined,
		storagePath: image.storagePath,
		title: image.title.trim() || undefined,
	};
}

function blockToDraft(block: FindMaterialDetailBlock): FindBlockDraft {
	return {
		id: block.id,
		images: (block.images ?? []).map(imageToDraft),
		title: block.title,
	};
}

function draftToBlock(block: FindBlockDraft): FindMaterialDetailBlock {
	return {
		id: block.id,
		images: block.images.map(draftToImage),
		title: block.title.trim() || "구분",
	};
}

function createBlockDraft(): FindBlockDraft {
	return {
		id: `block-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
		images: [],
		title: "",
	};
}

function FindBlockEditorList({
	addLabel,
	blocks,
	onChange,
}: {
	addLabel: string;
	blocks: FindBlockDraft[];
	onChange: (blocks: FindBlockDraft[]) => void;
}) {
	const moveBlock = (index: number, direction: -1 | 1) => {
		const targetIndex = index + direction;

		if (targetIndex < 0 || targetIndex >= blocks.length) {
			return;
		}

		const nextBlocks = [...blocks];
		[nextBlocks[index], nextBlocks[targetIndex]] = [nextBlocks[targetIndex], nextBlocks[index]];
		onChange(nextBlocks);
	};

	return (
		<View style={styles.blockList}>
			{blocks.map((block, index) => (
				<View key={block.id} style={styles.blockEditor}>
					<View style={styles.blockHeader}>
						<AppText.Base bold color={AppColors.primary}>
							구분 {index + 1}
						</AppText.Base>
						<View style={styles.blockActions}>
							<AppIcon.Sm
								accessibilityLabel={`구분 ${index + 1} 위로 이동`}
								disabled={index === 0}
								name="chevron-up"
								onPress={() => moveBlock(index, -1)}
							/>
							<AppIcon.Sm
								accessibilityLabel={`구분 ${index + 1} 아래로 이동`}
								disabled={index === blocks.length - 1}
								name="chevron-down"
								onPress={() => moveBlock(index, 1)}
							/>
							<AppIcon.Sm
								accessibilityLabel={`구분 ${index + 1} 삭제`}
								color="#B91C1C"
								name="trash-outline"
								onPress={() => onChange(blocks.filter((_, blockIndex) => blockIndex !== index))}
							/>
						</View>
					</View>
					<ManagementField
						label="구분 제목"
						onChangeText={title =>
							onChange(blocks.map((current, blockIndex) => (blockIndex === index ? { ...current, title } : current)))
						}
						placeholder="예: 원팩"
						value={block.title}
					/>
					<VisualEditorList
						onChange={images =>
							onChange(blocks.map((current, blockIndex) => (blockIndex === index ? { ...current, images } : current)))
						}
						visuals={block.images}
					/>
				</View>
			))}
			<ManagementActionButton icon="add-circle-outline" label={addLabel} onPress={() => onChange([...blocks, createBlockDraft()])} />
		</View>
	);
}

export const FindEditorForm = forwardRef<FindEditorFormRef, {
	entryId?: string;
	initialKind?: FindEntryKind;
}>(function FindEditorForm(
	{
		entryId,
		initialKind = "material",
	},
	ref,
) {
	const entries = useSajangMenuContentStore(state => state.findEntries);
	const recipes = useSajangMenuContentStore(state => state.recipes);
	const upsertFindEntry = useSajangMenuContentStore(state => state.upsertFindEntry);
	const showToast = useAppToastStore(state => state.showToast);
	const existingEntry = useMemo(
		() => entries.find(entry => entry.id === entryId),
		[entries, entryId],
	);
	const [kind, setKind] = useState<FindEntryKind>(existingEntry?.kind ?? initialKind);
	const [recipeId, setRecipeId] = useState(existingEntry?.recipeId ?? "");
	const [title, setTitle] = useState(existingEntry?.title ?? "");
	const [summary, setSummary] = useState(existingEntry?.summary ?? "");
	const [keywords, setKeywords] = useState(existingEntry?.keywords.join(", ") ?? "");
	const [notes, setNotes] = useState(existingEntry?.notes ?? "");
	const materialEntry = existingEntry?.kind === "material" ? existingEntry : undefined;
	const posEntry = existingEntry?.kind === "pos" ? existingEntry : undefined;
	const [materialGroups, setMaterialGroups] = useState<FindBlockDraft[]>(
		() => materialEntry?.materialGroups.map(blockToDraft) ?? [],
	);
	const [storageLocations, setStorageLocations] = useState<FindBlockDraft[]>(
		() => materialEntry?.storageLocations.map(blockToDraft) ?? [],
	);
	const [screenName, setScreenName] = useState(posEntry?.screenName ?? "");
	const [buttonLabel, setButtonLabel] = useState(posEntry?.buttonLabel ?? "");
	const [posPath, setPosPath] = useState<string[]>(posEntry?.posPath ?? []);
	const [posImages, setPosImages] = useState<ManagedVisualDraft[]>(
		() => posEntry?.posImages.map(imageToDraft) ?? [],
	);
	const [errorMessage, setErrorMessage] = useState("");

	const saveEntry = async () => {
		const trimmedTitle = title.trim();

		if (!trimmedTitle) {
			setErrorMessage("아이템명을 입력해 주세요.");
			return;
		}

		if (kind === "pos" && !recipeId) {
			setErrorMessage("연결할 메뉴를 선택해 주세요.");
			return;
		}

		const base = {
			chosung: getChosung(trimmedTitle).replace(/\s/g, ""),
			id: existingEntry?.id ?? `${kind}-${Date.now()}`,
			keywords: keywords
				.split(/[\n,]/)
				.map(keyword => keyword.trim())
				.filter(Boolean),
			notes: notes.trim() || undefined,
			recipeId: kind === "material" ? "" : recipeId,
			summary: summary.trim(),
			title: trimmedTitle,
			updatedAt: new Date().toISOString(),
		};
		let nextEntry: FindEntry;

		if (kind === "material") {
			nextEntry = {
				...base,
				kind,
				materialGroups: materialGroups.map(draftToBlock),
				storageLocations: storageLocations.map(draftToBlock),
			} satisfies FindMaterialEntry;
		} else {
			nextEntry = {
				...base,
				buttonLabel: buttonLabel.trim() || trimmedTitle,
				kind,
				posImages: posImages.map(draftToImage),
				posPath: posPath.map(path => path.trim()).filter(Boolean),
				screenName: screenName.trim() || "메인",
			} satisfies FindPosEntry;
		}

		let uploadedPaths: string[] = [];

		try {
			const uploadResult = await uploadFindEntryImagesAsync(nextEntry);
			const uploadedEntry = uploadResult.value;

			uploadedPaths = uploadResult.uploadedPaths;
			await upsertSupabaseFindEntryAsync({ entry: uploadedEntry });
			upsertFindEntry(uploadedEntry);
			if (uploadedEntry.kind === "material") {
				setMaterialGroups(uploadedEntry.materialGroups.map(blockToDraft));
				setStorageLocations(uploadedEntry.storageLocations.map(blockToDraft));
			} else {
				setPosImages(uploadedEntry.posImages.map(imageToDraft));
			}
			setErrorMessage("");
			showToast("저장이 완료되었습니다.");
			await removeContentImagesBestEffortAsync(
				getRemovedStoragePaths(
					getFindEntryStoragePaths(existingEntry),
					getFindEntryStoragePaths(uploadedEntry),
				),
			);
		} catch (error) {
			await removeContentImagesBestEffortAsync(uploadedPaths);
			console.error("Failed to save find entry to Supabase.", error);
			setErrorMessage("Supabase 저장에 실패했습니다.");
		}
	};

	useImperativeHandle(ref, () => ({ save: saveEntry }));

	return (
		<View style={styles.container}>
			<ManagementSection title="기본 정보">
				<ManagementOptionSelector label="관리 구분" onChange={setKind} options={kindOptions} value={kind} />
				{kind === "pos" ? (
					<RecipeReferencePicker onChange={setRecipeId} recipes={recipes} value={recipeId} />
				) : null}
				<ManagementField
					label="아이템명"
					onChangeText={setTitle}
					placeholder={kind === "material" ? "예: 시그니처 베이스" : "예: HOT 아메리카노"}
					value={title}
				/>
				<ManagementField
					label="요약"
					multiline
					onChangeText={setSummary}
					placeholder="목록에 표시할 짧은 설명"
					value={summary}
				/>
				<ManagementField
					label="검색 키워드"
					multiline
					onChangeText={setKeywords}
					placeholder="쉼표로 구분"
					value={keywords}
				/>
			</ManagementSection>

			{kind === "material" ? (
				<>
					<ManagementSection title="분류">
						<FindBlockEditorList addLabel="분류 추가" blocks={materialGroups} onChange={setMaterialGroups} />
					</ManagementSection>
					<ManagementSection title="위치">
						<FindBlockEditorList addLabel="위치 추가" blocks={storageLocations} onChange={setStorageLocations} />
					</ManagementSection>
				</>
			) : (
				<>
					<ManagementSection title="POS 위치">
						<ManagementField
							label="POS 화면명"
							onChangeText={setScreenName}
							placeholder="예: 음료"
							value={screenName}
						/>
						<ManagementField
							label="버튼명"
							onChangeText={setButtonLabel}
							placeholder="예: HOT 아메리카노"
							value={buttonLabel}
						/>
						<VisualEditorList addLabel="POS 이미지 추가" onChange={setPosImages} visuals={posImages} />
					</ManagementSection>
					<ManagementSection title="누르는 순서">
						<DynamicTextList
							addLabel="경로 추가"
							itemLabel="경로"
							onChange={setPosPath}
							values={posPath}
						/>
					</ManagementSection>
				</>
			)}

			<ManagementSection title="Memo">
				<ManagementField label="Memo" multiline onChangeText={setNotes} placeholder="추가 메모" value={notes} />
			</ManagementSection>

			{errorMessage ? (
				<View accessibilityLiveRegion="polite" style={styles.error}>
					<AppText.Sm bold color="#B91C1C">
						{errorMessage}
					</AppText.Sm>
				</View>
			) : null}

		</View>
	);
});

const styles = StyleSheet.create({
	container: {
		width: "100%",
		paddingBottom: AppSpacing.xl,
	},
	blockList: {
		width: "100%",
		gap: AppSpacing.md,
	},
	blockEditor: {
		width: "100%",
		gap: AppSpacing.md,
		borderWidth: 1,
		borderColor: "rgba(71, 85, 105, 0.22)",
		borderRadius: 4,
		padding: AppSpacing.md,
	},
	blockHeader: {
		minHeight: 40,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	blockActions: {
		flexDirection: "row",
	},
	error: {
		marginHorizontal: AppSpacing.md,
		marginTop: AppSpacing.md,
		borderWidth: 1,
		borderColor: "rgba(185, 28, 28, 0.28)",
		backgroundColor: "#FEF2F2",
		padding: AppSpacing.md,
	},
});
