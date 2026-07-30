import { useRouter } from "expo-router";
import { StyleSheet } from "react-native";

import { AppIcon } from "@/components/base/app-icon";
import { AppPressable } from "@/components/base/app-pressable";
import { AppColors } from "@/constants/theme";

export function FloatingSearch() {
	const router = useRouter();

	return (
		<AppPressable
			accessibilityLabel="검색 화면 열기"
			onPress={() => router.push("/search")}
			pressedColor="#003E7A"
			radius="full"
			style={styles.button}
		>
			<AppIcon.Lg color={AppColors.textOnPrimary} name="search" pressable={false} />
		</AppPressable>
	);
}

export default FloatingSearch;

const styles = StyleSheet.create({
	button: {
		width: 64,
		height: 64,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: AppColors.text,
	},
});
