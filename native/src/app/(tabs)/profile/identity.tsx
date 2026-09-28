import React, { useMemo, useState } from "react";
import { View, StyleSheet, Pressable, ScrollView, Image, ActivityIndicator, Alert, Text } from "react-native";
import { router } from "expo-router";
import { FlowBackHeader } from "../../../components/FlowBackHeader";
import { GroupedSection } from "../../../components/ui/GroupedSection";
import { GroupedTextField } from "../../../components/ui/GroupedTextField";
import { ListRow } from "../../../components/ui/ListRow";
import { PrimaryButton } from "../../../components/ui/PrimaryButton";
import { ScreenScaffold } from "../../../components/ui/ScreenScaffold";
import { SelectSheet } from "../../../components/ui/SelectSheet";
import { useLanguage } from "../../../lib/LanguageContext";
import { t } from "../../../lib/ui-copy";
import { getUserProfile, saveUserProfile } from "../../../lib/db";
import { countryLabelWithFlag, countrySelectOptions, type CountryCode } from "../../../lib/market-copy";
import { pickProfilePhoto } from "../../../lib/photo-picker";
import { useScrollContentStyle, useStickyFooterPadding } from "../../../lib/layout-metrics";
import { colors, space, type as typography } from "../../../lib/theme";

export default function IdentityScreen() {
  const { language } = useLanguage();
  const existing = getUserProfile();
  const [name, setName] = useState(existing?.display_name ?? "");
  const [country, setCountry] = useState<CountryCode>((existing?.country as CountryCode) ?? "uz");
  const [photo, setPhoto] = useState<string | null>(existing?.photo_data_url ?? null);
  const [countrySheetOpen, setCountrySheetOpen] = useState(false);
  const countryOptions = useMemo(() => countrySelectOptions(language), [language]);
  const [photoLoading, setPhotoLoading] = useState(false);
  const scrollContent = useScrollContentStyle("stack", { scaffoldHandlesBottom: true });
  const footerPad = useStickyFooterPadding();

  const onSave = () => {
    saveUserProfile({ display_name: name.trim() || "Me", country, photo_data_url: photo });
    router.back();
  };

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

  return (
    <ScreenScaffold safeBottom>
      <ScrollView contentContainerStyle={scrollContent} keyboardShouldPersistTaps="handled">
        <FlowBackHeader backLabel={t("header.profile.title", language)} onBack={() => router.back()} />
        <Text style={typography.screenTitle}>{t("profile.editIdentity", language)}</Text>

        <GroupedSection title={t("onboarding.photoLabel", language)}>
          <View style={styles.photoRow}>
            <Pressable style={styles.avatar} onPress={onChoosePhoto} disabled={photoLoading}>
              {photoLoading ? (
                <ActivityIndicator color={colors.textFaint} />
              ) : photo ? (
                <Image source={{ uri: photo }} style={styles.avatarImg} />
              ) : (
                <Text style={styles.avatarInitial}>{name.trim()[0]?.toUpperCase() ?? "?"}</Text>
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

        <GroupedSection title={t("onboarding.nameLabel", language)} form>
          <GroupedTextField
            value={name}
            onChangeText={setName}
            placeholder={t("onboarding.namePlaceholder", language)}
            autoCapitalize="words"
            isLast
          />
        </GroupedSection>

        <GroupedSection title={t("onboarding.countryLabel", language)}>
          <ListRow title={countryLabelWithFlag(country, language)} onPress={() => setCountrySheetOpen(true)} isLast />
        </GroupedSection>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: footerPad }]}>
        <PrimaryButton label={t("common.save", language)} onPress={onSave} />
      </View>

      <SelectSheet
        visible={countrySheetOpen}
        title={t("onboarding.countryLabel", language)}
        options={countryOptions}
        selectedValue={country}
        onSelect={(code) => setCountry(code as CountryCode)}
        onClose={() => setCountrySheetOpen(false)}
        closeLabel={t("common.cancel", language)}
        searchPlaceholder={t("common.search", language)}
        emptyLabel={t("common.noMatches", language)}
      />
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  photoRow: { flexDirection: "row", alignItems: "center", gap: 16, padding: space.card },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.bgMuted,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImg: { width: 72, height: 72 },
  avatarInitial: { fontSize: 24, fontWeight: "600", color: colors.textSecondary },
  photoActions: { gap: 8, flex: 1 },
  photoActionLink: { fontSize: 15, fontWeight: "600", color: colors.accentDark },
  photoRemoveLink: { color: colors.danger, fontWeight: "500" },
  footer: {
    paddingHorizontal: space.screenX,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.bgElevated,
  },
});
