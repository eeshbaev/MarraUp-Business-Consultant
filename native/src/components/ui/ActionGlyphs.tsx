import React from "react";
import { StyleSheet, View } from "react-native";
import { colors, radii } from "../../lib/theme";

export type ActionGlyphKind = "path" | "assess" | "quiz" | "idea";

const STROKE = 2;

/** Distinct entry icons — journey route vs health gauge (featured cards use larger tile). */
export function ActionGlyph({ kind, featured }: { kind: ActionGlyphKind; featured?: boolean }) {
  const stroke = featured ? colors.accentDark : colors.textMuted;
  const fill = featured ? colors.accentSoft : colors.bgMuted;
  const size = featured ? 52 : 44;
  return (
    <View style={[styles.box, { width: size, height: size, backgroundColor: fill }, featured && styles.boxFeatured]}>
      {kind === "path" && <CompassMark stroke={stroke} featured={featured} />}
      {kind === "assess" && <HealthGaugeMark stroke={stroke} featured={featured} />}
      {kind === "quiz" && <ScopeMark stroke={stroke} />}
      {kind === "idea" && <LedgerMark stroke={stroke} />}
    </View>
  );
}

/** Launch new — compass (choose direction before you scale). */
function CompassMark({ stroke, featured }: { stroke: string; featured?: boolean }) {
  const north = featured ? colors.accent : stroke;
  const south = featured ? colors.accentDark : colors.textFaint;
  return (
    <View style={styles.compass}>
      <View style={[styles.compassRing, { borderColor: stroke }]} />
      <View style={[styles.compassTickN, { backgroundColor: stroke }]} />
      <View style={[styles.compassTickE, { backgroundColor: stroke, opacity: 0.35 }]} />
      <View style={styles.compassNeedleWrap}>
        <View
          style={[
            styles.compassNeedleNorth,
            { borderBottomColor: north },
          ]}
        />
        <View
          style={[
            styles.compassNeedleSouth,
            { borderTopColor: south },
          ]}
        />
      </View>
      <View style={[styles.compassHub, { borderColor: stroke, backgroundColor: featured ? colors.bgElevated : colors.bgMuted }]} />
    </View>
  );
}

/** Business assessment — score dial in the “healthy” zone. */
function HealthGaugeMark({ stroke, featured }: { stroke: string; featured?: boolean }) {
  const needle = featured ? colors.accent : stroke;
  const ok = colors.success;
  return (
    <View style={styles.gaugeWrap}>
      <View style={styles.gaugeClip}>
        <View style={[styles.gaugeArc, { borderColor: stroke }]} />
        <View style={[styles.gaugeArcOk, { borderColor: ok, opacity: featured ? 0.85 : 0.45 }]} />
      </View>
      <View style={[styles.gaugeTick, { left: 6, top: 10, transform: [{ rotate: "-52deg" }], backgroundColor: stroke }]} />
      <View style={[styles.gaugeTick, { left: 15, top: 5, transform: [{ rotate: "-90deg" }], backgroundColor: stroke }]} />
      <View style={[styles.gaugeTick, { left: 24, top: 10, transform: [{ rotate: "-128deg" }], backgroundColor: ok, opacity: featured ? 1 : 0.5 }]} />
      <View style={[styles.gaugeNeedle, { backgroundColor: needle, transform: [{ rotate: "-38deg" }] }]} />
      <View style={[styles.gaugeHub, { borderColor: stroke, backgroundColor: featured ? colors.bgElevated : colors.bgMuted }]} />
    </View>
  );
}

function ScopeMark({ stroke }: { stroke: string }) {
  return (
    <View style={styles.scope}>
      <View style={[styles.scopeRing, { borderColor: stroke }]} />
      <View style={[styles.scopeHandle, { backgroundColor: stroke }]} />
    </View>
  );
}

function LedgerMark({ stroke }: { stroke: string }) {
  return (
    <View style={[styles.ledger, { borderColor: stroke }]}>
      <View style={[styles.ledgerLine, { backgroundColor: stroke }]} />
      <View style={[styles.ledgerLine, { backgroundColor: stroke, width: "65%", opacity: 0.55 }]} />
      <View style={[styles.ledgerLine, { backgroundColor: stroke, width: "80%", opacity: 0.35 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  boxFeatured: { borderColor: colors.accentSoftBorder },
  compass: { width: 34, height: 34, alignItems: "center", justifyContent: "center" },
  compassRing: {
    position: "absolute",
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: STROKE,
    backgroundColor: "transparent",
  },
  compassTickN: {
    position: "absolute",
    top: 1,
    width: STROKE,
    height: 5,
    borderRadius: 1,
  },
  compassTickE: {
    position: "absolute",
    right: 2,
    width: 4,
    height: STROKE,
    borderRadius: 1,
  },
  compassNeedleWrap: {
    alignItems: "center",
    transform: [{ rotate: "-28deg" }],
  },
  compassNeedleNorth: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderBottomWidth: 13,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  },
  compassNeedleSouth: {
    width: 0,
    height: 0,
    marginTop: -2,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 10,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    opacity: 0.75,
  },
  compassHub: {
    position: "absolute",
    width: 6,
    height: 6,
    borderRadius: 3,
    borderWidth: STROKE,
  },
  gaugeWrap: { width: 34, height: 22, alignItems: "center", justifyContent: "flex-end" },
  gaugeClip: { position: "absolute", top: 0, width: 34, height: 17, overflow: "hidden", alignItems: "center" },
  gaugeArc: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: STROKE,
    backgroundColor: "transparent",
  },
  gaugeArcOk: {
    position: "absolute",
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: STROKE,
    borderBottomColor: "transparent",
    borderLeftColor: "transparent",
    transform: [{ rotate: "28deg" }],
    backgroundColor: "transparent",
  },
  gaugeTick: { position: "absolute", width: STROKE, height: 4, borderRadius: 1 },
  gaugeNeedle: {
    position: "absolute",
    bottom: 2,
    width: STROKE,
    height: 13,
    borderRadius: 1,
    transformOrigin: "bottom",
  },
  gaugeHub: {
    position: "absolute",
    bottom: 0,
    width: 7,
    height: 7,
    borderRadius: 4,
    borderWidth: STROKE,
  },
  scope: { width: 22, height: 22, alignItems: "center", justifyContent: "center" },
  scopeRing: { width: 14, height: 14, borderRadius: 7, borderWidth: STROKE, backgroundColor: "transparent" },
  scopeHandle: { position: "absolute", width: STROKE, height: 7, bottom: 1, right: 2, borderRadius: 1, transform: [{ rotate: "45deg" }] },
  ledger: {
    width: 20,
    height: 22,
    borderWidth: STROKE,
    borderRadius: 2,
    padding: 4,
    gap: 3,
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  ledgerLine: { height: STROKE, borderRadius: 1, width: "100%" },
});
