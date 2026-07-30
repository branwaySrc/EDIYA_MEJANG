import LottieView from "lottie-react-native";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/base/app-text";
import { AppColors, AppSpacing } from "@/constants/theme";

const coffeeCupAnimation = require("../../../../assets/animate-icon/coffee-cup.json");

export function AdminWebViewLoading() {
	return (
		<View style={styles.container}>
			<LottieView
				autoPlay
				loop
				resizeMode="contain"
				source={coffeeCupAnimation}
				style={styles.animation}
			/>
			<View style={styles.textArea}>
				<AppText.Base bold color={AppColors.primary}>
					조금만 기다려 주세요
				</AppText.Base>
				<AppText.Sm color={AppColors.sub}>사이트를 불러오는 중입니다.</AppText.Sm>
			</View>
		</View>
	);
}

export default AdminWebViewLoading;

const styles = StyleSheet.create({
	container: {
		position: "absolute",
		top: 0,
		right: 0,
		bottom: 0,
		left: 0,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: AppColors.background,
		paddingHorizontal: AppSpacing.lg,
	},
	animation: {
		width: 132,
		height: 132,
	},
	textArea: {
		alignItems: "center",
		gap: AppSpacing.xs,
		marginTop: AppSpacing.sm,
	},
});
