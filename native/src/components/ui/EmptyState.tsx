import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { PrimaryButton } from "./PrimaryButton";
import { cardSurface, colors, space, type as typography } from "../../lib/theme";

type Props = {
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ title, body, actionLabel, onAction }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.rule} />
      <Text style={[typography.cardTitle, styles.titleCenter]}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      {actionLabel && onAction ? (
        <PrimaryButton label={actionLabel} onPress={onAction} style={styles.cta} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...cardSurface(),
    padding: space.section,
    backgroundColor: colors.bgElevated,
    alignItems: "stretch",
  },
  rule: {
    width: 40,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.accent,
    alignSelf: "center",
    marginBottom: 16,
  },
  titleCenter: { textAlign: "center" },
  body: { ...typography.cardBody, marginTop: 8, textAlign: "center" },
  cta: { marginTop: space.card + 4 },
});
