import { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { AppBadge } from "@/components/base/app-badge";
import { AppIcon } from "@/components/base/app-icon";
import { AppPressable } from "@/components/base/app-pressable";
import { AppSpacer } from "@/components/base/app-spacer";
import { AppText } from "@/components/base/app-text";
import { AppColors, AppSpacing } from "@/constants/theme";
import { findEntryKindLabels, type FindEntry, type FindEntryKind, sampleFindEntries } from "@/database/find/find";
import { chosungSearchWithMatches, type ChosungSearchHighlightRange, type ChosungSearchMatch } from "@/lib/chosung-search";

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

export function FindResultList({ activeKind, keyword = "", onOpenEntry, results = sampleFindEntries }: FindResultListProps) {
	const hasKeyword = keyword.trim().length > 0;
	const visibleResults = useMemo(() => results.filter(result => result.kind === activeKind), [activeKind, results]);
	const filteredResults = useMemo<ChosungSearchMatch<FindEntry>[]>(
		() =>
			hasKeyword
				? chosungSearchWithMatches(
						{
							getChosungText: entry => entry.chosung,
							getText: entry => entry.title,
							limit: 12,
							query: keyword,
						},
						visibleResults,
					)
				: visibleResults.map(item => ({ item })),
		[hasKeyword, keyword, visibleResults],
	);

	return (
		<View style={styles.container}>
			<View style={styles.sectionHeader}>
				<AppText.Sm bold color={AppColors.primary}>
					검색결과
				</AppText.Sm>
			</View>

			<View style={styles.list}>
				{filteredResults.length === 0 ? (
					<View style={styles.emptyResult}>
						<AppText.Base color={AppColors.placeholder}>검색 결과가 없습니다.</AppText.Base>
					</View>
				) : (
					filteredResults.map(({ highlightRange, item: result }, index) => (
						<View key={result.id}>
							{index > 0 && <AppSpacer style={styles.itemSpacer} />}
							<FindResultItem entry={result} highlightRange={highlightRange} onOpen={() => onOpenEntry?.(result)} />
						</View>
					))
				)}
			</View>
		</View>
	);
}

export default FindResultList;

const styles = StyleSheet.create({
	container: {
		width: "100%",
		backgroundColor: "#f4f4f4",
	},
	sectionHeader: {
		width: "100%",
		paddingHorizontal: AppSpacing.md,
		paddingVertical: AppSpacing.sm,
		backgroundColor: "#f4f4f4",
	},
	list: {
		width: "100%",
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
		minHeight: 64,
		justifyContent: "center",
		alignItems: "center",
		paddingVertical: 100,
		backgroundColor: AppColors.background,
	},
	itemSpacer: {
		opacity: 0.32,
	},
});
