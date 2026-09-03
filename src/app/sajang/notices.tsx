import { type Href, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";

import { AppSpacer } from "@/components/base/app-spacer";
import { AppText } from "@/components/base/app-text";
import type { ManagedContentType } from "@/components/features/sajang/content-management/content-editor-form";
import {
	ManagementHeaderAddButton,
	ManagementItemRow,
} from "@/components/features/sajang/management/management-ui";
import { AppLayout } from "@/components/global/app-layout";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { SearchBox } from "@/components/ui/search/search-box";
import { UnderlineTabMenu, type UnderlineTabItem } from "@/components/ui/underline-tab-menu";
import { AppColors, AppSpacing } from "@/constants/theme";
import { chosungSearch } from "@/lib/chosung-search";
import { useContentManagementStore } from "@/store/content-management-store";

const contentTabs: UnderlineTabItem<ManagedContentType>[] = [
	{ id: "notice", label: "공지사항" },
	{ id: "manual", label: "직원메뉴" },
	{ id: "tutorial", label: "튜토리얼" },
];

type ManagedListItem = {
	id: string;
	onDelete: () => void;
	onOpen: () => void;
	subtitle: string;
	title: string;
};

type PendingDelete = {
	id: string;
	title: string;
	type: ManagedContentType;
};

function EmptyList() {
	return (
		<View style={styles.empty}>
			<AppText.Base color={AppColors.placeholder}>표시할 항목이 없습니다.</AppText.Base>
		</View>
	);
}

export default function SajangNoticesScreen() {
	const router = useRouter();
	const notices = useContentManagementStore(state => state.notices);
	const manualCategories = useContentManagementStore(state => state.manualCategories);
	const manualEntries = useContentManagementStore(state => state.manualEntries);
	const tutorialTopics = useContentManagementStore(state => state.tutorialTopics);
	const tutorialEntries = useContentManagementStore(state => state.tutorialEntries);
	const contentSyncErrorMessage = useContentManagementStore(state => state.contentSyncErrorMessage);
	const contentSyncing = useContentManagementStore(state => state.contentSyncing);
	const deleteManualEntry = useContentManagementStore(state => state.deleteManualEntry);
	const deleteNotice = useContentManagementStore(state => state.deleteNotice);
	const deleteTutorialEntry = useContentManagementStore(state => state.deleteTutorialEntry);
	const hydrateManagedContentFromRemote = useContentManagementStore(state => state.hydrateManagedContentFromRemote);
	const [activeTabId, setActiveTabId] = useState<ManagedContentType>("notice");
	const [keyword, setKeyword] = useState("");
	const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);

	useEffect(() => {
		void hydrateManagedContentFromRemote();
	}, [hydrateManagedContentFromRemote]);

	const visibleItems = useMemo<ManagedListItem[]>(() => {
		let items: ManagedListItem[];

		if (activeTabId === "notice") {
			items = notices.map(notice => ({
				id: notice.id,
				onDelete: () => setPendingDelete({ id: notice.id, title: notice.title, type: "notice" }),
				onOpen: () =>
					router.push({
						pathname: "/notices/detail",
						params: { id: notice.id },
					} as Href),
				subtitle: [notice.shiftGroup, notice.description].filter(Boolean).join(" · ") || notice.uploadedAt,
				title: notice.title,
			}));
		} else if (activeTabId === "manual") {
			items = manualEntries.map(entry => ({
				id: entry.id,
				onDelete: () => setPendingDelete({ id: entry.id, title: entry.title, type: "manual" }),
				onOpen: () => router.push(`/manual/${entry.id}` as Href),
				subtitle: entry.description?.trim() || entry.shiftGroup || manualCategories.find(category => category.slug === entry.categorySlug)?.title || "직원메뉴",
				title: entry.title,
			}));
		} else {
			items = tutorialEntries.map(entry => ({
				id: entry.id,
				onDelete: () => setPendingDelete({ id: entry.id, title: entry.title, type: "tutorial" }),
				onOpen: () => router.push(`/manual/tutorial/${entry.id}` as Href),
				subtitle: entry.description?.trim() || entry.shiftGroup || tutorialTopics.find(topic => topic.slug === entry.topicSlug)?.title || "튜토리얼",
				title: entry.title,
			}));
		}

		return chosungSearch(
			{
				getText: item => item.title,
				query: keyword,
			},
			items,
		);
	}, [
		activeTabId,
		keyword,
		manualCategories,
		manualEntries,
		notices,
		router,
		tutorialEntries,
		tutorialTopics,
	]);

	const confirmDelete = () => {
		if (!pendingDelete) {
			return;
		}

		if (pendingDelete.type === "notice") {
			void deleteNotice(pendingDelete.id);
		} else if (pendingDelete.type === "manual") {
			void deleteManualEntry(pendingDelete.id);
		} else {
			void deleteTutorialEntry(pendingDelete.id);
		}

		setPendingDelete(null);
	};

	const openEditor = (id?: string) => {
		router.push({
			pathname: "/sajang/content-editor",
			params: {
				id,
				type: activeTabId,
			},
		} as Href);
	};

	return (
		<AppLayout
			activeDrawerId="owner-space"
			aside={<ManagementHeaderAddButton onPress={() => openEditor()} />}
			contentStyle={styles.content}
			leadingMode="back"
			onPressBack={() => router.back()}
			title="공지사항 및 메뉴얼"
			topSlot={<UnderlineTabMenu activeId={activeTabId} items={contentTabs} onChange={setActiveTabId} />}
			type="view"
		>
			<View style={styles.searchArea}>
				<SearchBox
					onChangeText={setKeyword}
					onSubmit={() => undefined}
					placeholder={`${contentTabs.find(tab => tab.id === activeTabId)?.label ?? ""} 검색`}
					showSubmitButton={false}
					value={keyword}
				/>
			</View>
			<FlatList
				contentContainerStyle={visibleItems.length === 0 ? styles.emptyContent : styles.listContent}
				data={visibleItems}
				ItemSeparatorComponent={() => <AppSpacer style={styles.separator} />}
				keyExtractor={item => item.id}
				keyboardShouldPersistTaps="handled"
				ListEmptyComponent={contentSyncing ? null : <EmptyList />}
				ListHeaderComponent={
					<>
						{contentSyncing ? (
							<View style={styles.loadingBox}>
								<AppText.Sm color={AppColors.sub}>데이터를 불러오고 있습니다</AppText.Sm>
							</View>
						) : null}
						{contentSyncErrorMessage ? (
							<AppText.Sm color="#B91C1C" style={styles.syncError}>
								{contentSyncErrorMessage}
							</AppText.Sm>
						) : null}
					</>
				}
				renderItem={({ item }) => (
					<ManagementItemRow
						badge={contentTabs.find(tab => tab.id === activeTabId)?.label}
						onDelete={item.onDelete}
						onEdit={() => openEditor(item.id)}
						onPress={item.onOpen}
						subtitle={item.subtitle}
						title={item.title}
					/>
				)}
				style={styles.list}
			/>
			<ConfirmDialog
				confirmLabel="삭제"
				message={`${pendingDelete?.title ?? "선택한 항목"}을 정말로 삭제하시겠습니까?`}
				onCancel={() => setPendingDelete(null)}
				onConfirm={confirmDelete}
				open={pendingDelete !== null}
				title="삭제 확인"
			/>
		</AppLayout>
	);
}

const styles = StyleSheet.create({
	content: {
		flex: 1,
	},
	searchArea: {
		borderBottomWidth: 1,
		borderBottomColor: "rgba(71, 85, 105, 0.16)",
		padding: AppSpacing.md,
	},
	list: {
		flex: 1,
	},
	listContent: {
		paddingBottom: AppSpacing.xl,
	},
	emptyContent: {
		flexGrow: 1,
	},
	separator: {
		opacity: 0.32,
	},
	empty: {
		flex: 1,
		minHeight: 180,
		alignItems: "center",
		justifyContent: "center",
		padding: AppSpacing.md,
	},
	loadingBox: {
		minHeight: 64,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "#F4F9FF",
		marginBottom: AppSpacing.sm,
	},
	syncError: {
		marginBottom: AppSpacing.sm,
		paddingHorizontal: AppSpacing.md,
	},
});
