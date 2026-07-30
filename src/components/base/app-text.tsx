import { AppColors, AppFonts, AppTextSizes } from "@/constants/theme";
import type { FC } from "react";
import { Text, type TextProps, type TextStyle } from "react-native";

type AppTextSize = keyof typeof AppTextSizes;

export type AppTextProps = TextProps & {
	bold?: boolean;
	color?: string;
};

type AppTextComponent = FC<AppTextProps> & {
	Xs: FC<AppTextProps>;
	Sm: FC<AppTextProps>;
	Base: FC<AppTextProps>;
	Lg: FC<AppTextProps>;
	Xl: FC<AppTextProps>;
};

function createText(size: AppTextSize) {
	return function SizedAppText({ bold = false, color = AppColors.text, style, ...props }: AppTextProps) {
		const fontSize = AppTextSizes[size];
		const baseStyle: TextStyle = {
			color,
			fontFamily: bold ? AppFonts.bold : AppFonts.regular,
			fontSize,
			lineHeight: Math.round(fontSize * 1.4),
			letterSpacing: -0.3,
		};

		return <Text {...props} style={[baseStyle, style]} />;
	};
}

const Base = createText("base");

export const AppText = Base as AppTextComponent;

AppText.Xs = createText("xs");
AppText.Sm = createText("sm");
AppText.Base = Base;
AppText.Lg = createText("lg");
AppText.Xl = createText("xl");

export default AppText;
