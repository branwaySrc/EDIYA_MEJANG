import * as ImagePicker from "expo-image-picker";
import { Image, StyleSheet, View } from "react-native";

import { AppIcon } from "@/components/base/app-icon";
import { AppPressable } from "@/components/base/app-pressable";
import { AppText } from "@/components/base/app-text";
import { ManagementActionButton, ManagementField } from "@/components/features/sajang/management/management-ui";
import { AppColors, AppSpacing } from "@/constants/theme";
import { preserveContentImage } from "@/lib/content-image";

export type ManagedVisualDraft = {
	desc: string;
	id: string;
	imageUri: string;
	storagePath?: string;
	title: string;
};

function createVisualDraft(): ManagedVisualDraft {
	return {
		desc: "",
		id: `visual-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
		imageUri: "",
		title: "",
	};
}

export function ManagementImagePicker({
	accessibilityLabel,
	imageUri,
	onChange,
}: {
	accessibilityLabel: string;
	imageUri: string;
	onChange: (imageUri: string) => void;
}) {
	const pickImage = async () => {
		const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

		if (!permission.granted) {
			return;
		}

		const result = await ImagePicker.launchImageLibraryAsync({
			allowsEditing: true,
			aspect: [1, 1],
			mediaTypes: ["images"],
			quality: 0.86,
		});

		if (result.canceled) {
			return;
		}

		const asset = result.assets[0];
		onChange(await preserveContentImage(asset.uri, asset.fileName));
	};

	return (
		<AppPressable
			accessibilityLabel={accessibilityLabel}
			onPress={() => void pickImage()}
			pressedColor="rgba(0, 75, 147, 0.08)"
			radius="base"
			style={styles.imagePicker}
		>
			{imageUri ? (
				<Image resizeMode="cover" source={{ uri: imageUri }} style={styles.image} />
			) : (
				<View style={styles.imagePlaceholder}>
					<AppIcon.Lg color={AppColors.primary} name="image-outline" pressable={false} />
					<AppText.Sm bold color={AppColors.primary}>
						이미지 선택
					</AppText.Sm>
				</View>
			)}
		</AppPressable>
	);
}

export function VisualEditorList({
	addLabel = "이미지 추가",
	onChange,
	visuals,
}: {
	addLabel?: string;
	onChange: (visuals: ManagedVisualDraft[]) => void;
	visuals: ManagedVisualDraft[];
}) {
	const updateVisual = (index: number, nextVisual: ManagedVisualDraft) => {
		onChange(visuals.map((visual, visualIndex) => (visualIndex === index ? nextVisual : visual)));
	};

	const moveVisual = (index: number, direction: -1 | 1) => {
		const targetIndex = index + direction;

		if (targetIndex < 0 || targetIndex >= visuals.length) {
			return;
		}

		const nextVisuals = [...visuals];
		[nextVisuals[index], nextVisuals[targetIndex]] = [nextVisuals[targetIndex], nextVisuals[index]];
		onChange(nextVisuals);
	};

	return (
		<View style={styles.list}>
			{visuals.map((visual, index) => (
				<View key={visual.id} style={styles.visualEditor}>
					<View style={styles.visualHeader}>
						<AppText.Sm bold color={AppColors.primary}>
							이미지 {index + 1}
						</AppText.Sm>
						<View style={styles.headerActions}>
							<AppIcon.Sm
								accessibilityLabel={`이미지 ${index + 1} 위로 이동`}
								disabled={index === 0}
								name="chevron-up"
								onPress={() => moveVisual(index, -1)}
							/>
							<AppIcon.Sm
								accessibilityLabel={`이미지 ${index + 1} 아래로 이동`}
								disabled={index === visuals.length - 1}
								name="chevron-down"
								onPress={() => moveVisual(index, 1)}
							/>
							<AppIcon.Sm
								accessibilityLabel={`이미지 ${index + 1} 삭제`}
								color="#B91C1C"
								name="trash-outline"
								onPress={() => onChange(visuals.filter((_, visualIndex) => visualIndex !== index))}
							/>
						</View>
					</View>

					<ManagementImagePicker
						accessibilityLabel={visual.imageUri ? `이미지 ${index + 1} 변경` : `이미지 ${index + 1} 선택`}
						imageUri={visual.imageUri}
						onChange={imageUri =>
							updateVisual(index, {
								...visual,
								imageUri,
								storagePath: undefined,
							})
						}
					/>

					<ManagementField
						label="제목"
						onChangeText={title => updateVisual(index, { ...visual, title })}
						placeholder="이미지 제목"
						value={visual.title}
					/>
					<ManagementField
						label="설명"
						multiline
						onChangeText={desc => updateVisual(index, { ...visual, desc })}
						placeholder="이미지 하단 설명"
						value={visual.desc}
					/>
				</View>
			))}

			<ManagementActionButton icon="images-outline" label={addLabel} onPress={() => onChange([...visuals, createVisualDraft()])} />
		</View>
	);
}

const styles = StyleSheet.create({
	list: {
		width: "100%",
		gap: AppSpacing.md,
	},
	visualEditor: {
		width: "100%",
		gap: AppSpacing.sm,
		borderWidth: 1,
		borderColor: "rgba(71, 85, 105, 0.2)",
		borderRadius: 4,
		backgroundColor: AppColors.background,
		padding: AppSpacing.sm,
	},
	visualHeader: {
		minHeight: 36,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	headerActions: {
		flexDirection: "row",
	},
	imagePicker: {
		width: "100%",
		maxWidth: 280,
		aspectRatio: 1,
		alignSelf: "center",
		borderWidth: 1,
		borderColor: "rgba(0, 75, 147, 0.28)",
		backgroundColor: "#F8FBFF",
	},
	image: {
		width: "100%",
		height: "100%",
	},
	imagePlaceholder: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		gap: AppSpacing.sm,
	},
});
