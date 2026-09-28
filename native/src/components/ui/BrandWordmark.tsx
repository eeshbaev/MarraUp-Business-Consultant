import React from "react";
import { Text, StyleSheet, type StyleProp, type TextStyle } from "react-native";
import { colors } from "../../lib/theme";

type Size = "sm" | "md" | "lg" | "xl";

const sizeStyles: Record<Size, { root: TextStyle; marra: TextStyle; up: TextStyle }> = {
  sm: {
    root: { fontSize: 13, letterSpacing: 0.2 },
    marra: { fontWeight: "600", color: colors.textSecondary },
    up: { fontWeight: "700", color: colors.accentDark },
  },
  md: {
    root: { fontSize: 17, letterSpacing: 0.15 },
    marra: { fontWeight: "600", color: colors.text },
    up: { fontWeight: "800", color: colors.accent },
  },
  lg: {
    root: { fontSize: 22, letterSpacing: 0.1 },
    marra: { fontWeight: "600", color: colors.text },
    up: { fontWeight: "800", color: colors.accent },
  },
  xl: {
    root: { fontSize: 28, letterSpacing: 0.05 },
    marra: { fontWeight: "700", color: colors.text },
    up: { fontWeight: "800", color: colors.accent },
  },
};

type Props = {
  size?: Size;
  style?: StyleProp<TextStyle>;
  /** When set, wordmark is centered (e.g. onboarding hero). */
  align?: "left" | "center";
};

/** Canonical “MarraUp” logotype — never all-caps. */
export function BrandWordmark({ size = "sm", style, align = "left" }: Props) {
  const s = sizeStyles[size];
  return (
    <Text
      style={[s.root, align === "center" && styles.center, style]}
      accessibilityRole="text"
      accessibilityLabel="MarraUp"
    >
      <Text style={s.marra}>Marra</Text>
      <Text style={s.up}>Up</Text>
    </Text>
  );
}

const styles = StyleSheet.create({
  center: { textAlign: "center", alignSelf: "center" },
});
