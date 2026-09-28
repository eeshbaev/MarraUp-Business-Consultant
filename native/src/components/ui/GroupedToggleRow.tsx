import React from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { colors, motion, space } from "../../lib/theme";

type Props = {
  label: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
  isLast?: boolean;
};

export function GroupedToggleRow({ label, value, onValueChange, isLast }: Props) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, !isLast && styles.divider, pressed && styles.pressed]}
      onPress={() => onValueChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
    >
      <Text style={styles.label}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: colors.accent }}
        thumbColor={colors.bgElevated}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: space.card,
    paddingVertical: 10,
    minHeight: motion.minTouch + 4,
  },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  pressed: { backgroundColor: colors.bgMuted },
  label: { flex: 1, fontSize: 15, fontWeight: "500", color: colors.text, lineHeight: 21 },
});
