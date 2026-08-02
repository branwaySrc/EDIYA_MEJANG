import { useMemo } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";

import { AppBadge } from "@/components/base/app-badge";
import { AppIcon } from "@/components/base/app-icon";
import { AppPressable } from "@/components/base/app-pressable";
import { AppSpacer } from "@/components/base/app-spacer";
import { AppText } from "@/components/base/app-text";
import { AppColors, AppSpacing } from "@/constants/theme";
import {
	findEntryKindLabels,
	type FindEntry,
	type FindEntryKind,
} from "@/database/find/find";
import {
	chosungSearchWithMatches,
	type ChosungSearchHighlightRange,
	type ChosungSearchMatch,
} from "@/lib/chosung-search";
import { useContentManagementStore } from "@/store/content-management-store";

export type FindResultListProps = {
	activeKind: FindEntryKind;
	keyword?: string;
	onOpenEntry?: (entry: FindEntry) => void;
	results?: FindEntry[];
};

function HighlightedTitle({ highlightRange, title }: { highlightRange?: ChosungSearchHighlightRange; title: string }) {
	const titleChars = [...title];

	if (!highlightRange || highlightRange.start >= highlightRange.end) {
		return title;
	}

	const before = titleChars.slice(0, highlightRange.start).join("");
	const highlighted = titleChars.slice(highlightRange.start, highlightRange.end).join("");
	const after = titleChars.slice(highlightRange.end).join("");

	return (
		<>
			{before}
			<AppText.Lg bold color="#0B63CE">
				{highlighted}
			</AppText.Lg>
			{after}
		</>
	);
}

function getKindBadgeTone(kind: FindEntryKind) {
	return kind === "material" ? "primary" : "neutral";
}

function FindResultItem({
	entry,
	highlightRange,
	onOpen,
}: {
	entry: FindEntry;
	highlightRange?: ChosungSearchHighlightRange;
	onOpen?: () => void;
}) {
	return (
		<AppPressable onPress={onOpen} pressedColor="rgba(0, 75, 147, 0.04)" radius="idle" style={styles.resultItem}>
			<View style={styles.resultTextArea}>
				<AppText.Lg numberOfLines={1}>
					<HighlightedTitle highlightRange={highlightRange} title={entry.title} />
				</AppText.Lg>
				<AppText.Sm color={AppColors.sub} numberOfLines={1}>
					{entry.summary}
				</AppText.Sm>
			</View>

			<View style={styles.resultAside}>
				<AppBadge size="sm" tone={getKindBadgeTone(entry.kind)}>
					{findEntryKindLabels[entry.kind]}
				</AppBadge>
				<Pressable
					accessibilityLabel={`${entry.title} ${findEntryKindLabels[entry.kind]} 상세 열기`}
					hitSlop={8}
					onPress={event => {
						event.stopPropagation();
						onOpen?.();
					}}
				>
					<View style={styles.resultAction}>
						<AppIcon.Sm color={AppColors.text} name="chevron-forward" pressable={false} />
					</View>
				</Pressable>
			</View>
		</AppPressable>
	);
}

function FindListHeader() {
	return (
		<View style={styles.sectionHeader}>
			<AppText.Sm bold color={AppColors.primary}>
				검색결과
			</AppText.Sm>
		</View>
	);
}

function FindListEmpty() {
	return (
		<View style={styles.emptyResult}>
			<AppText.Base color={AppColors.placeholder}>검색 결과가 없습니다.</AppText.Base>
		</View>
	);
}

export function FindResultList({ activeKind, keyword = "", onOpenEntry, results }: FindResultListProps) {
	const managedEntries = useContentManagementStore(state => state.findEntries);
	const currentResults = results ?? managedEntries;
	const hasKeyword = keyword.trim().length > 0;
	const visibleResults = useMemo(
		() => currentResults.filter(result => result.kind === activeKind),
		[activeKind, currentResults],
	);
	const filteredResults = useMemo<ChosungSearchMatch<FindEntry>[]>(
		() =>
			hasKeyword
				? chosungSearchWithMatches(
						{
							getChosungText: entry => entry.chosung,
							getText: entry => [entry.title, ...entry.keywords].join(" "),
							limit: visibleResults.length,
							query: keyword,
						},
						visibleResults,
					)
				: visibleResults.map(item => ({ item })),
		[hasKeyword, keyword, visibleResults],
	);

	return (
		<FlatList
			contentContainerStyle={filteredResults.length === 0 ? styles.emptyContent : styles.content}
			data={filteredResults}
			ItemSeparatorComponent={() => <AppSpacer style={styles.itemSpacer} />}
			keyExtractor={({ item }) => item.id}
			keyboardShouldPersistTaps="handled"
			ListEmptyComponent={<FindListEmpty />}
			ListHeaderComponent={<FindListHeader />}
			renderItem={({ item: result }) => (
				<FindResultItem
					entry={result.item}
					highlightRange={result.highlightRange}
					onOpen={() => onOpenEntry?.(result.item)}
				/>
			)}
			showsVerticalScrollIndicator={false}
			style={styles.container}
		/>
	);
}

export default FindResultList;

const styles = StyleSheet.create({
	container: {
		flex: 1,
		width: "100%",
		backgroundColor: "#F4F4F4",
	},
	content: {
		paddingBottom: AppSpacing.xl,
	},
	emptyContent: {
		flexGrow: 1,
	},
	sectionHeader: {
		width: "100%",
		paddingHorizontal: AppSpacing.md,
		paddingVertical: AppSpacing.sm,
		backgroundColor: "#F4F4F4",
	},
	resultItem: {
		width: "100%",
		minHeight: 72,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: AppSpacing.md,
		backgroundColor: AppColors.background,
		paddingHorizontal: AppSpacing.md,
		paddingVertical: AppSpacing.sm,
	},
	resultTextArea: {
		flex: 1,
		minWidth: 0,
	},
	resultAside: {
		flexDirection: "row",
		alignItems: "center",
		gap: AppSpacing.sm,
	},
	resultAction: {
		width: 24,
		height: 32,
		alignItems: "center",
		justifyContent: "center",
	},
	emptyResult: {
		flex: 1,
		minHeight: 180,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: AppColors.background,
		paddingVertical: AppSpacing.xl,
	},
	itemSpacer: {
		opacity: 0.32,
	},
});
