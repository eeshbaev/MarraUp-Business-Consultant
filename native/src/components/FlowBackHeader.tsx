import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { AppPressable } from "./ui/AppPressable";
import { colors, motion, radii, space } from "../lib/theme";

type Props = {
  title?: string;
  onBack?: () => void;
  backLabel: string;
};

export function FlowBackHeader({ title, onBack, backLabel }: Props) {
  return (
    <View style={styles.row}>
      <AppPressable
        onPress={onBack ?? (() => router.back())}
        style={styles.backChip}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={backLabel}
      >
        <Text style={styles.backText}>← {backLabel}</Text>
      </AppPressable>
      {title ? (
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { marginBottom: space.section - 8, gap: 10 },
  backChip: {
    alignSelf: "flex-start",
    minHeight: motion.minTouch - 8,
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radii.full,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  backText: { fontSize: 15, fontWeight: "600", color: colors.accentDark },
  title: { fontSize: 26, fontWeight: "700", color: colors.text, letterSpacing: -0.4 },
});
