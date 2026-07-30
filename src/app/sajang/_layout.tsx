import { type Href, Stack, usePathname, useRouter } from "expo-router";
import { useEffect } from "react";

import { useSajangAuthStore } from "@/store/sajang-auth-store";

export default function SajangLayout() {
	const pathname = usePathname();
	const router = useRouter();
	const unlocked = useSajangAuthStore(state => state.unlocked);

	useEffect(() => {
		const insideSajangRoute = pathname === "/sajang" || pathname.startsWith("/sajang/");

		if (insideSajangRoute && !unlocked && pathname !== "/sajang") {
			router.replace("/sajang" as Href);
		}
	}, [pathname, router, unlocked]);

	return <Stack screenOptions={{ headerShown: false }} />;
}
