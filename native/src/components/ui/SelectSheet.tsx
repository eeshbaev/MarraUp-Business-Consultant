import React, { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { cardSurface, colors, radii, space } from "../../lib/theme";

type Option = { value: string; label: string; /** e.g. flag emoji */ leading?: string };

type Props = {
  visible: boolean;
  title: string;
  options: Option[];
  selectedValue?: string;
  onSelect: (value: string) => void;
  onClose: () => void;
  closeLabel: string;
  /** When set, shows a search field and filters options by label. */
  searchPlaceholder?: string;
  emptyLabel?: string;
};

function normalize(s: string): string {
  return s.toLowerCase().trim();
}

/** Full-screen sheet so lists never overlap the form underneath. */
export function SelectSheet({
  visible,
  title,
  options,
  selectedValue,
  onSelect,
  onClose,
  closeLabel,
  searchPlaceholder,
  emptyLabel,
}: Props) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (visible) setQuery("");
  }, [visible]);

  const filtered = useMemo(() => {
    if (!searchPlaceholder) return options;
    const q = normalize(query);
    if (!q) return options;
    return options.filter((o) => normalize(o.label).includes(q));
  }, [options, query, searchPlaceholder]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.handleWrap}>
          <View style={styles.handle} />
        </View>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button">
            <Text style={styles.close}>{closeLabel}</Text>
          </Pressable>
        </View>
        {searchPlaceholder ? (
          <View style={styles.searchWrap}>
            <TextInput
              style={styles.searchInput}
              placeholder={searchPlaceholder}
              placeholderTextColor={colors.textFaint}
              value={query}
              onChangeText={setQuery}
              autoCorrect={false}
              clearButtonMode="while-editing"
            />
          </View>
        ) : null}
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent}>
          <View style={styles.card}>
            {filtered.length === 0 ? (
              <Text style={styles.empty}>{emptyLabel ?? "—"}</Text>
            ) : (
              filtered.map((opt, index) => {
                const active = opt.value === selectedValue;
                const isLast = index === filtered.length - 1;
                return (
                  <Pressable
                    key={opt.value}
                    style={({ pressed }) => [
                      styles.row,
                      !isLast && styles.rowBorder,
                      active && styles.rowActive,
                      pressed && styles.rowPressed,
                    ]}
                    onPress={() => {
                      onSelect(opt.value);
                      onClose();
                    }}
                  >
                    {opt.leading ? (
                      <Text style={styles.leading} accessibilityElementsHidden importantForAccessibility="no">
                        {opt.leading}
                      </Text>
                    ) : null}
                    <Text style={[styles.rowText, active && styles.rowTextActive]} numberOfLines={2}>
                      {opt.label}
                    </Text>
                    {active ? <Text style={styles.check}>✓</Text> : null}
                  </Pressable>
                );
              })
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  handleWrap: { alignItems: "center", paddingTop: 8, paddingBottom: 4, backgroundColor: colors.bgElevated },
  handle: {
    width: 36,
    height: 4,
    borderRadius: radii.full,
    backgroundColor: colors.borderStrong,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: space.screenX,
    paddingBottom: 14,
    paddingTop: 4,
    backgroundColor: colors.bgElevated,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { fontSize: 18, fontWeight: "700", color: colors.text, flex: 1, paddingRight: 12, letterSpacing: -0.3 },
  close: { fontSize: 16, fontWeight: "600", color: colors.accentDark },
  searchWrap: {
    paddingHorizontal: space.screenX,
    paddingVertical: 12,
    backgroundColor: colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.bgElevated,
  },
  scrollContent: {
    paddingHorizontal: space.screenX,
    paddingTop: 16,
    paddingBottom: space.screenBottom,
  },
  card: {
    ...cardSurface({ overflow: "hidden", paddingVertical: 0 }),
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: space.card,
    paddingVertical: 14,
    minHeight: 52,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowActive: { backgroundColor: colors.accentSoft },
  rowPressed: { backgroundColor: colors.bgMuted },
  leading: { fontSize: 24, lineHeight: 28, width: 32, textAlign: "center" },
  rowText: { flex: 1, fontSize: 16, color: colors.textSecondary, lineHeight: 22 },
  rowTextActive: { color: colors.text, fontWeight: "600" },
  check: { fontSize: 18, fontWeight: "700", color: colors.accentDark },
  empty: { padding: space.card, fontSize: 15, color: colors.textMuted, textAlign: "center" },
});
