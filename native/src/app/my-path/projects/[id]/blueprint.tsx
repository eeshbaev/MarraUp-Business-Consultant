import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { FlowBackHeader } from "@/components/FlowBackHeader";
import { GroupedSection } from "@/components/ui/GroupedSection";
import { GroupedTextField } from "@/components/ui/GroupedTextField";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { ScreenScaffold } from "@/components/ui/ScreenScaffold";
import { useLanguage } from "@/lib/LanguageContext";
import { t } from "@/lib/ui-copy";
import { getProject, proceedToDevelop, writeBlueprint, type Project } from "@/lib/db";
import { popOrReplace } from "@/lib/navigation";
import { useScrollContentStyle, useStickyFooterPadding } from "@/lib/layout-metrics";
import { colors, space, type as typography } from "@/lib/theme";

const FIELDS: { key: string; labelKey: string; multiline?: boolean }[] = [
  { key: "name", labelKey: "blueprint.field.name" },
  { key: "bp_problem", labelKey: "blueprint.field.problem" },
  { key: "bp_customer", labelKey: "blueprint.field.customer" },
  { key: "bp_offering", labelKey: "blueprint.field.offering" },
  { key: "bp_revenue_model", labelKey: "blueprint.field.revenueModel" },
  { key: "bp_pricing", labelKey: "blueprint.field.pricing" },
  { key: "bp_advantage", labelKey: "blueprint.field.advantage" },
  { key: "bp_location_scope", labelKey: "blueprint.field.locationScope" },
  { key: "bp_required_resources", labelKey: "blueprint.field.requiredResources", multiline: true },
  { key: "bp_launch_ready_condition", labelKey: "blueprint.field.launchReadyCondition", multiline: true },
];

function valuesFromProject(p: Project): Record<string, string> {
  const next: Record<string, string> = {};
  for (const f of FIELDS) {
    next[f.key] = ((p as unknown as Record<string, string | null>)[f.key] ?? "") as string;
  }
  return next;
}

function blueprintPayload(v: Record<string, string>) {
  return {
    name: v.name ?? "",
    bp_problem: v.bp_problem ?? "",
    bp_customer: v.bp_customer ?? "",
    bp_offering: v.bp_offering ?? "",
    bp_revenue_model: v.bp_revenue_model ?? "",
    bp_pricing: v.bp_pricing ?? "",
    bp_advantage: v.bp_advantage ?? "",
    bp_location_scope: v.bp_location_scope ?? "",
    bp_required_resources: v.bp_required_resources ?? "",
    bp_launch_ready_condition: v.bp_launch_ready_condition ?? "",
  };
}

export default function BlueprintScreen() {
  const { id: idParam } = useLocalSearchParams<{ id: string }>();
  const projectId = Array.isArray(idParam) ? idParam[0] : idParam;
  const { language } = useLanguage();
  const [project, setProject] = useState<Project | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [formEpoch, setFormEpoch] = useState(0);
  const [saveLabel, setSaveLabel] = useState<"idle" | "saving" | "saved">("idle");
  const lastPersistedRef = useRef("");
  const hydratedRef = useRef(false);

  const scrollContent = useScrollContentStyle("stack", { scaffoldHandlesBottom: true, flexGrow: true });
  const footerPad = useStickyFooterPadding();

  const load = useCallback(() => {
    if (!projectId) return;
    const p = getProject(projectId);
    setProject(p);
    if (p) {
      const next = valuesFromProject(p);
      setValues(next);
      lastPersistedRef.current = JSON.stringify(next);
      hydratedRef.current = true;
      setFormEpoch((e) => e + 1);
    }
  }, [projectId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  useEffect(() => {
    if (!projectId || !hydratedRef.current) return;
    const serialized = JSON.stringify(values);
    if (serialized === lastPersistedRef.current) return;

    setSaveLabel("saving");
    const timer = setTimeout(() => {
      writeBlueprint(projectId, blueprintPayload(values));
      lastPersistedRef.current = serialized;
      setSaveLabel("saved");
    }, 450);

    return () => clearTimeout(timer);
  }, [values, projectId]);

  if (!project || !projectId) {
    return (
      <ScreenScaffold safeBottom>
        <View />
      </ScreenScaffold>
    );
  }

  function proceed() {
    writeBlueprint(projectId, blueprintPayload(values));
    lastPersistedRef.current = JSON.stringify(values);
    proceedToDevelop(projectId);
    router.push(`/my-path/projects/${projectId}/develop` as any);
  }

  return (
    <ScreenScaffold background="flat" safeBottom>
      <View style={styles.page}>
        <ScrollView contentContainerStyle={scrollContent} keyboardShouldPersistTaps="handled">
          <FlowBackHeader
            backLabel={t("project.hub.back", language)}
            onBack={() => popOrReplace(`/my-path/projects/${projectId}`)}
          />
          <Text style={typography.screenTitle}>{t("blueprint.title", language)}</Text>
          <Text style={typography.screenSubtitle}>{t("blueprint.subtitle", language)}</Text>
          {saveLabel !== "idle" ? (
            <Text style={styles.saveStatus}>
              {saveLabel === "saving" ? t("blueprint.saving", language) : t("blueprint.saved", language)}
            </Text>
          ) : null}

          {FIELDS.map((f, index) => (
            <GroupedSection key={`${formEpoch}-${f.key}`} title={t(f.labelKey, language)} form>
              <GroupedTextField
                value={values[f.key] ?? ""}
                defaultValue={values[f.key] ?? ""}
                onChangeText={(v) => {
                  setSaveLabel("saving");
                  setValues((prev) => ({ ...prev, [f.key]: v }));
                }}
                multiline={f.multiline}
                textAlignVertical={f.multiline ? "top" : "center"}
                style={f.multiline ? styles.textArea : undefined}
                isLast
              />
            </GroupedSection>
          ))}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: footerPad }]}>
          <PrimaryButton label={t("blueprint.proceedToDevelop", language)} onPress={proceed} />
        </View>
      </View>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  saveStatus: { fontSize: 13, color: colors.textMuted, marginTop: 4, marginBottom: 4 },
  textArea: { minHeight: 96, paddingTop: 12, textAlignVertical: "top" },
  footer: {
    paddingHorizontal: space.screenX,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
  },
});
