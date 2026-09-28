import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, radii } from "@/lib/theme";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function BusinessAvatar({ name }: { name: string; sector?: string }) {
  const label = useMemo(() => initials(name), [name]);

  return (
    <View style={styles.wrap}>
      <Text style={styles.text} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 44,
    height: 44,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.bgElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  text: { fontSize: 14, fontWeight: "700", color: colors.textSecondary, letterSpacing: 0.2 },
});
