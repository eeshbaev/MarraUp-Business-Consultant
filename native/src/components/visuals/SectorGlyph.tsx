import React from "react";
import { StyleSheet, View } from "react-native";
import { colors, radii } from "@/lib/theme";

type Kind = "agri" | "industrial" | "energy" | "tech" | "commerce" | "services" | "default";

function kindForSectorGroup(groupId: string): Kind {
  const id = groupId.toLowerCase();
  if (id.includes("agriculture") || id.includes("food")) return "agri";
  if (id.includes("mining") || id.includes("manufacturing") || id.includes("construction")) return "industrial";
  if (id.includes("energy") || id.includes("utilities")) return "energy";
  if (id.includes("technology") || id.includes("information") || id.includes("telecom")) return "tech";
  if (id.includes("retail") || id.includes("commerce") || id.includes("trade")) return "commerce";
  if (id.includes("health") || id.includes("education") || id.includes("financial")) return "services";
  return "default";
}

const S = 1.5;
const stroke = colors.textMuted;

/** Minimal outline sector marks — market list only. */
export function SectorGlyph({ groupId, size = 40 }: { groupId: string; size?: number }) {
  const kind = kindForSectorGroup(groupId);
  return (
    <View style={[styles.box, { width: size, height: size, borderRadius: radii.sm }]}>
      {kind === "agri" && <Bars size={14} />}
      {kind === "industrial" && <Factory />}
      {kind === "energy" && <Bolt />}
      {kind === "tech" && <Grid />}
      {kind === "commerce" && <Storefront />}
      {kind === "services" && <Columns />}
      {kind === "default" && <Bars size={16} />}
    </View>
  );
}

function Bars({ size }: { size: number }) {
  const hs = [size * 0.45, size * 0.75, size * 0.55];
  return (
    <View style={[styles.bars, { height: size }]}>
      {hs.map((h, i) => (
        <View key={i} style={{ height: h, width: 3, borderWidth: S, borderColor: stroke, borderRadius: 1 }} />
      ))}
    </View>
  );
}

function Factory() {
  return (
    <View style={styles.factory}>
      <View style={{ width: 5, height: 12, borderWidth: S, borderColor: stroke, borderRadius: 1 }} />
      <View style={{ width: 5, height: 16, borderWidth: S, borderColor: stroke, borderRadius: 1, marginLeft: 2 }} />
      <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: S, backgroundColor: stroke, opacity: 0.4 }} />
    </View>
  );
}

function Bolt() {
  return <View style={{ width: 10, height: 14, borderWidth: S, borderColor: stroke, transform: [{ rotate: "12deg" }], borderRadius: 1 }} />;
}

function Grid() {
  return (
    <View style={{ width: 16, height: 16, flexDirection: "row", flexWrap: "wrap", gap: 2 }}>
      {[0, 1, 2, 3].map((i) => (
        <View key={i} style={{ width: 6, height: 6, borderWidth: S, borderColor: stroke, borderRadius: 1 }} />
      ))}
    </View>
  );
}

function Storefront() {
  return (
    <View style={{ alignItems: "center" }}>
      <View style={{ width: 18, height: 5, borderWidth: S, borderColor: stroke, borderBottomWidth: 0, borderTopLeftRadius: 2, borderTopRightRadius: 2 }} />
      <View style={{ width: 16, height: 12, borderWidth: S, borderColor: stroke, borderRadius: 1 }} />
    </View>
  );
}

function Columns() {
  return (
    <View style={{ flexDirection: "row", gap: 3, alignItems: "flex-end" }}>
      <View style={{ width: 4, height: 14, borderWidth: S, borderColor: stroke, borderRadius: 1 }} />
      <View style={{ width: 4, height: 10, borderWidth: S, borderColor: stroke, borderRadius: 1 }} />
      <View style={{ width: 4, height: 12, borderWidth: S, borderColor: stroke, borderRadius: 1 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bgMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bars: { flexDirection: "row", alignItems: "flex-end", gap: 2 },
  factory: { flexDirection: "row", alignItems: "flex-end", height: 18 },
});
