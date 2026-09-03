import { type Href, useRouter } from "expo-router";
import { memo } from "react";
import { StyleSheet, View } from "react-native";

import { AppIcon, type AppIconProps } from "@/components/base/app-icon";
import { AppPressable } from "@/components/base/app-pressable";
import { AppText } from "@/components/base/app-text";
import { AppColors, AppSpacing } from "@/constants/theme";

type HomeAction = {
	disabled?: boolean;
	icon: AppIconProps["name"];
	label: string;
	route?: Href;
	type?: "action";
};

const homeActions: HomeAction[] = [
	{
		icon: "people-outline",
		label: "직원관리",
		type: "action",
		route: "/sajang/employees" as Href,
	},
	{
		icon: "calendar-outline",
		label: "근무근태",
		type: "action",
		route: "/sajang/attendance" as Href,
	},
	{
		icon: "add-circle-outline",
		label: "메뉴추가",
		type: "action",
		route: "/sajang/menu-add" as Href,
	},
	{
		icon: "chatbubble-outline",
		label: "공지사항 및 메뉴얼",
		type: "action",
		route: "/sajang/notices" as Href,
	},
	{
		icon: "business-outline",
		label: "거래처 등록",
		type: "action",
		route: "/sajang/vendors" as Href,
	},
	{
		icon: "calculator-outline",
		label: "정산관리",
		type: "action",
		route: "/sajang/settlement" as Href,
	},
];

export const SajangHomeGrid = memo(function SajangHomeGrid() {
	const router = useRouter();

	return (
		<View style={styles.grid}>
			{homeActions.map(action => (
				<AppPressable
					key={action.label}
					accessibilityLabel={action.label}
					disabled={action.disabled}
					onPress={() => action.route && router.push(action.route)}
					pressedColor="rgba(0, 75, 147, 0.08)"
					radius="base"
					style={[styles.actionButton, action.disabled && styles.disabledButton]}
				>
					<AppIcon.Xl color={action.disabled ? AppColors.placeholder : AppColors.primary} name={action.icon} pressable={false} />
					<AppText.Base bold color={action.disabled ? AppColors.placeholder : AppColors.text} style={styles.actionText}>
						{action.label}
					</AppText.Base>
				</AppPressable>
			))}
		</View>
	);
});

export default SajangHomeGrid;

const styles = StyleSheet.create({
	grid: {
		flex: 1,
		width: "100%",
		flexDirection: "row",
		flexWrap: "wrap",
		alignContent: "stretch",
		gap: AppSpacing.sm,
	},
	actionButton: {
		width: "48.7%",
		minHeight: 148,
		flexGrow: 1,
		alignItems: "center",
		justifyContent: "center",
		gap: AppSpacing.sm,
		borderWidth: 1,
		borderColor: "rgba(71, 85, 105, 0.24)",
		backgroundColor: AppColors.background,
		padding: AppSpacing.md,
	},
	disabledButton: {
		backgroundColor: "#F8FAFC",
	},
	actionText: {
		textAlign: "center",
	},
});
