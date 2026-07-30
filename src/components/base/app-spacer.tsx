import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppColors, AppSpacing } from '@/constants/theme';

export type AppSpacerProps = {
  color?: string;
  gap?: number;
  horizontal?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function AppSpacer({
  color = AppColors.sub,
  gap = AppSpacing.sm,
  horizontal = false,
  style,
}: AppSpacerProps) {
  return (
    <View style={[horizontal ? styles.verticalOuter : styles.horizontalOuter, { gap }, style]}>
      <View
        style={[
          horizontal ? styles.verticalLine : styles.horizontalLine,
          { backgroundColor: color },
        ]}
      />
    </View>
  );
}

export default AppSpacer;

const styles = StyleSheet.create({
  horizontalOuter: {
    alignSelf: 'stretch',
    width: '100%',
  },
  horizontalLine: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
  },
  verticalOuter: {
    alignSelf: 'stretch',
    height: '100%',
  },
  verticalLine: {
    height: '100%',
    width: StyleSheet.hairlineWidth,
  },
});
