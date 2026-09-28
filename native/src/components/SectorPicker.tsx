import React, { useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, Modal, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { Language } from "@/lib/types";
import { SECTOR_TAXONOMY, findSectorGroup, findSubSector } from "@/lib/sector-taxonomy";
import { SecondaryButton } from "@/components/ui/PrimaryButton";
import { cardSurface, colors, radii, space } from "@/lib/theme";
import { t } from "@/lib/ui-copy";

const COPY: Record<Language, { searchSector: string; searchSub: string; noMatches: string; change: string; pickSector: string; pickSub: string }> = {
  en: { searchSector: "Search sectors…", searchSub: "Search sub-sectors…", noMatches: "No matches", change: "Change", pickSector: "Select sector", pickSub: "Select sub-sector" },
  uz: { searchSector: "Sohalarni qidirish…", searchSub: "Quyi sohalarni qidirish…", noMatches: "Mos kelmadi", change: "Oʻzgartirish", pickSector: "Sohni tanlang", pickSub: "Quyi sohani tanlang" },
  ru: { searchSector: "Поиск отрасли…", searchSub: "Поиск подотрасли…", noMatches: "Нет совпадений", change: "Изменить", pickSector: "Выберите отрасль", pickSub: "Выберите подотрасль" },
  zh: { searchSector: "搜索行业…", searchSub: "搜索细分行业…", noMatches: "无匹配结果", change: "更改", pickSector: "选择行业", pickSub: "选择细分行业" },
  fr: { searchSector: "Rechercher un secteur…", searchSub: "Rechercher un sous-secteur…", noMatches: "Aucun résultat", change: "Modifier", pickSector: "Sélectionner un secteur", pickSub: "Sélectionner un sous-secteur" },
};

function normalize(s: string): string {
  return s.toLowerCase();
}

type SheetProps = {
  visible: boolean;
  title: string;
  searchPlaceholder: string;
  query: string;
  onQueryChange: (q: string) => void;
  onClose: () => void;
  closeLabel: string;
  children: React.ReactNode;
};

function SearchSheet({ visible, title, searchPlaceholder, query, onQueryChange, onClose, closeLabel, children }: SheetProps) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={sheetStyles.safe} edges={["top", "bottom"]}>
        <View style={sheetStyles.handleWrap}>
          <View style={sheetStyles.handle} />
        </View>
        <View style={sheetStyles.header}>
          <Text style={sheetStyles.headerTitle}>{title}</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={sheetStyles.close}>{closeLabel}</Text>
          </Pressable>
        </View>
        <View style={sheetStyles.searchWrap}>
          <TextInput
            style={sheetStyles.searchInput}
            placeholder={searchPlaceholder}
            placeholderTextColor={colors.textFaint}
            value={query}
            onChangeText={onQueryChange}
            autoFocus
            clearButtonMode="while-editing"
          />
        </View>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={sheetStyles.list}>
          <View style={sheetStyles.card}>{children}</View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

export default function SectorPicker({
  language,
  initialGroupId,
  onChange,
}: {
  language: Language;
  initialGroupId?: string;
  onChange: (groupId: string, subId: string) => void;
}) {
  const copy = COPY[language] || COPY.en;
  const validInitialGroup = initialGroupId && findSectorGroup(initialGroupId) ? initialGroupId : "";
  const [groupId, setGroupId] = useState(validInitialGroup);
  const [subId, setSubId] = useState("");
  const [groupQuery, setGroupQuery] = useState("");
  const [subQuery, setSubQuery] = useState("");
  const [groupSheetOpen, setGroupSheetOpen] = useState(false);
  const [subSheetOpen, setSubSheetOpen] = useState(false);

  const group = groupId ? findSectorGroup(groupId) : undefined;
  const sub = groupId && subId ? findSubSector(groupId, subId) : undefined;

  const filteredGroups = useMemo(() => {
    const q = normalize(groupQuery.trim());
    if (!q) return SECTOR_TAXONOMY;
    return SECTOR_TAXONOMY.filter(
      (g) => normalize(g.name[language] || g.name.en).includes(q) || normalize(g.name.en).includes(q)
    );
  }, [groupQuery, language]);

  const filteredSubs = useMemo(() => {
    if (!group) return [];
    const q = normalize(subQuery.trim());
    if (!q) return group.subsectors;
    return group.subsectors.filter(
      (s) => normalize(s.name[language] || s.name.en).includes(q) || normalize(s.name.en).includes(q)
    );
  }, [group, subQuery, language]);

  function selectGroup(id: string) {
    setGroupId(id);
    setSubId("");
    setGroupQuery("");
    setGroupSheetOpen(false);
    setSubQuery("");
    onChange(id, "");
    setSubSheetOpen(true);
  }

  function selectSub(id: string) {
    setSubId(id);
    setSubQuery("");
    setSubSheetOpen(false);
    onChange(groupId, id);
  }

  function resetGroup() {
    setGroupId("");
    setSubId("");
    setGroupQuery("");
    setSubQuery("");
    onChange("", "");
    setGroupSheetOpen(true);
  }

  const groupLabel = group ? group.name[language] || group.name.en : copy.pickSector;
  const subLabel = sub ? sub.name[language] || sub.name.en : copy.pickSub;

  return (
    <View style={styles.container}>
      {group && !groupSheetOpen ? (
        <View style={styles.resolvedRow}>
          <Text style={styles.resolvedText} numberOfLines={2}>
            {groupLabel}
          </Text>
          <Pressable onPress={resetGroup} hitSlop={8}>
            <Text style={styles.changeText}>{copy.change}</Text>
          </Pressable>
        </View>
      ) : (
        <SecondaryButton label={groupLabel} onPress={() => setGroupSheetOpen(true)} />
      )}

      {group ? (
        sub && !subSheetOpen ? (
          <View style={styles.resolvedRow}>
            <Text style={styles.resolvedText} numberOfLines={2}>
              {subLabel}
            </Text>
            <Pressable
              onPress={() => {
                setSubId("");
                setSubQuery("");
                onChange(groupId, "");
                setSubSheetOpen(true);
              }}
              hitSlop={8}
            >
              <Text style={styles.changeText}>{copy.change}</Text>
            </Pressable>
          </View>
        ) : (
          <SecondaryButton label={subLabel} onPress={() => setSubSheetOpen(true)} />
        )
      ) : null}

      <SearchSheet
        visible={groupSheetOpen}
        title={copy.pickSector}
        searchPlaceholder={copy.searchSector}
        query={groupQuery}
        onQueryChange={setGroupQuery}
        onClose={() => setGroupSheetOpen(false)}
        closeLabel={t("common.cancel", language)}
      >
        {filteredGroups.length === 0 ? (
          <Text style={sheetStyles.noMatches}>{copy.noMatches}</Text>
        ) : (
          filteredGroups.map((g, index) => (
            <Pressable
              key={g.id}
              style={[sheetStyles.row, index < filteredGroups.length - 1 && sheetStyles.rowBorder]}
              onPress={() => selectGroup(g.id)}
            >
              <Text style={[sheetStyles.rowText, g.id === groupId && sheetStyles.rowTextActive]}>{g.name[language] || g.name.en}</Text>
              {g.id === groupId ? <Text style={sheetStyles.check}>✓</Text> : null}
            </Pressable>
          ))
        )}
      </SearchSheet>

      <SearchSheet
        visible={subSheetOpen && !!group}
        title={copy.pickSub}
        searchPlaceholder={copy.searchSub}
        query={subQuery}
        onQueryChange={setSubQuery}
        onClose={() => setSubSheetOpen(false)}
        closeLabel={t("common.cancel", language)}
      >
        {filteredSubs.length === 0 ? (
          <Text style={sheetStyles.noMatches}>{copy.noMatches}</Text>
        ) : (
          filteredSubs.map((s, index) => (
            <Pressable
              key={s.id}
              style={[sheetStyles.row, index < filteredSubs.length - 1 && sheetStyles.rowBorder]}
              onPress={() => selectSub(s.id)}
            >
              <Text style={[sheetStyles.rowText, s.id === subId && sheetStyles.rowTextActive]}>{s.name[language] || s.name.en}</Text>
              {s.id === subId ? <Text style={sheetStyles.check}>✓</Text> : null}
            </Pressable>
          ))
        )}
      </SearchSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  resolvedRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radii.sm,
    backgroundColor: colors.bgMuted,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 48,
  },
  resolvedText: { flex: 1, fontSize: 15, color: colors.text },
  changeText: { fontSize: 14, fontWeight: "600", color: colors.accentDark },
});

const sheetStyles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  handleWrap: { alignItems: "center", paddingTop: 8, paddingBottom: 4, backgroundColor: colors.bgElevated },
  handle: { width: 36, height: 4, borderRadius: radii.full, backgroundColor: colors.borderStrong },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: space.screenX,
    paddingBottom: 14,
    paddingTop: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.bgElevated,
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: colors.text, flex: 1, paddingRight: 12, letterSpacing: -0.3 },
  close: { fontSize: 16, fontWeight: "600", color: colors.accentDark },
  searchWrap: {
    paddingHorizontal: space.screenX,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.bg,
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
  list: { paddingHorizontal: space.screenX, paddingTop: 16, paddingBottom: space.screenBottom },
  card: { ...cardSurface({ overflow: "hidden", paddingVertical: 0 }) },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: space.card,
    paddingVertical: 14,
    minHeight: 52,
  },
  rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  rowText: { flex: 1, fontSize: 16, color: colors.textSecondary, lineHeight: 22 },
  rowTextActive: { color: colors.text, fontWeight: "600" },
  check: { fontSize: 18, fontWeight: "700", color: colors.accentDark },
  noMatches: { padding: space.card, fontSize: 15, color: colors.textMuted, textAlign: "center" },
});
