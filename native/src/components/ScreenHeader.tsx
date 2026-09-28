import React from "react";
import { View, Text, StyleSheet, Pressable, type ViewStyle } from "react-native";
import { BrandWordmark } from "./ui/BrandWordmark";
import { colors, space, type as typography } from "../lib/theme";

type Props = {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  style?: ViewStyle;
  showBrand?: boolean;
};

export function ScreenHeader({ title, subtitle, right, style, showBrand = true }: Props) {
  return (
    <View style={[styles.row, style]}>
      <View style={styles.textCol}>
        {showBrand ? <BrandWordmark size="sm" /> : null}
        <Text style={typography.screenTitle}>{title}</Text>
        {subtitle ? <Text style={typography.screenSubtitle}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

export function HeaderTextButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={8} style={({ pressed }) => [styles.headerBtn, pressed && styles.headerBtnPressed]}>
      <Text style={styles.headerBtnText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: space.section,
  },
  textCol: { flex: 1, gap: 4 },
  headerBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  headerBtnPressed: { opacity: 0.88 },
  headerBtnText: { fontSize: 14, fontWeight: "600", color: colors.text },
});
