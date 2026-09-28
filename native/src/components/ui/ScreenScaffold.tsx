import React from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../lib/theme";

type Props = {
  children: React.ReactNode;
  style?: ViewStyle;
  /** Pad below content for home indicator / gesture bar (stack & modal screens). */
  safeBottom?: boolean;
  /**
   * `default` — light top wash on tab-style screens.
   * `flat` — single stone background (onboarding, heroes that span the top).
   */
  background?: "default" | "flat";
};

/** Full-screen shell — stone base; optional subtle top wash on tab screens. */
export function ScreenScaffold({ children, style, safeBottom = false, background = "default" }: Props) {
  const insets = useSafeAreaInsets();
  const paddingTop = insets.top;
  const paddingBottom = safeBottom ? Math.max(insets.bottom, 12) : 0;

  return (
    <View style={[styles.safe, { paddingTop, paddingBottom }, style]}>
      {background === "default" ? <View style={styles.topWash} pointerEvents="none" /> : null}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topWash: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
  },
  content: { flex: 1 },
});
