import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, motion, radii, space } from "../../lib/theme";

type Props = {
  options: [string, string][];
  value: string;
  onChange: (value: string) => void;
  /** Inline chips (time bands) vs full-width stacked rows (long payment copy). */
  layout?: "wrap" | "stack";
};

export function ChoiceOptionGroup({ options, value, onChange, layout = "wrap" }: Props) {
  if (layout === "stack") {
    return (
      <>
        {options.map(([id, label], index) => {
          const selected = value === id;
          const isLast = index === options.length - 1;
          return (
            <Pressable
              key={id}
              style={({ pressed }) => [
                styles.stackRow,
                !isLast && styles.stackDivider,
                selected && styles.stackRowSelected,
                pressed && styles.stackRowPressed,
              ]}
              onPress={() => onChange(id)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
            >
              <Text style={[styles.stackLabel, selected && styles.stackLabelSelected]}>{label}</Text>
              {selected ? <Text style={styles.check}>✓</Text> : null}
            </Pressable>
          );
        })}
      </>
    );
  }

  return (
    <View style={styles.wrapPad}>
      <View style={styles.wrapRow}>
        {options.map(([id, label]) => {
          const selected = value === id;
          return (
            <Pressable
              key={id}
              style={({ pressed }) => [styles.chip, selected && styles.chipSelected, pressed && !selected && styles.chipPressed]}
              onPress={() => onChange(id)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
            >
              <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapPad: { paddingHorizontal: space.card, paddingVertical: 12 },
  wrapRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.bgElevated,
    minHeight: motion.minTouch - 4,
    justifyContent: "center",
  },
  chipSelected: { backgroundColor: colors.accentSoft, borderColor: colors.accent },
  chipPressed: { backgroundColor: colors.bgMuted },
  chipLabel: { fontSize: 14, fontWeight: "600", color: colors.textSecondary },
  chipLabelSelected: { color: colors.accentDark },
  stackRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: space.card,
    paddingVertical: 14,
    minHeight: motion.minTouch + 4,
  },
  stackDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  stackRowSelected: { backgroundColor: colors.accentSoft },
  stackRowPressed: { backgroundColor: colors.bgMuted },
  stackLabel: { flex: 1, fontSize: 15, fontWeight: "500", color: colors.text, lineHeight: 21 },
  stackLabelSelected: { color: colors.accentDark, fontWeight: "600" },
  check: { fontSize: 16, fontWeight: "700", color: colors.accent },
});
