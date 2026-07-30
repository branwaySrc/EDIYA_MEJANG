import { useEffect } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LottieView from "lottie-react-native";

import { AppText } from "@/components/base/app-text";
import { AppSpacing } from "@/constants/theme";
import type { AttendanceFeedbackPayload } from "@/lib/attendance-greeting";

const rateAnimation = require("../../../../../../assets/animate-icon/rate.json");
const finderAnimation = require("../../../../../../assets/animate-icon/finder.json");
const greetingDurationMs = 3600;

type AttendanceGreetingOverlayProps = {
	onClose: () => void;
	payload: AttendanceFeedbackPayload;
};

export function AttendanceGreetingOverlay({
	onClose,
	payload,
}: AttendanceGreetingOverlayProps) {
	useEffect(() => {
		const timer = setTimeout(onClose, greetingDurationMs);
		return () => clearTimeout(timer);
	}, [onClose]);

	const registrationBlocked = payload.kind === "future-blocked";
	const title = registrationBlocked
		? `${payload.employeeName}님 미리 출석은 불가능해요.`
		: `${payload.employeeName}님 출근 하셨군요!`;
	const summary = registrationBlocked
		? null
		: payload.kind === "attendance"
			? `${payload.month}월 총 ${payload.totalScheduledShiftCount}번 근무 중, ${payload.ordinal}번째 근무에요!`
			: `${payload.month}월 총 ${payload.ordinal}번째 대타 근무에요!`;

	return (
		<Modal
			animationType="fade"
			onRequestClose={onClose}
			statusBarTranslucent
			transparent
			visible
		>
			<View style={styles.layer}>
				<Pressable
					accessibilityLabel="출근 안내 닫기"
					accessibilityRole="button"
					focusable={false}
					onPress={onClose}
					style={styles.backdrop}
				/>
				<SafeAreaView edges={["top", "right", "bottom", "left"]} style={styles.safeArea}>
					<View accessibilityLiveRegion="polite" accessibilityViewIsModal style={styles.content}>
						<View style={styles.animationFrame}>
							<LottieView
								autoPlay
								loop={false}
								resizeMode="contain"
								source={registrationBlocked ? finderAnimation : rateAnimation}
								style={styles.animation}
							/>
						</View>
						<View style={styles.copy}>
							<AppText.Xl bold color="#FFFFFF" style={styles.title}>
								{title}
							</AppText.Xl>
							{summary && (
								<AppText.Base color="#FFFFFF" style={styles.summary}>
									{summary}
								</AppText.Base>
							)}
						</View>
					</View>
				</SafeAreaView>
			</View>
		</Modal>
	);
}

export default AttendanceGreetingOverlay;

const styles = StyleSheet.create({
	layer: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "rgba(0, 0, 0, 0.68)",
	},
	backdrop: {
		position: "absolute",
		top: 0,
		right: 0,
		bottom: 0,
		left: 0,
		outlineWidth: 0,
	},
	safeArea: {
		width: "100%",
		height: "100%",
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: AppSpacing.lg,
	},
	content: {
		width: "100%",
		maxWidth: 480,
		alignItems: "center",
		justifyContent: "center",
		gap: AppSpacing.md,
	},
	animationFrame: {
		width: 232,
		height: 232,
	},
	animation: {
		width: "100%",
		height: "100%",
	},
	copy: {
		width: "100%",
		alignItems: "center",
		gap: AppSpacing.sm,
	},
	title: {
		width: "100%",
		textAlign: "center",
		letterSpacing: 0,
	},
	summary: {
		width: "100%",
		textAlign: "center",
		letterSpacing: 0,
	},
});
