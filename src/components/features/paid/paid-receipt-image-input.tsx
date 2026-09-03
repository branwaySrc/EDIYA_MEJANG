import * as ImagePicker from "expo-image-picker";
import { Image, StyleSheet, View } from "react-native";

import { AppBadge } from "@/components/base/app-badge";
import { AppIcon } from "@/components/base/app-icon";
import { AppPressable } from "@/components/base/app-pressable";
import { AppText } from "@/components/base/app-text";
import { AppColors, AppSpacing } from "@/constants/theme";
import { preserveContentImage } from "@/lib/content-image";

type PaidReceiptImageInputProps = {
	errorMessage: string;
	imageUri: string;
	label?: string;
	onChange: (imageUri: string) => void;
	onError: (message: string) => void;
	onRemove: () => void;
};

export function PaidReceiptImageInput({
	errorMessage,
	imageUri,
	label = "영수증 사진",
	onChange,
	onError,
	onRemove,
}: PaidReceiptImageInputProps) {
	const applyPickedImage = async (result: ImagePicker.ImagePickerResult) => {
		if (result.canceled) {
			return;
		}

		const asset = result.assets[0];

		if (!asset?.uri) {
			onError("영수증 이미지를 불러오지 못했습니다.");
			return;
		}

		try {
			onChange(await preserveContentImage(asset.uri, asset.fileName));
		} catch (error) {
			console.error("Failed to preserve paid receipt image.", error);
			onError("선택한 이미지를 기기에 저장하지 못했습니다.");
		}
	};
	const takeReceiptPhoto = async () => {
		const permission = await ImagePicker.requestCameraPermissionsAsync();

		if (!permission.granted) {
			onError("영수증 촬영을 위해 카메라 권한이 필요합니다.");
			return;
		}

		await applyPickedImage(
			await ImagePicker.launchCameraAsync({
				allowsEditing: false,
				mediaTypes: ["images"],
				quality: 0.72,
			}),
		);
	};
	const pickReceiptImage = async () => {
		const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

		if (!permission.granted) {
			onError("영수증 첨부를 위해 사진 접근 권한이 필요합니다.");
			return;
		}

		await applyPickedImage(
			await ImagePicker.launchImageLibraryAsync({
				allowsEditing: false,
				mediaTypes: ["images"],
				quality: 0.72,
			}),
		);
	};

	return (
		<View style={styles.section}>
			<View style={styles.header}>
				<View style={styles.titleArea}>
					<AppIcon.Sm color={AppColors.primary} name="receipt-outline" pressable={false} />
					<AppText.Sm bold color={AppColors.sub}>
						{label}
					</AppText.Sm>
				</View>
				{imageUri ? <AppBadge tone="primary">첨부됨</AppBadge> : <AppBadge>선택</AppBadge>}
			</View>

			<View style={styles.preview}>
				{imageUri ? (
					<Image accessibilityLabel={`첨부된 ${label}`} resizeMode="cover" source={{ uri: imageUri }} style={styles.image} />
				) : (
					<View style={styles.placeholder}>
						<AppIcon.Lg color={AppColors.primary} name="camera-outline" pressable={false} />
						<AppText.Sm bold color={AppColors.primary}>
							영수증 또는 주문표를 추가해 주세요
						</AppText.Sm>
					</View>
				)}
			</View>

			<View style={styles.actions}>
				<AppPressable
					accessibilityLabel="영수증 또는 주문표 사진 촬영"
					onPress={() => void takeReceiptPhoto()}
					pressedColor="#003E7A"
					radius="base"
					style={styles.primaryButton}
				>
					<AppIcon.Sm color={AppColors.textOnPrimary} name="camera-outline" pressable={false} />
					<AppText.Sm bold color={AppColors.textOnPrimary}>
						사진 촬영
					</AppText.Sm>
				</AppPressable>
				<AppPressable
					accessibilityLabel="영수증 또는 주문표 앨범에서 선택"
					onPress={() => void pickReceiptImage()}
					pressedColor="rgba(0, 75, 147, 0.08)"
					radius="base"
					style={styles.secondaryButton}
				>
					<AppIcon.Sm color={AppColors.primary} name="images-outline" pressable={false} />
					<AppText.Sm bold color={AppColors.primary}>
						앨범 선택
					</AppText.Sm>
				</AppPressable>
			</View>

			{imageUri ? (
				<AppPressable
					accessibilityLabel="첨부된 영수증 또는 주문표 삭제"
					onPress={onRemove}
					pressedColor="rgba(185, 28, 28, 0.08)"
					radius="base"
					style={styles.removeButton}
				>
					<AppText.Sm bold color="#B91C1C">
						첨부 이미지 삭제
					</AppText.Sm>
				</AppPressable>
			) : null}

			{errorMessage ? (
				<AppText.Xs color="#B91C1C" style={styles.error}>
					{errorMessage}
				</AppText.Xs>
			) : null}
		</View>
	);
}

const styles = StyleSheet.create({
	section: {
		width: "100%",
		gap: AppSpacing.sm,
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: AppSpacing.sm,
	},
	titleArea: {
		flexDirection: "row",
		alignItems: "center",
		gap: AppSpacing.xs,
	},
	preview: {
		width: "100%",
		height: 180,
		borderWidth: 1,
		borderColor: "rgba(0, 75, 147, 0.28)",
		borderRadius: 4,
		backgroundColor: AppColors.background,
		overflow: "hidden",
	},
	image: {
		width: "100%",
		height: "100%",
	},
	placeholder: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		gap: AppSpacing.sm,
	},
	actions: {
		flexDirection: "row",
		gap: AppSpacing.sm,
	},
	primaryButton: {
		flex: 1,
		minHeight: 44,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: AppSpacing.xs,
		backgroundColor: AppColors.primary,
	},
	secondaryButton: {
		flex: 1,
		minHeight: 44,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: AppSpacing.xs,
		borderWidth: 1,
		borderColor: "rgba(0, 75, 147, 0.34)",
		backgroundColor: AppColors.background,
	},
	removeButton: {
		minHeight: 38,
		alignItems: "center",
		justifyContent: "center",
		borderWidth: 1,
		borderColor: "rgba(185, 28, 28, 0.24)",
		backgroundColor: "#FEF2F2",
	},
	error: {
		lineHeight: 17,
	},
});
