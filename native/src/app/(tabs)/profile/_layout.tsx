import React from "react";
import { Stack } from "expo-router";

// Profile is a small stack nested inside the Profile tab: index is the
// overview, the rest (identity/settings/notifications/privacy) push on top
// with a native back gesture/header, mirroring the web app's
// /profile/identity, /profile/settings, etc. sub-pages.
export default function ProfileStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="identity" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="privacy" />
    </Stack>
  );
}
