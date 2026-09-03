import { type Href, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";

import { AppSpacer } from "@/components/base/app-spacer";
import { AppText } from "@/components/base/app-text";
import {
	ManagementHeaderAddButton,
	ManagementItemRow,
} from "@/components/features/sajang/management/management-ui";
import { AppLayout } from "@/components/global/app-layout";
import { SearchBox } from "@/components/ui/search/search-box";
import { AppColors, AppSpacing } from "@/constants/theme";
import { chosungSearch } from "@/lib/chosung-search";
import { useContentManagementStore } from "@/store/content-management-store";

function EmptyVendorList() {
	return (
		<View style={styles.empty}>
			<AppText.Base color={AppColors.placeholder}>등록된 거래처가 없습니다.</AppText.Base>
		</View>
	);
}

export default function SajangVendorsScreen() {
	const router = useRouter();
	const vendors = useContentManagementStore(state => state.vendors);
	const hydrateVendorsFromRemote = useContentManagementStore(state => state.hydrateVendorsFromRemote);
	const vendorSyncErrorMessage = useContentManagementStore(state => state.vendorSyncErrorMessage);
	const vendorSyncing = useContentManagementStore(state => state.vendorSyncing);
	const [keyword, setKeyword] = useState("");
	const visibleVendors = useMemo(
		() =>
			chosungSearch(
				{
					getText: vendor => [vendor.name, vendor.contactName, ...vendor.items].join(" "),
					query: keyword,
				},
				vendors,
			),
		[keyword, vendors],
	);
	const openEditor = (id?: string) => {
		router.push({
			pathname: "/sajang/vendor-editor",
			params: { id },
		} as Href);
	};

	useEffect(() => {
		void hydrateVendorsFromRemote();
	}, [hydrateVendorsFromRemote]);

	return (
		<AppLayout
			activeDrawerId="owner-space"
			aside={<ManagementHeaderAddButton onPress={() => openEditor()} />}
			contentStyle={styles.content}
			leadingMode="back"
			onPressBack={() => router.back()}
			title="거래처 등록"
			type="view"
		>
			<View style={styles.searchArea}>
				<SearchBox
					onChangeText={setKeyword}
					onSubmit={() => undefined}
					placeholder="거래처명, 담당자, 품목 검색"
					showSubmitButton={false}
					value={keyword}
				/>
			</View>
			<FlatList
				contentContainerStyle={visibleVendors.length === 0 ? styles.emptyContent : styles.listContent}
				data={visibleVendors}
				ItemSeparatorComponent={() => <AppSpacer style={styles.separator} />}
				keyExtractor={vendor => vendor.id}
				keyboardShouldPersistTaps="handled"
				ListHeaderComponent={
					<>
						{vendorSyncing ? (
							<View style={styles.loadingBox}>
								<AppText.Base bold color={AppColors.primary}>
									데이터를 불러오고 있습니다
								</AppText.Base>
							</View>
						) : null}
						{vendorSyncErrorMessage ? (
							<AppText.Xs color="#B91C1C" style={styles.syncError}>
								{vendorSyncErrorMessage}
							</AppText.Xs>
						) : null}
					</>
				}
				ListEmptyComponent={vendorSyncing ? null : <EmptyVendorList />}
				renderItem={({ item: vendor }) => (
					<ManagementItemRow
						badge="거래처"
						onEdit={() => openEditor(vendor.id)}
						onPress={() => openEditor(vendor.id)}
						subtitle={[vendor.contactName, vendor.phone].filter(Boolean).join(" · ")}
						title={vendor.name}
					/>
				)}
				style={styles.list}
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
	empty: {
		flex: 1,
		minHeight: 180,
		alignItems: "center",
		justifyContent: "center",
		padding: AppSpacing.md,
	},
});
