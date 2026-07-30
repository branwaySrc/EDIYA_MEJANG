import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps, FC } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { AppPressable, type AppPressableProps } from '@/components/base/app-pressable';
import { AppColors, AppIconSizes } from '@/constants/theme';

type IoniconName = ComponentProps<typeof Ionicons>['name'];
type AppIconSize = keyof typeof AppIconSizes;
type IoniconProps = ComponentProps<typeof Ionicons>;

export type AppIconProps = Omit<IoniconProps, 'size' | 'color' | 'onPress'> &
  Pick<
    AppPressableProps,
    | 'accessibilityLabel'
    | 'border'
    | 'disabled'
    | 'hitSlop'
    | 'onPress'
    | 'pressedColor'
    | 'radius'
    | 'testID'
  > & {
    buttonStyle?: StyleProp<ViewStyle>;
    color?: string;
    pressable?: boolean;
    size?: number;
  };

type AppIconComponent = FC<AppIconProps> & {
  Xs: FC<AppIconProps>;
  Sm: FC<AppIconProps>;
  Base: FC<AppIconProps>;
  Lg: FC<AppIconProps>;
  Xl: FC<AppIconProps>;
};

function createIcon(size: AppIconSize) {
  return function SizedAppIcon({
    accessibilityLabel,
    border,
    buttonStyle,
    color = AppColors.text,
    disabled,
    hitSlop = 8,
    name,
    onPress,
    pressable = true,
    pressedColor,
    radius = 'full',
    size: sizeOverride,
    testID,
    ...props
  }: AppIconProps & { name: IoniconName }) {
    const icon = <Ionicons {...props} name={name} size={sizeOverride ?? AppIconSizes[size]} color={color} />;

    if (!pressable) {
      return icon;
    }

    return (
      <AppPressable
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        border={border}
        disabled={disabled}
        hitSlop={hitSlop}
        onPress={onPress}
        pressedColor={pressedColor}
        radius={radius}
        style={StyleSheet.compose(styles.button, buttonStyle)}
        testID={testID}>
        {icon}
      </AppPressable>
    );
  };
}

const Base = createIcon('base');

export const AppIcon = Base as AppIconComponent;

AppIcon.Xs = createIcon('xs');
AppIcon.Sm = createIcon('sm');
AppIcon.Base = Base;
AppIcon.Lg = createIcon('lg');
AppIcon.Xl = createIcon('xl');

export default AppIcon;

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
