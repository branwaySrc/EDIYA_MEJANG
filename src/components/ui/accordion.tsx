import type { ReactNode } from "react";
import { useState } from "react";
import { StyleSheet, type StyleProp, View, type ViewStyle } from "react-native";

import { AppIcon } from "@/components/base/app-icon";
import { AppPressable } from "@/components/base/app-pressable";
import { AppText } from "@/components/base/app-text";
import { AppColors, AppSpacing } from "@/constants/theme";

export type AccordionListProps = {
	children: ReactNode;
	style?: StyleProp<ViewStyle>;
};

export type AccordionItemProps = {
	children: ReactNode;
	defaultOpen?: boolean;
	title: string;
};

function List({ children, style }: AccordionListProps) {
	return <View style={[styles.list, style]}>{children}</View>;
}

function Item({ children, defaultOpen = false, title }: AccordionItemProps) {
	const [open, setOpen] = useState(defaultOpen);

	return (
		<View style={styles.item}>
			<AppPressable
				accessibilityRole="button"
				accessibilityState={{ expanded: open }}
				onPress={() => setOpen(current => !current)}
				pressedColor="rgba(0, 75, 147, 0.04)"
				radius="idle"
				style={styles.header}
			>
				<AppText.Base bold numberOfLines={2} style={styles.title}>
					{title}
				</AppText.Base>
				<AppIcon.Sm color={AppColors.sub} name={open ? "chevron-up" : "chevron-down"} pressable={false} />
			</AppPressable>

			{open && <View style={styles.content}>{children}</View>}
		</View>
	);
}

export const Accordion = {
	List,
	Item,
};

export default Accordion;

const styles = StyleSheet.create({
	list: {
		gap: AppSpacing.sm,
	},
	item: {
		borderWidth: 1,
		borderColor: "rgba(71, 85, 105, 0.24)",
		borderRadius: 8,
		backgroundColor: AppColors.background,
		overflow: "hidden",
	},
	header: {
		minHeight: 58,
		flexDirection: "row",
		alignItems: "center",
		gap: AppSpacing.md,
		paddingHorizontal: AppSpacing.md,
		paddingVertical: AppSpacing.sm,
	},
	title: {
		flex: 1,
		minWidth: 0,
	},
	content: {
		gap: AppSpacing.md,
		borderTopWidth: 1,
		borderColor: "rgba(71, 85, 105, 0.16)",
		padding: AppSpacing.md,
	},
});
