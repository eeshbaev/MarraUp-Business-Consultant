import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, radii } from "../../lib/theme";

export function InfoPill({ label }: { label: string }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: radii.full,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  text: { fontSize: 13, fontWeight: "600", color: colors.accentDark },
});
