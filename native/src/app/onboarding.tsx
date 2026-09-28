import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { FlowBackHeader } from "@/components/FlowBackHeader";
import { ActionGlyph, type ActionGlyphKind } from "@/components/ui/ActionGlyphs";
import { GroupedSection } from "@/components/ui/GroupedSection";
import { GroupedTextField } from "@/components/ui/GroupedTextField";
import { ListRow } from "@/components/ui/ListRow";
import { BrandWordmark } from "@/components/ui/BrandWordmark";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { ScreenScaffold } from "@/components/ui/ScreenScaffold";
import { SelectSheet } from "@/components/ui/SelectSheet";
import { useLanguage } from "@/lib/LanguageContext";
import { t, tf } from "@/lib/ui-copy";
import { saveUserProfile } from "@/lib/db";
import { countryLabelWithFlag, countrySelectOptions, type CountryCode } from "@/lib/market-copy";
import { pickProfilePhoto } from "@/lib/photo-picker";
import { useScrollContentStyle, useStickyFooterPadding } from "@/lib/layout-metrics";
import { colors, panelSurface, radii, shadow, space } from "@/lib/theme";
import type { Language } from "@/lib/types";

const ONBOARDING_STEPS = 2;
const appIcon = require("../../assets/icon.png");

export default function OnboardingScreen() {
  const { language } = useLanguage();
  const [step, setStep] = useState<"intro" | "form">("intro");
  const [name, setName] = useState("");
  const [country, setCountry] = useState<CountryCode | "">("");
  const [countrySheetOpen, setCountrySheetOpen] = useState(false);
  const countryOptions = useMemo(() => countrySelectOptions(language), [language]);
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoLoading, setPhotoLoading] = useState(false);

  const trimmedName = name.trim();
  const canContinue = trimmedName.length > 0 && country !== "";
  const scrollContent = useScrollContentStyle("stack", { scaffoldHandlesBottom: true, flexGrow: true });
  const footerPad = useStickyFooterPadding();

  const onChoosePhoto = async () => {
    setPhotoLoading(true);
    const result = await pickProfilePhoto();
    setPhotoLoading(false);
    if (result.status === "ok") {
      setPhoto(result.dataUrl);
    } else if (result.status === "permission_denied") {
      Alert.alert(t("onboarding.photoLabel", language), t("profile.photoPermissionDenied", language));
    } else if (result.status === "error") {
      Alert.alert(t("onboarding.photoLabel", language), result.message);
    }
  };

  const onContinue = () => {
    const finalName = name.trim();
    if (!finalName || !country) return;
    saveUserProfile({ display_name: finalName, country, photo_data_url: photo });
    router.replace("/(tabs)/explore");
  };

  if (step === "intro") {
    return (
      <ScreenScaffold background="flat">
        <ScrollView contentContainerStyle={[scrollContent, styles.introScroll]} style={styles.introScrollView}>
          <OnboardingProgress current={1} total={ONBOARDING_STEPS} language={language} />

          <View style={styles.hero}>
            <View style={styles.iconHalo}>
              <View style={styles.iconWrap}>
                <Image source={appIcon} style={styles.appIcon} accessibilityIgnoresInvertColors />
              </View>
            </View>
            <BrandWordmark size="lg" align="center" style={styles.heroWordmark} />
          </View>

          <View style={styles.servicesHeadlines}>
            <Text style={styles.servicesTitleLine}>{t("onboarding.introServicesLine1", language)}</Text>
            <Text style={styles.servicesSubtitleLine}>{t("onboarding.introServicesLine2", language)}</Text>
          </View>

          <View style={styles.servicesStack}>
            <IntroPathCard
              index={1}
              language={language}
              glyph="path"
              featured
              badgeKey="explore.pathBadgeNew"
              titleKey="explore.myPathTitle"
              taglineKey="onboarding.launchTagline"
            />
            <ServiceConnector />
            <IntroPathCard
              index={2}
              language={language}
              glyph="assess"
              badgeKey="explore.pathBadgeLive"
              titleKey="explore.runningTitle"
              taglineKey="explore.runningBody"
            />
          </View>
        </ScrollView>
        <View style={[styles.footer, { paddingBottom: footerPad }]}>
          <PrimaryButton label={t("onboarding.getStarted", language)} onPress={() => setStep("form")} />
        </View>
      </ScreenScaffold>
    );
  }

  return (
    <ScreenScaffold background="flat">
      <KeyboardAvoidingView
        style={styles.formShell}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        <ScrollView
          contentContainerStyle={scrollContent}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="on-drag"
          automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
          nestedScrollEnabled
          style={styles.introScrollView}
        >
          <FlowBackHeader backLabel={t("common.back", language)} onBack={() => setStep("intro")} />
          <OnboardingProgress current={2} total={ONBOARDING_STEPS} language={language} />

          <View style={styles.formHeader}>
            <Image source={appIcon} style={styles.formIcon} accessibilityIgnoresInvertColors />
            <View style={styles.formHeaderCopy}>
              <Text style={styles.formTitle}>{t("onboarding.title", language)}</Text>
              <Text style={styles.formSubtitle}>{t("onboarding.subtitle", language)}</Text>
            </View>
          </View>

          <GroupedSection title={t("onboarding.nameLabel", language)} form>
            <GroupedTextField
              value={name}
              onChangeText={setName}
              placeholder={t("onboarding.namePlaceholder", language)}
              autoCapitalize="words"
              autoComplete="name"
              textContentType="name"
              returnKeyType="done"
              blurOnSubmit={false}
              isLast
            />
          </GroupedSection>

        <GroupedSection title={t("onboarding.countryLabel", language)} footer={t("onboarding.countryHint", language)}>
          <ListRow
            title={country ? countryLabelWithFlag(country, language) : t("onboarding.selectCountry", language)}
            onPress={() => setCountrySheetOpen(true)}
            isLast
          />
        </GroupedSection>

        <GroupedSection title={t("onboarding.photoLabel", language)} footer={t("onboarding.photoHint", language)}>
          <View style={styles.photoRow}>
            <Pressable style={styles.avatar} onPress={onChoosePhoto} disabled={photoLoading}>
              {photoLoading ? (
                <ActivityIndicator color={colors.textFaint} />
              ) : photo ? (
                <Image source={{ uri: photo }} style={styles.avatarImg} />
              ) : (
                <Text style={styles.avatarInitial}>{trimmedName[0]?.toUpperCase() ?? "?"}</Text>
              )}
            </Pressable>
            <View style={styles.photoActions}>
              <Pressable onPress={onChoosePhoto} disabled={photoLoading}>
                <Text style={styles.photoActionLink}>{t("onboarding.choosePhoto", language)}</Text>
              </Pressable>
              {photo ? (
                <Pressable onPress={() => setPhoto(null)} disabled={photoLoading}>
                  <Text style={[styles.photoActionLink, styles.photoRemoveLink]}>{t("onboarding.removePhoto", language)}</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        </GroupedSection>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: footerPad }]}>
          <PrimaryButton
            label={t("onboarding.continue", language)}
            onPress={onContinue}
            disabled={!canContinue}
            hint={
              !canContinue
                ? !trimmedName && !country
                  ? `${t("onboarding.nameLabel", language)} · ${t("onboarding.countryLabel", language)}`
                  : !trimmedName
                    ? t("onboarding.nameLabel", language)
                    : t("onboarding.countryLabel", language)
                : undefined
            }
          />
        </View>
      </KeyboardAvoidingView>

      <SelectSheet
        visible={countrySheetOpen}
        title={t("onboarding.countryLabel", language)}
        options={countryOptions}
        selectedValue={country || undefined}
        onSelect={(code) => setCountry(code as CountryCode)}
        onClose={() => setCountrySheetOpen(false)}
        closeLabel={t("common.cancel", language)}
        searchPlaceholder={t("common.search", language)}
        emptyLabel={t("common.noMatches", language)}
      />
    </ScreenScaffold>
  );
}

function OnboardingProgress({ current, total, language }: { current: number; total: number; language: Language }) {
  return (
    <View style={styles.progressBlock}>
      <View style={styles.progressDots}>
        {Array.from({ length: total }, (_, i) => (
          <View key={i} style={[styles.progressDot, i < current && styles.progressDotFilled]} />
        ))}
      </View>
      <Text style={styles.progressLabel}>{tf("onboarding.stepOf", language, { current, total })}</Text>
    </View>
  );
}

function ServiceConnector() {
  return (
    <View style={styles.serviceConnector}>
      <View style={styles.serviceConnectorLine} />
      <View style={styles.serviceConnectorDot} />
      <View style={styles.serviceConnectorLine} />
    </View>
  );
}

function IntroPathCard({
  index,
  language,
  glyph,
  badgeKey,
  titleKey,
  taglineKey,
  featured,
}: {
  index: 1 | 2;
  language: Language;
  glyph: ActionGlyphKind;
  badgeKey: string;
  titleKey: string;
  taglineKey: string;
  featured?: boolean;
}) {
  return (
    <View style={[styles.pathCard, featured ? styles.pathCardFeatured : styles.pathCardSecondary]}>
      <View style={styles.pathCardRow}>
        <View style={styles.visualCluster}>
          <ActionGlyph kind={glyph} featured />
          <View style={[styles.serviceIndex, styles.serviceIndexFeatured]}>
            <Text style={styles.serviceIndexText}>{index}</Text>
          </View>
        </View>
        <View style={styles.pathCardCopy}>
          <Text style={styles.pathBadgeAccent}>{t(badgeKey, language)}</Text>
          <Text style={[styles.pathTitle, featured && styles.pathTitleFeatured]}>{t(titleKey, language)}</Text>
          <Text style={styles.pathTagline}>{t(taglineKey, language)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  formShell: { flex: 1 },
  introScrollView: { flex: 1, backgroundColor: colors.bg },
  introScroll: { paddingTop: 4, paddingBottom: 8 },
  progressBlock: { marginBottom: 16, gap: 8, alignItems: "center" },
  progressDots: { flexDirection: "row", gap: 8, justifyContent: "center" },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    backgroundColor: colors.bgElevated,
  },
  progressDotFilled: { backgroundColor: colors.accent, borderColor: colors.accent },
  progressLabel: { fontSize: 13, fontWeight: "600", color: colors.textMuted, textAlign: "center" },
  hero: { alignItems: "center", marginBottom: 22 },
  iconHalo: {
    padding: 5,
    borderRadius: 28,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.accentSoftBorder,
    marginBottom: 12,
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: radii.xl,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.cardHover,
  },
  appIcon: { width: 80, height: 80, borderRadius: radii.lg },
  heroWordmark: { marginTop: 2 },
  servicesHeadlines: { marginBottom: 18, paddingHorizontal: 4, gap: 6, alignItems: "center" },
  servicesTitleLine: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: -0.4,
    lineHeight: 28,
    textAlign: "center",
  },
  servicesSubtitleLine: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.textSecondary,
    lineHeight: 23,
    textAlign: "center",
  },
  servicesStack: { gap: 0 },
  serviceConnector: { alignItems: "center", paddingVertical: 4 },
  serviceConnectorLine: { width: 2, height: 10, backgroundColor: colors.accentSoftBorder, borderRadius: 1 },
  serviceConnectorDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.accent,
    marginVertical: 3,
  },
  pathCard: {
    alignSelf: "stretch",
    borderRadius: radii.lg,
    padding: space.card + 4,
  },
  pathCardFeatured: {
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.accentSoftBorder,
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
    ...shadow.cardHover,
  },
  pathCardSecondary: {
    ...panelSurface(),
    borderColor: colors.accentSoftBorder,
  },
  pathCardRow: { flexDirection: "row", alignItems: "flex-start", gap: 14, width: "100%" },
  visualCluster: { position: "relative", width: 52, height: 52, flexShrink: 0 },
  serviceIndex: {
    position: "absolute",
    top: -6,
    left: -6,
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: colors.bgElevated,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  serviceIndexFeatured: {
    backgroundColor: colors.accent,
  },
  serviceIndexText: { fontSize: 13, fontWeight: "800", color: colors.bgElevated },
  pathCardCopy: { flex: 1, gap: 5, paddingTop: 2 },
  pathBadgeAccent: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.75,
    textTransform: "uppercase",
    color: colors.accentDark,
  },
  pathTitle: { fontSize: 17, fontWeight: "600", color: colors.text, lineHeight: 24 },
  pathTitleFeatured: { fontSize: 18, fontWeight: "700" },
  pathTagline: { fontSize: 14, color: colors.textSecondary, lineHeight: 21 },
  formHeader: { flexDirection: "row", alignItems: "flex-start", gap: 14, marginBottom: space.section, marginTop: 4 },
  formIcon: { width: 52, height: 52, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border },
  formHeaderCopy: { flex: 1, gap: 6 },
  formTitle: { fontSize: 24, fontWeight: "700", color: colors.text, letterSpacing: -0.3, lineHeight: 28 },
  formSubtitle: { fontSize: 15, color: colors.textSecondary, lineHeight: 22 },
  footer: {
    paddingHorizontal: space.screenX,
    paddingTop: 16,
    backgroundColor: colors.bg,
  },
  photoRow: { flexDirection: "row", alignItems: "center", gap: 16, padding: space.card },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.bgMuted,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImg: { width: 64, height: 64 },
  avatarInitial: { fontSize: 22, fontWeight: "600", color: colors.textSecondary },
  photoActions: { gap: 8, flex: 1 },
  photoActionLink: { fontSize: 15, fontWeight: "600", color: colors.accentDark },
  photoRemoveLink: { color: colors.danger, fontWeight: "500" },
});
