import { ScrollView, StyleSheet, View } from "react-native";

import { AppIcon } from "@/components/base/app-icon";
import { AppPressable } from "@/components/base/app-pressable";
import { AppSpacer } from "@/components/base/app-spacer";
import { AppText } from "@/components/base/app-text";
import { appRoutes, drawerSections, type DrawerMenuId } from "@/constants/route";
import { AppColors, AppSpacing } from "@/constants/theme";

export type { DrawerMenuId } from "@/constants/route";

export type NavigationDrawerProps = {
	activeId?: DrawerMenuId;
	onSelect?: (id: DrawerMenuId) => void;
};

export function NavigationDrawer({ activeId = "menu-search", onSelect }: NavigationDrawerProps) {
	return (
		<ScrollView
			contentContainerStyle={styles.contentContainer}
			showsVerticalScrollIndicator={false}
			style={styles.container}
		>
			{drawerSections.map(section => (
				<View key={section.title} style={styles.section}>
					<AppText.Sm bold color={AppColors.primary} style={styles.sectionTitle}>
						{section.title}
					</AppText.Sm>

					<View style={styles.menuList}>
						{section.items.map((item, itemIndex) => {
							const active = item.id === activeId;

							return (
								<View key={item.id}>
									{itemIndex > 0 && <AppSpacer gap={AppSpacing.xs} style={styles.itemSpacer} />}
									<AppPressable
										accessibilityLabel={item.label}
										onPress={() => onSelect?.(item.id)}
										pressedColor="rgba(0, 75, 147, 0.08)"
										style={[styles.menuItem, active && styles.activeMenuItem]}
									>
										<AppIcon.Sm color={active ? AppColors.textOnPrimary : AppColors.text} name={item.icon} pressable={false} />
										<AppText.Base bold={active} color={active ? AppColors.textOnPrimary : AppColors.text} numberOfLines={1}>
											{item.label}
										</AppText.Base>
									</AppPressable>
								</View>
							);
						})}
					</View>
				</View>
			))}
			<View style={styles.ctaArea}>
				<AppPressable
					accessibilityLabel={appRoutes["owner-space"].label}
					onPress={() => onSelect?.("owner-space")}
					pressedColor="#262626"
					radius="base"
					style={styles.ownerButton}
				>
					<AppIcon.Sm color={AppColors.textOnPrimary} name="lock-closed-outline" pressable={false} />
					<AppText.Base bold color={AppColors.textOnPrimary} numberOfLines={1}>
						{appRoutes["owner-space"].label}
					</AppText.Base>
				</AppPressable>
				<AppPressable
					accessibilityLabel={appRoutes["missing-item-request"].label}
					onPress={() => onSelect?.("missing-item-request")}
					pressedColor="#990C0C"
					radius="base"
					style={styles.ctaButton}
				>
					<AppIcon.Sm color={AppColors.textOnPrimary} name="cube-outline" pressable={false} />
					<AppText.Base bold color={AppColors.textOnPrimary} numberOfLines={1}>
						{appRoutes["missing-item-request"].label}
					</AppText.Base>
				</AppPressable>
			</View>
		</ScrollView>
	);
}

export default NavigationDrawer;

const styles = StyleSheet.create({
	container: {
		flex: 1,
		width: "100%",
		backgroundColor: AppColors.background,
	},
	contentContainer: {
		flexGrow: 1,
		width: "100%",
	},
	section: {
		width: "100%",
	},
	sectionTitle: {
		paddingTop: 16,
		paddingBottom: 6,
		backgroundColor: "#f4f4f4",
		paddingHorizontal: AppSpacing.md,
	},
	menuList: {
		width: "100%",
	},
	itemSpacer: {
		opacity: 0.14,
	},
	menuItem: {
		minHeight: 44,
		width: "100%",
		flexDirection: "row",
		alignItems: "center",
		gap: AppSpacing.md,
		backgroundColor: AppColors.background,
		paddingHorizontal: AppSpacing.md,
		paddingVertical: AppSpacing.sm,
	},
	activeMenuItem: {
		backgroundColor: AppColors.primary,
	},
	ctaArea: {
		width: "100%",
		marginTop: "auto",
		padding: AppSpacing.md,
		gap: AppSpacing.sm,
	},
	ownerButton: {
		minHeight: 48,
		width: "100%",
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: AppSpacing.sm,
		backgroundColor: AppColors.text,
		paddingHorizontal: AppSpacing.md,
	},
	ctaButton: {
		minHeight: 48,
		width: "100%",
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: AppSpacing.sm,
		backgroundColor: "#E20A0A",
		paddingHorizontal: AppSpacing.md,
	},
});
