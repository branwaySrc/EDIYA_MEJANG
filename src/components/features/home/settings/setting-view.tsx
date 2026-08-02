import { useCallback, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { AppIcon } from "@/components/base/app-icon";
import { AppPressable } from "@/components/base/app-pressable";
import { AppSpacer } from "@/components/base/app-spacer";
import { AppText } from "@/components/base/app-text";
import { AppColors, AppSpacing } from "@/constants/theme";
import type { LocalContentPackMetadata } from "@/database/content-pack/content-pack";
import { syncRecipeSearchCacheFromSupabaseAsync } from "@/lib/content-pack/content-cache-sync";
import { getLocalContentPackMetadataAsync, readLocalContentPackSnapshotAsync } from "@/lib/content-pack/local-content-pack";
import { useAppToastStore } from "@/store/app-toast-store";
import { useContentManagementStore } from "@/store/content-management-store";

type UpdateStatus = "idle" | "updating";

const unknownRecipeVersion = "확인 중";
const unknownRecipeUpdatedAt = "확인 중";

export function SettingView() {
	const showToast = useAppToastStore(state => state.showToast);
	const replaceRecipeSearchContent = useContentManagementStore(state => state.replaceRecipeSearchContent);
	const [recipeVersion, setRecipeVersion] = useState(unknownRecipeVersion);
	const [recipeUpdatedAt, setRecipeUpdatedAt] = useState(unknownRecipeUpdatedAt);
	const [updateStatus, setUpdateStatus] = useState<UpdateStatus>("idle");
	const updateInProgress = updateStatus === "updating";

	const applyMetadata = useCallback((metadata: LocalContentPackMetadata) => {
		setRecipeVersion(metadata.packVersion ?? "내장 데이터");
		setRecipeUpdatedAt(formatUpdatedAt(metadata.appliedAt));
	}, []);

	useEffect(() => {
		let mounted = true;

		getLocalContentPackMetadataAsync()
			.then(metadata => {
				if (mounted) {
					applyMetadata(metadata);
				}
			})
			.catch(error => {
				console.error("Failed to load local recipe pack metadata.", error);

				if (mounted) {
					setRecipeVersion("확인 실패");
					setRecipeUpdatedAt("확인 실패");
				}
			});

		return () => {
			mounted = false;
		};
	}, [applyMetadata]);

	const updateRecipePack = useCallback(async () => {
		if (updateInProgress) {
			return;
		}

		setUpdateStatus("updating");

		try {
			const result = await syncRecipeSearchCacheFromSupabaseAsync();
			const snapshot = await readLocalContentPackSnapshotAsync();

			applyMetadata(result.metadata);
			replaceRecipeSearchContent({
				findEntries: snapshot.findEntries,
				recipeDetails: snapshot.recipeDetails,
				recipes: snapshot.recipes,
			});
			showToast(`레시피 최신화 완료 (${result.recipeCount}개)`);
		} catch (error) {
			console.error("Failed to sync recipe search cache.", error);
			showToast("레시피 최신화에 실패했습니다");
		} finally {
			setUpdateStatus("idle");
		}
	}, [applyMetadata, replaceRecipeSearchContent, showToast, updateInProgress]);

	return (
		<View style={styles.container}>
			<View style={styles.section}>
				<AppText.Sm bold color={AppColors.primary}>
					레시피 데이터
				</AppText.Sm>

				<AppPressable
					accessibilityLabel="레시피 최신화 업데이트"
					disabled={updateInProgress}
					onPress={updateRecipePack}
					pressedColor="#003E7A"
					radius="base"
					style={[styles.updateButton, updateInProgress && styles.updateButtonDisabled]}
				>
					<AppIcon.Base color={AppColors.textOnPrimary} name="cloud-download-outline" pressable={false} />
					<AppText.Base bold color={AppColors.textOnPrimary}>
						{updateInProgress ? "레시피 최신화 중" : "레시피 최신화 업데이트"}
					</AppText.Base>
				</AppPressable>

				<View style={styles.metaBox}>
					<View style={styles.metaRow}>
						<AppText.Sm color={AppColors.sub}>현재 버전</AppText.Sm>
						<AppText.Sm bold>{recipeVersion}</AppText.Sm>
					</View>
					<AppSpacer style={styles.metaSpacer} />
					<View style={styles.metaRow}>
						<AppText.Sm color={AppColors.sub}>최근 업데이트</AppText.Sm>
						<AppText.Sm bold>{recipeUpdatedAt}</AppText.Sm>
					</View>
				</View>
			</View>
		</View>
	);
}

export default SettingView;

function formatUpdatedAt(value: string | null) {
	if (!value) {
		return "업데이트 이력 없음";
	}

	const date = new Date(value);

	if (Number.isNaN(date.getTime())) {
		return "업데이트 이력 없음";
	}

	return date.toLocaleString("ko-KR", {
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		month: "2-digit",
		year: "numeric",
	});
}

const styles = StyleSheet.create({
	container: {
		width: "100%",
	},
	section: {
		width: "100%",
		gap: AppSpacing.md,
	},
	updateButton: {
		width: "100%",
		minHeight: 52,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: AppSpacing.sm,
		backgroundColor: AppColors.primary,
		paddingHorizontal: AppSpacing.md,
	},
	updateButtonDisabled: {
		opacity: 0.64,
	},
	metaBox: {
		width: "100%",
		borderWidth: 1,
		borderColor: "rgba(71, 85, 105, 0.18)",
		borderRadius: 4,
		backgroundColor: AppColors.background,
	},
	metaRow: {
		minHeight: 44,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: AppSpacing.md,
		paddingHorizontal: AppSpacing.md,
	},
	metaSpacer: {
		opacity: 0.18,
	},
});
