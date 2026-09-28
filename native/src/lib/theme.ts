import { Platform, type TextStyle, type ViewStyle } from "react-native";

/**
 * MarraUp brand palette — slate blue on stone (B2B CTAs on #F5F3EF).
 * Green is reserved for semantic data: health scores, “growing” market outlook.
 */
export const colors = {
  bg: "#F5F3EF",
  bgElevated: "#FFFFFF",
  bgMuted: "#FAFAF9",

  text: "#1C1917",
  textSecondary: "#57534E",
  textMuted: "#78716C",
  textFaint: "#A8A29E",

  border: "#E7E5E4",
  borderStrong: "#D6D3D1",

  accent: "#1D4ED8",
  accentDark: "#1E40AF",
  accentSoft: "#EFF6FF",
  accentSoftBorder: "#BFDBFE",

  ink: "#1C1917",
  inkPressed: "#292524",

  danger: "#E11D48",
  /** Positive outcomes in charts/scores — not for primary buttons. */
  success: "#047857",
  warning: "#D97706",

} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
} as const;

export const space = {
  screenX: 20,
  screenTop: 8,
  /** Extra bottom padding so CTAs clear the tab bar / gesture area. */
  screenBottom: 56,
  section: 24,
  card: 16,
} as const;

export const motion = {
  pressScale: 0.98,
  durationMs: 200,
  minTouch: 48,
} as const;

export const type = {
  /** Prefer `<BrandWordmark />` for the logotype; this is legacy spacing for headers. */
  brandEyebrow: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
    letterSpacing: 0.2,
  } satisfies TextStyle,
  screenTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: -0.4,
    lineHeight: 34,
  } satisfies TextStyle,
  screenSubtitle: { fontSize: 16, color: colors.textSecondary, marginTop: 6, lineHeight: 23 } satisfies TextStyle,
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textMuted,
    marginBottom: 12,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  } satisfies TextStyle,
  cardTitle: { fontSize: 17, fontWeight: "600", color: colors.text, lineHeight: 24 } satisfies TextStyle,
  cardBody: { fontSize: 14, color: colors.textSecondary, lineHeight: 20, marginTop: 6 } satisfies TextStyle,
  link: { fontSize: 14, fontWeight: "600", color: colors.accentDark } satisfies TextStyle,
  statValue: { fontSize: 24, fontWeight: "700", color: colors.text } satisfies TextStyle,
  statLabel: { fontSize: 12, color: colors.textMuted, marginTop: 4, textAlign: "center" } satisfies TextStyle,
} as const;

export const shadow = {
  card: Platform.select<ViewStyle>({
    ios: {
      shadowColor: "#1C1917",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 10,
    },
    default: { elevation: 2 },
  })!,
  cardHover: Platform.select<ViewStyle>({
    ios: {
      shadowColor: "#1C1917",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 14,
    },
    default: { elevation: 3 },
  })!,
};

export function cardSurface(extra?: ViewStyle): ViewStyle {
  return {
    borderRadius: radii.lg,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
    ...extra,
  };
}

/** Primary panel on tab screens — slightly stronger lift. */
export function panelSurface(extra?: ViewStyle): ViewStyle {
  return {
    borderRadius: radii.lg,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    ...shadow.cardHover,
    ...extra,
  };
}

export function primaryButton(extra?: ViewStyle): ViewStyle {
  return {
    borderRadius: radii.md,
    backgroundColor: colors.accent,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: colors.accentDark,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.18,
        shadowRadius: 8,
      },
      default: { elevation: 4 },
    }),
    ...extra,
  };
}
