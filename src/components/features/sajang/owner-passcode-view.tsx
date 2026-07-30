import { type Href, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";

import { AppIcon } from "@/components/base/app-icon";
import { AppPressable } from "@/components/base/app-pressable";
import { AppText } from "@/components/base/app-text";
import { AppColors, AppSpacing } from "@/constants/theme";
import { useSajangAuthStore } from "@/store/sajang-auth-store";

const passcodeLength = 6;
const ownerPasscode = process.env.EXPO_PUBLIC_SAJANG_PASSCODE;
const keypadRows: (number | "enter" | "backspace")[][] = [
	[1, 2, 3],
	[4, 5, 6],
	[7, 8, 9],
	["enter", 0, "backspace"],
];

export function OwnerPasscodeView() {
	const router = useRouter();
	const unlock = useSajangAuthStore(state => state.unlock);
	const [passcode, setPasscode] = useState("");
	const [errorMessage, setErrorMessage] = useState("");
	const passcodeSlots = useMemo(() => Array.from({ length: passcodeLength }, (_, index) => index < passcode.length), [passcode.length]);

	const appendDigit = (digit: number) => {
		setErrorMessage("");
		setPasscode(current => (current.length >= passcodeLength ? current : `${current}${digit}`));
	};

	const removeDigit = () => {
		setErrorMessage("");
		setPasscode(current => current.slice(0, -1));
	};

	const submitPasscode = () => {
		if (!ownerPasscode) {
			setPasscode("");
			setErrorMessage("사장님 패스코드 설정이 필요합니다.");
			return;
		}

		if (passcode !== ownerPasscode) {
			setPasscode("");
			setErrorMessage("비밀번호가 맞지 않아요.");
			return;
		}

		unlock();
		router.replace("/sajang/home" as Href);
	};

	return (
		<View style={styles.container}>
			<View style={styles.promptArea}>
				<AppText.Xl bold style={styles.prompt}>
					비밀번호를 입력해 주세요
				</AppText.Xl>
				<View style={styles.slotRow}>
					{passcodeSlots.map((filled, index) => (
						<View key={`${index}-${filled}`} style={[styles.slot, filled && styles.filledSlot]}>
							{filled && <View style={styles.slotDot} />}
						</View>
					))}
				</View>
				<View style={styles.messageArea}>
					<AppText.Sm color={errorMessage ? "#DC2626" : AppColors.sub}>{errorMessage || "6자리 숫자를 입력한 뒤 Enter를 눌러 주세요."}</AppText.Sm>
				</View>
			</View>

			<View style={styles.keypad}>
				{keypadRows.map((row, rowIndex) => (
					<View key={rowIndex} style={styles.keypadRow}>
						{row.map(key => {
							if (key === "backspace") {
								return (
									<AppPressable
										key={key}
										accessibilityLabel="비밀번호 한 글자 지우기"
										onPress={removeDigit}
										pressedColor="rgba(0, 75, 147, 0.08)"
										radius="base"
										style={styles.key}
									>
										<AppIcon.Xl color={AppColors.text} name="backspace-outline" pressable={false} />
									</AppPressable>
								);
							}

							if (key === "enter") {
								return (
									<AppPressable
										key={key}
										accessibilityLabel="비밀번호 확인"
										onPress={submitPasscode}
										pressedColor="#003E7A"
										radius="base"
										style={[styles.key, styles.enterKey]}
									>
										<AppText.Lg bold color={AppColors.textOnPrimary}>
											Enter
										</AppText.Lg>
									</AppPressable>
								);
							}

							return (
								<AppPressable
									key={key}
									accessibilityLabel={`${key} 입력`}
									onPress={() => appendDigit(key)}
									pressedColor="rgba(0, 75, 147, 0.08)"
									radius="base"
									style={styles.key}
								>
									<AppText.Xl bold>{key}</AppText.Xl>
								</AppPressable>
							);
						})}
					</View>
				))}
			</View>
		</View>
	);
}

export default OwnerPasscodeView;

const styles = StyleSheet.create({
	container: {
		flex: 1,
		width: "100%",
		backgroundColor: AppColors.background,
		paddingHorizontal: AppSpacing.md,
		paddingVertical: AppSpacing.lg,
	},
	promptArea: {
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: AppSpacing.lg,
		gap: AppSpacing.lg,
	},
	prompt: {
		textAlign: "center",
	},
	slotRow: {
		width: "100%",
		flexDirection: "row",
		justifyContent: "center",
		gap: AppSpacing.sm,
	},
	messageArea: {
		minHeight: 24,
		alignItems: "center",
		justifyContent: "center",
	},
	slot: {
		width: 42,
		height: 52,
		alignItems: "center",
		justifyContent: "center",
		borderWidth: 2,
		borderColor: "rgba(71, 85, 105, 0.24)",
		borderRadius: 8,
		backgroundColor: "rgba(71, 85, 105, 0.06)",
	},
	filledSlot: {
		borderColor: AppColors.primary,
		backgroundColor: "rgba(0, 75, 147, 0.08)",
	},
	slotDot: {
		width: 14,
		height: 14,
		borderRadius: 999,
		backgroundColor: AppColors.primary,
	},
	keypad: {
		flex: 1,
		width: "100%",
		gap: AppSpacing.sm,
	},
	keypadRow: {
		flex: 1,
		flexDirection: "row",
		gap: AppSpacing.sm,
	},
	key: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		borderWidth: 1,
		borderColor: "rgba(71, 85, 105, 0.24)",
		backgroundColor: AppColors.background,
	},
	enterKey: {
		backgroundColor: AppColors.primary,
		borderColor: AppColors.primary,
	},
});
