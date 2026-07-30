import { Stack } from "expo-router";

import { AppColors } from "@/constants/theme";

export function AppStack() {
	return (
		<Stack
			screenOptions={{
				contentStyle: { backgroundColor: AppColors.background },
				headerShown: false,
			}}
		/>
	);
}

export default AppStack;
