import React from "react";
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { colors, motion, space } from "../../lib/theme";

type Props = {
  title?: string;
  subtitle?: string;
  /** Trailing value (e.g. selected country) — M3 trailing slot. */
  value?: string;
  leading?: React.ReactNode;
  onPress?: () => void;
  showChevron?: boolean;
  /** Hide bottom inset divider (last row in group). */
  isLast?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

/** Standard navigable row — 48dp+ touch target, disclosure chevron (Apple + Material lists). */
export function ListRow({
  title,
  subtitle,
  value,
  leading,
  onPress,
  showChevron = !!onPress,
  isLast = false,
  accessibilityLabel,
  style,
}: Props) {
  const body = (
    <>
      {leading ? <View style={styles.leading}>{leading}</View> : null}
      <View style={styles.main}>
        {title ? (
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
        ) : null}
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={3}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {value ? (
        <Text style={styles.value} numberOfLines={1}>
          {value}
        </Text>
      ) : null}
      {showChevron && onPress ? <Text style={styles.chevron}>›</Text> : null}
    </>
  );

  const rowStyle = [styles.row, !isLast && styles.rowDivider, style];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [...rowStyle, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? title ?? value}
      >
        {body}
      </Pressable>
    );
  }

  return <View style={rowStyle}>{body}</View>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: space.card,
    minHeight: motion.minTouch + 4,
    paddingVertical: 12,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  pressed: { backgroundColor: colors.bgMuted },
  leading: { width: 32, alignItems: "center" },
  main: { flex: 1, gap: 2, minWidth: 0 },
  title: { fontSize: 16, fontWeight: "500", color: colors.text, lineHeight: 22 },
  subtitle: { fontSize: 14, color: colors.textMuted, lineHeight: 19 },
  value: { fontSize: 16, color: colors.textSecondary, maxWidth: "42%", textAlign: "right" },
  chevron: { fontSize: 20, fontWeight: "300", color: colors.textFaint, marginLeft: 4 },
});
