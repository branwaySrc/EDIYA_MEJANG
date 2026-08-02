import { StyleSheet, View } from "react-native";

import { AppIcon } from "@/components/base/app-icon";
import { AppPressable } from "@/components/base/app-pressable";
import { ManagementActionButton, ManagementField } from "@/components/features/sajang/management/management-ui";
import { AppSpacing } from "@/constants/theme";

export function DynamicTextList({
	addLabel,
	itemLabel,
	multiline = false,
	onChange,
	values,
}: {
	addLabel: string;
	itemLabel: string;
	multiline?: boolean;
	onChange: (values: string[]) => void;
	values: string[];
}) {
	const move = (index: number, direction: -1 | 1) => {
		const targetIndex = index + direction;

		if (targetIndex < 0 || targetIndex >= values.length) {
			return;
		}

		const nextValues = [...values];
		[nextValues[index], nextValues[targetIndex]] = [nextValues[targetIndex], nextValues[index]];
		onChange(nextValues);
	};

	return (
		<View style={styles.list}>
			{values.map((value, index) => (
				<View key={`${itemLabel}-${index}`} style={styles.row}>
					<View style={styles.rowHeader}>
						<View style={styles.orderActions}>
							<AppIcon.Sm
								accessibilityLabel={`${itemLabel} ${index + 1} 위로 이동`}
								disabled={index === 0}
								name="chevron-up"
								onPress={() => move(index, -1)}
							/>
							<AppIcon.Sm
								accessibilityLabel={`${itemLabel} ${index + 1} 아래로 이동`}
								disabled={index === values.length - 1}
								name="chevron-down"
								onPress={() => move(index, 1)}
							/>
						</View>
						<AppPressable
							accessibilityLabel={`${itemLabel} ${index + 1} 삭제`}
							onPress={() => onChange(values.filter((_, valueIndex) => valueIndex !== index))}
							pressedColor="rgba(185, 28, 28, 0.08)"
							radius="base"
							style={styles.removeButton}
						>
							<AppIcon.Base color="#B91C1C" name="trash-outline" pressable={false} />
						</AppPressable>
					</View>
					<ManagementField
						label={`${itemLabel} ${index + 1}`}
						multiline={multiline}
						onChangeText={nextValue => onChange(values.map((currentValue, valueIndex) => (valueIndex === index ? nextValue : currentValue)))}
						placeholder={`${itemLabel} 입력`}
						value={value}
					/>
				</View>
			))}
			<ManagementActionButton icon="add" label={addLabel} onPress={() => onChange([...values, ""])} />
		</View>
	);
}

const styles = StyleSheet.create({
	list: {
		width: "100%",
		gap: AppSpacing.sm,
	},
	row: {
		width: "100%",
		gap: AppSpacing.xs,
		borderBottomWidth: 1,
		borderBottomColor: "rgba(71, 85, 105, 0.16)",
		paddingBottom: AppSpacing.md,
	},
	rowHeader: {
		minHeight: 32,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "flex-end",
	},
	orderActions: {
		flexDirection: "row",
		marginRight: AppSpacing.xs,
	},
	removeButton: {
		width: 36,
		height: 36,
		alignItems: "center",
		justifyContent: "center",
	},
});
