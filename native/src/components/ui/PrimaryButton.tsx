import React from "react";
import { ActivityIndicator, StyleSheet, Text, View, type ViewStyle } from "react-native";
import { AppPressable } from "./AppPressable";
import { colors, motion, primaryButton, radii, space } from "../../lib/theme";

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  hint?: string;
  loading?: boolean;
  style?: ViewStyle;
};

export function PrimaryButton({ label, onPress, disabled, hint, loading, style }: Props) {
  const inactive = disabled || loading;
  return (
    <View style={styles.wrap}>
      <AppPressable
        onPress={onPress}
        disabled={inactive}
        style={[styles.btn, inactive && styles.btnDisabled, style]}
        accessibilityRole="button"
        accessibilityState={{ disabled: inactive }}
      >
        {!inactive ? <View style={styles.sheen} pointerEvents="none" /> : null}
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={[styles.label, inactive && styles.labelDisabled]}>{label}</Text>
        )}
      </AppPressable>
      {inactive && hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

export function SecondaryButton({ label, onPress, style }: { label: string; onPress: () => void; style?: ViewStyle }) {
  return (
    <AppPressable
      onPress={onPress}
      style={[styles.secondary, style]}
      accessibilityRole="button"
    >
      <Text style={styles.secondaryLabel}>{label}</Text>
    </AppPressable>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.card / 2 },
  btn: {
    ...primaryButton(),
    minHeight: motion.minTouch,
    justifyContent: "center",
  },
  btnDisabled: { backgroundColor: colors.borderStrong },
  sheen: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "45%",
    backgroundColor: "rgba(255,255,255,0.18)",
    borderTopLeftRadius: radii.md,
    borderTopRightRadius: radii.md,
  },
  label: { color: "#fff", fontSize: 15, fontWeight: "600" },
  labelDisabled: { color: colors.textFaint },
  hint: { fontSize: 13, color: colors.textMuted, lineHeight: 18, textAlign: "center" },
  secondary: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgElevated,
    paddingVertical: 12,
    paddingHorizontal: space.card,
    alignItems: "center",
    minHeight: motion.minTouch,
    justifyContent: "center",
  },
  secondaryLabel: { fontSize: 15, fontWeight: "600", color: colors.textSecondary },
});
