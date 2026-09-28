import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, radii } from "../../lib/theme";

type Props = { label: string; progress: number; tone?: "accent" | "muted" };

export function ProgressBar({ label, progress, tone = "accent" }: Props) {
  const pct = Math.min(100, Math.max(0, Math.round(progress * 100)));
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            { width: `${pct}%` },
            tone === "muted" && { backgroundColor: colors.textMuted },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { fontSize: 13, fontWeight: "600", color: colors.textSecondary },
  track: { height: 8, borderRadius: radii.full, backgroundColor: colors.border, overflow: "hidden" },
  fill: { height: "100%", borderRadius: radii.full, backgroundColor: colors.accent },
});
