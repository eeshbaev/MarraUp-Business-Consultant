import React from "react";
import { StyleSheet, View } from "react-native";
import { colors } from "../lib/theme";

type IconProps = { active: boolean; size?: number };

function strokeColor(active: boolean) {
  return active ? colors.accentDark : colors.textMuted;
}

function TabIcon({ active, size = 26, kind }: IconProps & { kind: "explore" | "tasks" | "market" | "profile" }) {
  const stroke = strokeColor(active);
  const s = size;
  return (
    <View style={{ width: s, height: s, alignItems: "center", justifyContent: "center" }}>
      {kind === "explore" && <BriefcaseIcon stroke={stroke} size={s} />}
      {kind === "tasks" && <ChecklistIcon stroke={stroke} size={s} active={active} />}
      {kind === "market" && <MarketIcon stroke={stroke} size={s} />}
      {kind === "profile" && <PersonIcon stroke={stroke} size={s} />}
    </View>
  );
}

function BriefcaseIcon({ stroke, size }: { stroke: string; size: number }) {
  const w = size * 0.72;
  const h = size * 0.52;
  return (
    <View style={{ width: w, height: h + size * 0.2 }}>
      <View style={[styles.handle, { borderColor: stroke, width: w * 0.38, left: (w - w * 0.38) / 2 }]} />
      <View style={[styles.case, { borderColor: stroke, width: w, height: h, top: size * 0.14 }]} />
    </View>
  );
}

function ChecklistIcon({ stroke, size, active }: { stroke: string; size: number; active: boolean }) {
  const box = size * 0.22;
  return (
    <View style={{ width: size * 0.75, height: size * 0.7, gap: size * 0.1 }}>
      {[0, 1, 2].map((row) => (
        <View key={row} style={styles.checkRow}>
          <View
            style={[
              styles.checkBox,
              {
                width: box,
                height: box,
                borderColor: stroke,
                backgroundColor: active && row === 0 ? stroke : "transparent",
              },
            ]}
          />
          <View style={[styles.checkLine, { backgroundColor: stroke, opacity: row === 0 ? 1 : 0.45, width: size * 0.42 }]} />
        </View>
      ))}
    </View>
  );
}

/** Overlapping banknotes — readable at tab-bar size (cf. cash-multiple). */
function MarketIcon({ stroke, size }: { stroke: string; size: number }) {
  const w = size * 0.68;
  const h = size * 0.4;
  return (
    <View style={{ width: size, height: size * 0.78, alignItems: "center", justifyContent: "flex-end" }}>
      <View
        style={[
          styles.marketBillBack,
          {
            borderColor: stroke,
            width: w,
            height: h,
            left: size * 0.06,
          },
        ]}
      />
      <View
        style={[
          styles.marketBillFront,
          {
            borderColor: stroke,
            width: w,
            height: h,
          },
        ]}
      >
        <View style={styles.marketDots}>
          <View style={[styles.marketDot, { borderColor: stroke }]} />
          <View style={[styles.marketDot, { borderColor: stroke }]} />
        </View>
      </View>
    </View>
  );
}

function PersonIcon({ stroke, size }: { stroke: string; size: number }) {
  const head = size * 0.28;
  return (
    <View style={{ alignItems: "center" }}>
      <View style={[styles.head, { width: head, height: head, borderColor: stroke }]} />
      <View style={[styles.shoulders, { borderColor: stroke, width: size * 0.62, height: size * 0.32, marginTop: size * 0.06 }]} />
    </View>
  );
}

export function ExploreTabIcon(props: IconProps) {
  return <TabIcon {...props} kind="explore" />;
}

export function TasksTabIcon(props: IconProps) {
  return <TabIcon {...props} kind="tasks" />;
}

export function MarketTabIcon(props: IconProps) {
  return <TabIcon {...props} kind="market" />;
}

export function ProfileTabIcon(props: IconProps) {
  return <TabIcon {...props} kind="profile" />;
}

const styles = StyleSheet.create({
  handle: {
    position: "absolute",
    top: 0,
    height: 5,
    borderWidth: 1.5,
    borderBottomWidth: 0,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  case: {
    position: "absolute",
    borderWidth: 1.5,
    borderRadius: 3,
  },
  checkRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  checkBox: { borderWidth: 1.5, borderRadius: 2 },
  checkLine: { height: 1.5, borderRadius: 1 },
  marketBillBack: {
    position: "absolute",
    bottom: 0,
    borderWidth: 1.5,
    borderRadius: 3,
    opacity: 0.45,
    transform: [{ rotate: "-10deg" }],
  },
  marketBillFront: {
    borderWidth: 1.5,
    borderRadius: 3,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 1,
  },
  marketDots: { flexDirection: "row", gap: 5 },
  marketDot: { width: 5, height: 5, borderRadius: 3, borderWidth: 1.5 },
  head: { borderWidth: 1.5, borderRadius: 999 },
  shoulders: { borderWidth: 1.5, borderTopLeftRadius: 999, borderTopRightRadius: 999, borderBottomWidth: 0 },
});
