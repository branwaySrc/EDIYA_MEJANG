import { type Href, useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, View, type ImageSourcePropType } from "react-native";

import { AppIcon } from "@/components/base/app-icon";
import { AppPressable } from "@/components/base/app-pressable";
import { AppText } from "@/components/base/app-text";
import {
	ManagementActionButton,
	ManagementField,
	ManagementSection,
} from "@/components/features/sajang/management/management-ui";
import { ManagementImagePicker } from "@/components/features/sajang/management/visual-editor-list";
import { AppColors, AppSpacing } from "@/constants/theme";
import type {
	ManualContentBlock,
	ManualEntry,
	ManagedContentSection,
	ManagedContentShiftGroup,
} from "@/database/manual/manual.type";
import type { ManagedContentType } from "@/database/managed-content/managed-content.type";
import type { Notice } from "@/database/notices/notice.type";
import type {
	TutorialContentBlock,
	TutorialEntry,
} from "@/database/tutorial/tutorial.type";
import { getKoreaTodayKey } from "@/lib/korea-date";
import { useAppToastStore } from "@/store/app-toast-store";
import { useContentManagementStore } from "@/store/content-management-store";

export type { ManagedContentType } from "@/database/managed-content/managed-content.type";

type DocumentBlockDraft = {
	desc: string;
	id: string;
	imageUri: string;
	storagePath?: string;
	title: string;
};

const shiftGroupOptions: readonly ManagedContentShiftGroup[] = ["오픈", "미들", "마감"];
const shiftGroupSlugMap: Record<ManagedContentShiftGroup, "close" | "middle" | "open"> = {
	마감: "close",
	미들: "middle",
	오픈: "open",
};

function getImageUri(source: ImageSourcePropType) {
	if (typeof source === "object" && !Array.isArray(source) && source && "uri" in source) {
		return source.uri ?? "";
	}

	return "";
}

function createDocumentBlock(): DocumentBlockDraft {
	return {
		desc: "",
		id: `content-block-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
		imageUri: "",
		title: "",
	};
}

function sectionToDraft(section: ManagedContentSection): DocumentBlockDraft {
	return {
		desc: section.desc,
		id: section.id,
		imageUri: section.imageSource ? getImageUri(section.imageSource) : "",
		storagePath: section.storagePath,
		title: section.title,
	};
}

function legacyBlocksToDrafts(
	blocks: (ManualContentBlock | TutorialContentBlock)[],
	fallbackTitle: string,
): DocumentBlockDraft[] {
	if (blocks.length === 0) {
		return [createDocumentBlock()];
	}

	const desc = blocks
		.filter(block => block.type === "text")
		.map(block => block.body)
		.join("\n");
	const imageBlock = blocks.find(block => block.type === "image");

	return [
		{
			desc,
			id: `content-block-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
			imageUri: imageBlock && imageBlock.type === "image" ? getImageUri(imageBlock.source) : "",
			storagePath: imageBlock && imageBlock.type === "image" ? imageBlock.storagePath : undefined,
			title: fallbackTitle,
		},
	];
}

function legacyNoticeToDrafts(notice?: Notice): DocumentBlockDraft[] {
	if (!notice?.body.length) {
		return [createDocumentBlock()];
	}

	return notice.body.map((paragraph, index) => ({
		desc: paragraph,
		id: `content-block-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`,
		imageUri: "",
		title: index === 0 ? notice.title : `내용 ${index + 1}`,
	}));
}

function draftToSection(block: DocumentBlockDraft): ManagedContentSection {
	return {
		desc: block.desc.trim(),
		id: block.id,
		imageAlt: block.title.trim() || "내용 이미지",
		imageSource: block.imageUri ? { uri: block.imageUri } : undefined,
		storagePath: block.storagePath,
		title: block.title.trim(),
	};
}

function draftToContentBlocks(blocks: DocumentBlockDraft[]): ManualContentBlock[] {
	return blocks.flatMap(block => {
		const nextBlocks: ManualContentBlock[] = [];

		if (block.desc.trim()) {
			nextBlocks.push({
				body: block.desc.trim(),
				id: `${block.id}-text`,
				type: "text",
			});
		}

		if (block.imageUri) {
			nextBlocks.push({
				alt: block.title.trim() || "내용 이미지",
				id: `${block.id}-image`,
				source: { uri: block.imageUri },
				storagePath: block.storagePath,
				type: "image",
			});
		}

		return nextBlocks;
	});
}

function DocumentSectionEditor({
	sections,
	onChange,
}: {
	sections: DocumentBlockDraft[];
	onChange: (sections: DocumentBlockDraft[]) => void;
}) {
	const updateBlock = (index: number, nextBlock: DocumentBlockDraft) => {
		onChange(sections.map((block, blockIndex) => (blockIndex === index ? nextBlock : block)));
	};

	const moveBlock = (index: number, direction: -1 | 1) => {
		const targetIndex = index + direction;

		if (targetIndex < 0 || targetIndex >= sections.length) {
			return;
		}

		const nextBlocks = [...sections];
		[nextBlocks[index], nextBlocks[targetIndex]] = [nextBlocks[targetIndex], nextBlocks[index]];
		onChange(nextBlocks);
	};

	return (
		<View style={styles.blockList}>
			{sections.map((block, index) => (
				<View key={block.id} style={styles.blockEditor}>
					<View style={styles.blockHeader}>
						<AppText.Base bold color={AppColors.primary}>
							내용 {index + 1}
						</AppText.Base>
						<View style={styles.blockActions}>
							<AppIcon.Sm
								accessibilityLabel={`내용 ${index + 1} 위로 이동`}
								disabled={index === 0}
								name="chevron-up"
								onPress={() => moveBlock(index, -1)}
							/>
							<AppIcon.Sm
								accessibilityLabel={`내용 ${index + 1} 아래로 이동`}
								disabled={index === sections.length - 1}
								name="chevron-down"
								onPress={() => moveBlock(index, 1)}
							/>
							<AppIcon.Sm
								accessibilityLabel={`내용 ${index + 1} 삭제`}
								color="#B91C1C"
								name="trash-outline"
								onPress={() => onChange(sections.filter((_, blockIndex) => blockIndex !== index))}
							/>
						</View>
					</View>

					<ManagementField
						label="세부제목"
						onChangeText={title => updateBlock(index, { ...block, title })}
						placeholder="아코디언 제목"
						value={block.title}
					/>
					<ManagementField
						label="세부설명"
						multiline
						onChangeText={desc => updateBlock(index, { ...block, desc })}
						placeholder="아코디언 안에 보여줄 설명"
						value={block.desc}
					/>
					<ManagementImagePicker
						accessibilityLabel={`내용 이미지 ${index + 1} 선택`}
						imageUri={block.imageUri}
						onChange={imageUri => updateBlock(index, { ...block, imageUri, storagePath: undefined })}
					/>
				</View>
			))}
			<View style={styles.addBlockActions}>
				<ManagementActionButton icon="add-circle-outline" label="내용 추가" onPress={() => onChange([...sections, createDocumentBlock()])} />
			</View>
		</View>
	);
}

export function ContentEditorForm({
	contentId,
	contentType,
}: {
	contentId?: string;
	contentType: ManagedContentType;
}) {
	const router = useRouter();
	const manualEntries = useContentManagementStore(state => state.manualEntries);
	const notices = useContentManagementStore(state => state.notices);
	const tutorialEntries = useContentManagementStore(state => state.tutorialEntries);
	const upsertManualEntry = useContentManagementStore(state => state.upsertManualEntry);
	const upsertNotice = useContentManagementStore(state => state.upsertNotice);
	const upsertTutorialEntry = useContentManagementStore(state => state.upsertTutorialEntry);
	const showToast = useAppToastStore(state => state.showToast);
	const existingNotice = contentType === "notice" ? notices.find(item => item.id === contentId) : undefined;
	const existingManual = contentType === "manual" ? manualEntries.find(item => item.id === contentId) : undefined;
	const existingTutorial = contentType === "tutorial" ? tutorialEntries.find(item => item.id === contentId) : undefined;
	const [title, setTitle] = useState(existingNotice?.title ?? existingManual?.title ?? existingTutorial?.title ?? "");
	const [description, setDescription] = useState(existingNotice?.description ?? existingManual?.description ?? existingTutorial?.description ?? "");
	const [shiftGroup, setShiftGroup] = useState<ManagedContentShiftGroup>(
		existingNotice?.shiftGroup ?? existingManual?.shiftGroup ?? existingTutorial?.shiftGroup ?? "오픈",
	);
	const [blocks, setBlocks] = useState<DocumentBlockDraft[]>(
		() => {
			const existingSections = existingNotice?.sections ?? existingManual?.sections ?? existingTutorial?.sections;

			if (existingSections?.length) {
				return existingSections.map(sectionToDraft);
			}

			if (contentType === "notice") {
				return legacyNoticeToDrafts(existingNotice);
			}

			return legacyBlocksToDrafts(existingManual?.blocks ?? existingTutorial?.blocks ?? [], existingManual?.title ?? existingTutorial?.title ?? "");
		},
	);
	const [errorMessage, setErrorMessage] = useState("");
	const [submitting, setSubmitting] = useState(false);

	const saveContent = async () => {
		if (submitting) {
			return;
		}

		const trimmedTitle = title.trim();
		const contentSections = blocks
			.map(draftToSection)
			.filter(section => section.title || section.desc || section.imageSource);

		if (!trimmedTitle) {
			setErrorMessage("제목을 입력해 주세요.");
			return;
		}

		if (contentSections.length === 0) {
			setErrorMessage("내용을 1개 이상 입력해 주세요.");
			return;
		}

		if (contentSections.some(section => !section.title)) {
			setErrorMessage("각 내용의 세부제목을 입력해 주세요.");
			return;
		}

		setSubmitting(true);

		try {
			if (contentType === "notice") {
				const body = contentSections.map(section => section.desc).filter(Boolean);
				const notice: Notice = {
					body,
					description: description.trim(),
					id: existingNotice?.id ?? `notice-${Date.now()}`,
					keywords: [trimmedTitle, description, ...contentSections.flatMap(section => [section.title, section.desc])]
						.join(" ")
						.split(/\s+/)
						.map(keyword => keyword.trim())
						.filter(Boolean)
						.slice(0, 8),
					sections: contentSections,
					shiftGroup,
					title: trimmedTitle,
					uploadedAt: existingNotice?.uploadedAt ?? getKoreaTodayKey(),
				};

				await upsertNotice(notice);
			} else if (contentType === "manual") {
				const entry: ManualEntry = {
					blocks: draftToContentBlocks(blocks),
					categorySlug: shiftGroupSlugMap[shiftGroup],
					description: description.trim(),
					id: existingManual?.id ?? `manual-${Date.now()}`,
					sections: contentSections,
					shiftGroup,
					title: trimmedTitle,
				};

				await upsertManualEntry(entry);
			} else {
				const entry: TutorialEntry = {
					blocks: draftToContentBlocks(blocks),
					description: description.trim(),
					id: existingTutorial?.id ?? `tutorial-${Date.now()}`,
					sections: contentSections,
					shiftGroup,
					title: trimmedTitle,
					topicSlug: existingTutorial?.topicSlug ?? "store-dispatch",
				};

				await upsertTutorialEntry(entry);
			}
		} catch {
			setErrorMessage("Supabase 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.");
			setSubmitting(false);
			return;
		}

		setErrorMessage("");
		setSubmitting(false);
		showToast("저장이 완료되었습니다.");

		if (router.canGoBack()) {
			router.back();
			return;
		}

		router.replace("/sajang/notices" as Href);
	};

	return (
		<View style={styles.container}>
			<ManagementSection title="기본 정보">
				<ManagementField label="제목" onChangeText={setTitle} placeholder="게시판 제목" value={title} />
				<ManagementField label="설명" multiline onChangeText={setDescription} placeholder="제목 아래에 표시할 설명" value={description} />
				<View style={styles.shiftField}>
					<AppText.Sm bold color={AppColors.sub}>
						근무 구분
					</AppText.Sm>
					<View style={styles.shiftOptions}>
						{shiftGroupOptions.map(option => {
							const selected = option === shiftGroup;

							return (
								<AppPressable
									key={option}
									accessibilityLabel={`${option} 선택`}
									accessibilityRole="radio"
									accessibilityState={{ checked: selected }}
									onPress={() => setShiftGroup(option)}
									pressedColor="rgba(0, 75, 147, 0.08)"
									radius="base"
									style={[styles.shiftOption, selected ? styles.selectedShiftOption : null]}
								>
									<AppText.Base bold={selected} color={selected ? AppColors.textOnPrimary : AppColors.text}>
										{option}
									</AppText.Base>
								</AppPressable>
							);
						})}
					</View>
				</View>
			</ManagementSection>

			<ManagementSection title="내용">
				<DocumentSectionEditor sections={blocks} onChange={setBlocks} />
			</ManagementSection>

			{errorMessage ? (
				<View accessibilityLiveRegion="polite" style={styles.error}>
					<AppText.Sm bold color="#B91C1C">
						{errorMessage}
					</AppText.Sm>
				</View>
			) : null}

			<View style={styles.saveArea}>
				<AppPressable
					accessibilityLabel="콘텐츠 저장"
					disabled={submitting}
					onPress={() => void saveContent()}
					pressedColor="#003E7A"
					radius="base"
					style={[styles.saveButton, submitting ? styles.saveButtonDisabled : null]}
				>
					<AppIcon.Sm color={AppColors.textOnPrimary} name="save-outline" pressable={false} />
					<AppText.Base bold color={AppColors.textOnPrimary}>
						{submitting ? "저장 중" : "저장"}
					</AppText.Base>
				</AppPressable>
			</View>
		</View>
	);
}

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
	addBlockActions: {
		gap: AppSpacing.sm,
	},
	shiftField: {
		width: "100%",
		gap: AppSpacing.xs,
	},
	shiftOptions: {
		width: "100%",
		flexDirection: "row",
		gap: AppSpacing.xs,
	},
	shiftOption: {
		minHeight: 44,
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		borderWidth: 1,
		borderColor: "rgba(71, 85, 105, 0.28)",
		backgroundColor: AppColors.background,
		paddingHorizontal: AppSpacing.sm,
	},
	selectedShiftOption: {
		borderColor: AppColors.primary,
		backgroundColor: AppColors.primary,
	},
	error: {
		marginHorizontal: AppSpacing.md,
		marginTop: AppSpacing.md,
		borderWidth: 1,
		borderColor: "rgba(185, 28, 28, 0.28)",
		backgroundColor: "#FEF2F2",
		padding: AppSpacing.md,
	},
	saveArea: {
		padding: AppSpacing.md,
	},
	saveButton: {
		minHeight: 52,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: AppSpacing.sm,
		backgroundColor: AppColors.primary,
	},
	saveButtonDisabled: {
		opacity: 0.45,
	},
});
