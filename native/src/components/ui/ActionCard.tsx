import React from "react";
import { StyleSheet, Text, View, type ViewStyle } from "react-native";
import { AppPressable } from "./AppPressable";
import { ActionGlyph, type ActionGlyphKind } from "./ActionGlyphs";
import { ResumeBanner } from "../ResumeBanner";
import type { ResumeSuggestion } from "../../lib/resume-context";
import { colors, panelSurface, radii, space, type as typography } from "../../lib/theme";

type Props = {
  title: string;
  body?: string;
  cta: string;
  onPress: () => void;
  glyph: ActionGlyphKind;
  badge?: string;
  featured?: boolean;
  style?: ViewStyle;
  /** In-card continue prompt (e.g. My Path resume). */
  resume?: ResumeSuggestion | null;
};

export function ActionCard({ title, body, cta, onPress, glyph, badge, featured, style, resume }: Props) {
  return (
    <View style={[styles.wrap, style]}>
      <View style={[styles.card, featured && styles.cardFeatured]}>
        <AppPressable onPress={onPress} style={styles.cardHeader}>
          <ActionGlyph kind={glyph} featured={featured} />
          <View style={styles.headerCopy}>
            {badge ? <Text style={featured ? styles.badgeAccent : styles.badgeMuted}>{badge}</Text> : null}
            <Text style={[typography.cardTitle, featured && styles.titleFeatured]}>{title}</Text>
            {body ? <Text style={styles.bodyInline}>{body}</Text> : null}
          </View>
        </AppPressable>

        {resume ? <ResumeBanner suggestion={resume} variant="embedded" /> : null}

        <AppPressable onPress={onPress} style={[styles.ctaRow, featured && styles.ctaRowFeatured]}>
          <Text style={[styles.cta, featured && styles.ctaFeatured]}>{cta}</Text>
          <Text style={styles.ctaChevron}>›</Text>
        </AppPressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: "stretch", width: "100%" },
  card: {
    ...panelSurface(),
    padding: space.card + 4,
    marginBottom: 12,
  },
  cardFeatured: {
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
    marginBottom: 14,
  },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  headerCopy: { flex: 1, gap: 6 },
  badgeAccent: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.7,
    textTransform: "uppercase",
    color: colors.accentDark,
  },
  badgeMuted: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: colors.textFaint,
  },
  titleFeatured: { fontSize: 18, fontWeight: "700" },
  bodyInline: { fontSize: 15, color: colors.textSecondary, lineHeight: 22 },
  ctaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  ctaRowFeatured: {
    marginTop: 14,
    paddingTop: 0,
    borderTopWidth: 0,
    backgroundColor: colors.bgMuted,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    paddingHorizontal: space.card,
  },
  cta: { fontSize: 15, fontWeight: "600", color: colors.accentDark, flex: 1 },
  ctaFeatured: { fontWeight: "700" },
  ctaChevron: { fontSize: 22, fontWeight: "300", color: colors.textMuted, marginLeft: 8 },
});
