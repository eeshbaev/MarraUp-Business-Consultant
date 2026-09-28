import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radii } from "../../lib/theme";

type Segment = { id: string; label: string };

type Props = {
  segments: Segment[];
  value: string;
  onChange: (id: string) => void;
};

export function SegmentedControl({ segments, value, onChange }: Props) {
  return (
    <View style={styles.track}>
      {segments.map((seg) => {
        const active = seg.id === value;
        return (
          <Pressable
            key={seg.id}
            style={[styles.segment, active && styles.segmentActive]}
            onPress={() => onChange(seg.id)}
          >
            <Text style={[styles.label, active && styles.labelActive]} numberOfLines={2}>
              {seg.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: "row",
    backgroundColor: colors.border,
    borderRadius: radii.md,
    padding: 3,
    gap: 3,
  },
  segment: {
    flex: 1,
    borderRadius: radii.sm,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  segmentActive: {
    backgroundColor: colors.bgElevated,
  },
  label: { fontSize: 13, fontWeight: "600", color: colors.textMuted, textAlign: "center" },
  labelActive: { color: colors.accentDark },
});
