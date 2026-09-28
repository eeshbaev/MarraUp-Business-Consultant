import React from "react";
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from "react-native";
import { motion } from "../../lib/theme";

type Props = PressableProps & {
  style?: StyleProp<ViewStyle>;
  scalePressed?: number;
};

export function AppPressable({ style, scalePressed = motion.pressScale, disabled, ...rest }: Props) {
  return (
    <Pressable
      {...rest}
      disabled={disabled}
      style={({ pressed }) => [
        style,
        pressed && !disabled && { transform: [{ scale: scalePressed }], opacity: 0.96 },
      ]}
    />
  );
}
