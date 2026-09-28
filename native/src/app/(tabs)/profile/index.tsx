import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, Image } from "react-native";
import { ScreenScaffold } from "../../../components/ui/ScreenScaffold";
import { router, useFocusEffect } from "expo-router";
import { ScreenHeader, HeaderTextButton } from "../../../components/ScreenHeader";
import { ActionCard } from "../../../components/ui/ActionCard";
import { useLanguage } from "../../../lib/LanguageContext";
import { t, tf, LOCALE_BY_LANGUAGE } from "../../../lib/ui-copy";
import {
  listBusinesses,
  getLatestAssessment,
  getUserProfile,
  getDiscoverAnswers,
  listActiveProjects,
  type UserProfile,
} from "../../../lib/db";
import { COUNTRIES } from "../../../lib/market-copy";
import { computeLaunchJourneyPhases, PROFILE_JOURNEY_LABEL_KEY } from "../../../lib/discover/milestones";
import { projectHubHref } from "../../../lib/journey/project-phases";
import { useScrollContentStyle } from "../../../lib/layout-metrics";
import { colors, panelSurface, space, type as typography } from "../../../lib/theme";
import type { Business } from "../../../lib/types";

type BusinessRow = Business & { created_at: string };

export default function ProfileScreen() {
  const { language } = useLanguage();
  const [businesses, setBusinesses] = useState<BusinessRow[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const load = useCallback(() => {
    setBusinesses(listBusinesses());
    setProfile(getUserProfile());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const discover = getDiscoverAnswers();
  const projects = listActiveProjects();
  const { currentPhaseId } = computeLaunchJourneyPhases({
    discoverCompleted: !!discover?.completed_at,
    projects,
  });
  const leadProject = projects.length === 1 ? projects[0] : null;
  const launchCardTitle =
    currentPhaseId === "discover" && !discover && projects.length === 0
      ? t("profile.launchNotStarted", language)
      : tf("profile.launchPhaseInProgress", language, {
          stage: t(PROFILE_JOURNEY_LABEL_KEY[currentPhaseId], language),
        });

  const countryLabel = profile ? COUNTRIES.find((c) => c.code === profile.country)?.label[language] : undefined;

  const totalBusinesses = businesses.length;
  const completedCount = businesses.filter((b) => !!getLatestAssessment(b.id)).length;
  const inProgressCount = totalBusinesses - completedCount;
  const memberSince = profile ? new Date(profile.created_at).toLocaleDateString(LOCALE_BY_LANGUAGE[language]) : null;
  const scrollContent = useScrollContentStyle("tab");

  return (
    <ScreenScaffold>
      <ScrollView contentContainerStyle={scrollContent}>
        <ScreenHeader
          title={t("header.profile.title", language)}
          right={<HeaderTextButton label={t("common.settings", language)} onPress={() => router.push("/profile/settings")} />}
        />

        {profile && (
          <Pressable style={styles.identityCard} onPress={() => router.push("/profile/identity")}>
            <View style={styles.identityLeft}>
              <View style={styles.avatar}>
                {profile.photo_data_url ? (
                  <Image source={{ uri: profile.photo_data_url }} style={styles.avatarImg} />
                ) : (
                  <Text style={styles.avatarInitial}>{profile.display_name?.[0]?.toUpperCase() ?? "?"}</Text>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.identityName}>{profile.display_name}</Text>
                {countryLabel ? <Text style={styles.identityCountry}>{countryLabel}</Text> : null}
              </View>
            </View>
            <Text style={styles.editLink}>{t("profile.editIdentity", language)}</Text>
          </Pressable>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t("profile.statsSection", language)}</Text>
          <View style={styles.statsPanel}>
            <StatBox value={totalBusinesses} label={t("profile.statsTotal", language)} />
            <View style={styles.statDivider} />
            <StatBox value={completedCount} label={t("profile.statsCompleted", language)} highlight />
            <View style={styles.statDivider} />
            <StatBox value={inProgressCount} label={t("profile.statsInProgress", language)} />
          </View>
          {memberSince ? (
            <Text style={styles.memberSince}>
              {t("profile.statsMemberSince", language)}: {memberSince}
            </Text>
          ) : null}
        </View>

        <ActionCard
          glyph="assess"
          title={t("profile.manageBusinesses", language)}
          body={t("profile.manageBusinessesBody", language)}
          cta={t("tab.tasks", language)}
          onPress={() => router.push("/(tabs)/tasks" as any)}
          style={styles.manageCard}
        />

        <ActionCard
          glyph="path"
          title={t("profile.myPathSection", language)}
          body={launchCardTitle}
          cta={leadProject ? t("profile.openProject", language) : t("explore.myPathCta", language)}
          onPress={() =>
            leadProject ? router.push(projectHubHref(leadProject.id) as any) : router.push("/my-path" as any)
          }
          style={styles.manageCard}
        />
      </ScrollView>
    </ScreenScaffold>
  );
}

function StatBox({ value, label, highlight }: { value: number; label: string; highlight?: boolean }) {
  return (
    <View style={styles.statBox}>
      <Text style={[typography.statValue, highlight && styles.statValueHighlight]}>{value}</Text>
      <Text style={typography.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  identityCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    ...panelSurface(),
    padding: space.card + 2,
    marginBottom: space.section,
  },
  identityLeft: { flexDirection: "row", alignItems: "center", gap: 14, flex: 1 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    backgroundColor: colors.bgMuted,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImg: { width: 56, height: 56 },
  avatarInitial: { fontSize: 20, fontWeight: "700", color: colors.textSecondary },
  identityName: { fontSize: 17, fontWeight: "600", color: colors.text },
  identityCountry: { fontSize: 14, color: colors.textMuted, marginTop: 2 },
  editLink: { fontSize: 14, fontWeight: "600", color: colors.accentDark },

  section: { marginBottom: space.section },
  sectionLabel: typography.sectionLabel,

  statsPanel: {
    flexDirection: "row",
    alignItems: "stretch",
    ...panelSurface({ paddingVertical: 16, paddingHorizontal: 4 }),
  },
  statBox: { flex: 1, alignItems: "center", paddingHorizontal: 4 },
  statDivider: { width: StyleSheet.hairlineWidth, backgroundColor: colors.borderStrong, marginVertical: 4 },
  statValueHighlight: { color: colors.accentDark },
  memberSince: { fontSize: 13, color: colors.textFaint, marginTop: 12, textAlign: "center" },

  manageCard: { marginBottom: space.section },
});
