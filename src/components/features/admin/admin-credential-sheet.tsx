import * as Clipboard from "expo-clipboard";
import { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";

import { AppPressable } from "@/components/base/app-pressable";
import { AppText } from "@/components/base/app-text";
import type { DeliveryCredential } from "@/database/delivery/delivery-site.type";
import { AppColors, AppSpacing } from "@/constants/theme";

export type AdminCredentialSheetProps = {
	credential: DeliveryCredential;
	title: string;
};

export const adminCredentialSheetHeight = 164;

type CopiedTarget = "username" | "password" | null;

export function AdminCredentialSheet({ credential, title }: AdminCredentialSheetProps) {
	const [copiedTarget, setCopiedTarget] = useState<CopiedTarget>(null);
	const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(
		() => () => {
			if (copiedTimerRef.current) {
				clearTimeout(copiedTimerRef.current);
			}
		},
		[],
	);

	const copyCredential = useCallback(async (target: Exclude<CopiedTarget, null>, value: string) => {
		await Clipboard.setStringAsync(value);
		setCopiedTarget(target);

		if (copiedTimerRef.current) {
			clearTimeout(copiedTimerRef.current);
		}

		copiedTimerRef.current = setTimeout(() => {
			setCopiedTarget(null);
			copiedTimerRef.current = null;
		}, 1400);
	}, []);

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<View style={styles.headerText}>
					{credential.description && (
						<AppText.Sm color={AppColors.textOnPrimary} numberOfLines={1}>
							{credential.description}
						</AppText.Sm>
					)}
				</View>
			</View>

			<View style={styles.row}>
				<AppText.Sm bold color={AppColors.textOnPrimary} style={styles.label}>
					ID
				</AppText.Sm>
				<AppText.Base color={AppColors.textOnPrimary} style={styles.value} numberOfLines={1}>
					{credential.username}
				</AppText.Base>
				<AppPressable
					accessibilityLabel="ID 복사"
					accessibilityRole="button"
					onPress={() => copyCredential("username", credential.username)}
					pressedColor="rgba(255, 255, 255, 0.16)"
					radius="base"
					style={styles.copyAction}
				>
					<AppText.Sm bold color={AppColors.textOnPrimary} style={styles.copyActionText}>
						복사하기
					</AppText.Sm>
				</AppPressable>
			</View>
			<View style={styles.row}>
				<AppText.Sm bold color={AppColors.textOnPrimary} style={styles.label}>
					PW
				</AppText.Sm>
				<AppText.Base color={AppColors.textOnPrimary} style={styles.value} numberOfLines={1}>
					{credential.password}
				</AppText.Base>
				<AppPressable
					accessibilityLabel="비밀번호 복사"
					accessibilityRole="button"
					onPress={() => copyCredential("password", credential.password)}
					pressedColor="rgba(255, 255, 255, 0.16)"
					radius="base"
					style={styles.copyAction}
				>
					<AppText.Sm bold color={AppColors.textOnPrimary} style={styles.copyActionText}>
						복사하기
					</AppText.Sm>
				</AppPressable>
			</View>
			<View style={styles.statusRow}>
				<AppText.Xs color={copiedTarget ? AppColors.textOnPrimary : "rgba(255, 255, 255, 0.46)"}>
					{copiedTarget ? "클립보드에 복사됐어요." : "복사 후 WebView 입력칸에서 붙여넣기 해주세요."}
				</AppText.Xs>
			</View>
		</View>
	);
}

export default AdminCredentialSheet;

const styles = StyleSheet.create({
	container: {
		height: adminCredentialSheetHeight,
		width: "100%",
		borderTopWidth: 1,
		borderColor: "rgba(71, 85, 105, 0.32)",
		backgroundColor: "#1A1A1A",
		paddingHorizontal: AppSpacing.md,
		paddingTop: AppSpacing.md,
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 10,
	},
	headerText: {
		flex: 1,
		minWidth: 0,
	},
	row: {
		minHeight: 34,
		flexDirection: "row",
		alignItems: "center",
		gap: AppSpacing.sm,
	},
	label: {
		width: 36,
	},
	value: {
		flex: 1,
		minWidth: 0,
	},
	copyAction: {
		minHeight: 34,
		paddingHorizontal: AppSpacing.xs,
		alignItems: "center",
		justifyContent: "center",
	},
	copyActionText: {
		textDecorationLine: "underline",
	},
	statusRow: {
		minHeight: 24,
		justifyContent: "center",
		marginTop: AppSpacing.xs,
	},
});
