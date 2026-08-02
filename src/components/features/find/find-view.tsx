import { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";

import { FindResultList } from "@/components/features/find/find-result-list";
import { SearchBox } from "@/components/ui/search/search-box";
import { AppSpacing } from "@/constants/theme";
import type { FindEntry, FindEntryKind } from "@/database/find/find";

export type FindViewProps = {
	activeKind: FindEntryKind;
	onOpenEntry?: (entry: FindEntry) => void;
};

export function FindView({ activeKind, onOpenEntry }: FindViewProps) {
	const [keyword, setKeyword] = useState("");
	const handleSubmit = useCallback(() => {
		const trimmedKeyword = keyword.trim();

		if (!trimmedKeyword) {
			return;
		}
	}, [keyword]);

	return (
		<View style={styles.container}>
			<View style={styles.searchBoxArea}>
				<SearchBox autoFocus value={keyword} onChangeText={setKeyword} onSubmit={handleSubmit} placeholder="메뉴명, 재료, POS 위치 검색" />
			</View>
			<FindResultList activeKind={activeKind} keyword={keyword} onOpenEntry={onOpenEntry} />
		</View>
	);
}

export default FindView;

const styles = StyleSheet.create({
	container: {
		flex: 1,
		width: "100%",
	},
	searchBoxArea: {
		paddingHorizontal: AppSpacing.md,
		paddingVertical: AppSpacing.md,
	},
});
