import React from "react";
import { StyleSheet, Text, View, type ViewStyle } from "react-native";
import { colors, panelSurface, radii, space, type as typography } from "../../lib/theme";

type Props = {
  title?: string;
  footer?: string;
  children: React.ReactNode;
  style?: ViewStyle;
  /** Flat panel (no elevation) — use around TextInputs on Android. */
  form?: boolean;
};

/** iOS Settings–style section: uppercase label + inset grouped panel (Apple HIG lists). */
export function GroupedSection({ title, footer, children, style, form }: Props) {
  return (
    <View style={[styles.wrap, style]}>
      {title ? <Text style={typography.sectionLabel}>{title}</Text> : null}
      <View style={form ? styles.formPanel : styles.panel}>{children}</View>
      {footer ? <Text style={styles.footer}>{footer}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: space.section },
  panel: {
    // Avoid overflow: "hidden" — breaks TextInput on Android (focus/cursor without keystrokes).
    ...panelSurface({ paddingVertical: 0, paddingHorizontal: 0 }),
  },
  formPanel: {
    borderRadius: radii.lg,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  footer: {
    fontSize: 13,
    color: typography.screenSubtitle.color,
    lineHeight: 18,
    marginTop: 8,
    paddingHorizontal: 4,
  },
});
