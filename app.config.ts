import type { ConfigContext, ExpoConfig } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
	...config,
	name: config.name ?? "EDIYA_MEJANG",
	slug: config.slug ?? "ediyamejang",
	extra: {
		...config.extra,
		sajangPasscode: process.env.EXPO_PUBLIC_SAJANG_PASSCODE,
	},
});
