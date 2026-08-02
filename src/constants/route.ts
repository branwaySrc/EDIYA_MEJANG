import type { Href } from "expo-router";

import type { AppIconProps } from "@/components/base/app-icon";

export type AppRouteId =
	| "menu-search"
	| "find-materials"
	| "paid-customer"
	| "delivery-order-admin"
	| "store-vendors"
	| "missing-item-request"
	| "owner-space"
	| "updates"
	| "employee-info"
	| "attendance"
	| "notices"
	| "manual";

export type DrawerMenuId = AppRouteId;

export type DrawerSectionTitle = "일반" | "세부" | "직원" | "기타";

export type AppRouteConfig = {
	drawerSection?: DrawerSectionTitle;
	icon: AppIconProps["name"];
	label: string;
	path: Href;
};

export type DrawerMenuItem = {
	icon: AppIconProps["name"];
	id: DrawerMenuId;
	label: string;
};

export type DrawerSection = {
	items: DrawerMenuItem[];
	title: DrawerSectionTitle;
};

export const appRouteIds: AppRouteId[] = [
	"menu-search",
	"find-materials",
	"paid-customer",
	"delivery-order-admin",
	"store-vendors",
	"missing-item-request",
	"owner-space",
	"updates",
	"employee-info",
	"attendance",
	"notices",
	"manual",
];

export const drawerSectionTitles: DrawerSectionTitle[] = ["일반", "세부", "직원", "기타"];

export const appRoutes: Record<AppRouteId, AppRouteConfig> = {
	"menu-search": {
		path: "/",
		label: "이디야 메뉴 검색",
		icon: "search-outline",
		drawerSection: "일반",
	},
	"find-materials": {
		path: "/find-materials",
		label: "이디야 통합 검색",
		icon: "search-outline",
		drawerSection: "일반",
	},
	"paid-customer": {
		path: "/paid-customer",
		label: "선불 결제",
		icon: "albums-outline",
		drawerSection: "일반",
	},
	"delivery-order-admin": {
		path: "/delivery-order-admin",
		label: "배달/발주 어드민",
		icon: "server-outline",
		drawerSection: "세부",
	},
	"store-vendors": {
		path: "/store-vendors",
		label: "매장 및 거래처",
		icon: "business-outline",
		drawerSection: "세부",
	},
	"missing-item-request": {
		path: "/missing-item-request",
		label: "사장님 이게 없어요",
		icon: "cube-outline",
	},
	"owner-space": {
		path: "/sajang" as Href,
		label: "사장님 공간",
		icon: "lock-closed-outline",
	},
	updates: {
		path: "/updates",
		label: "업데이트",
		icon: "refresh-outline",
		drawerSection: "기타",
	},
	"employee-info": {
		path: "/employee-info",
		label: "직원 정보",
		icon: "happy-outline",
		drawerSection: "직원",
	},
	attendance: {
		path: "/attendance",
		label: "근무근태",
		icon: "calendar-outline",
		drawerSection: "직원",
	},
	notices: {
		path: "/notices",
		label: "공지사항",
		icon: "chatbubble-outline",
		drawerSection: "기타",
	},
	manual: {
		path: "/manual",
		label: "직원 메뉴얼",
		icon: "book-outline",
		drawerSection: "직원",
	},
};

export const routeLabels = Object.fromEntries(appRouteIds.map(id => [id, appRoutes[id].label])) as Record<AppRouteId, string>;

export const drawerSections: DrawerSection[] = drawerSectionTitles
	.map(title => ({
		title,
		items: appRouteIds
			.filter(id => appRoutes[id].drawerSection === title)
			.map(id => ({
				id,
				label: appRoutes[id].label,
				icon: appRoutes[id].icon,
			})),
	}))
	.filter(section => section.items.length > 0);
