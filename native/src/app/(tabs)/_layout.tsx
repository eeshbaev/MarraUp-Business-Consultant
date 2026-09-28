import React from "react";
import { Platform, StyleSheet } from "react-native";
import { Tabs } from "expo-router";
import { useLanguage } from "../../lib/LanguageContext";
import { t } from "../../lib/ui-copy";
import { ExploreTabIcon, MarketTabIcon, ProfileTabIcon, TasksTabIcon } from "../../components/tab-bar-glyphs";
import { useTabBarLayout } from "../../lib/layout-metrics";
import { colors } from "../../lib/theme";

export default function TabsLayout() {
  const { language } = useLanguage();
  const { tabBarStyle } = useTabBarLayout();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accentDark,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.bgElevated,
          borderTopWidth: Platform.OS === "android" ? 1 : StyleSheet.hairlineWidth,
          borderTopColor: colors.border,
          ...tabBarStyle,
          ...Platform.select({
            ios: {
              shadowColor: "#1C1917",
              shadowOffset: { width: 0, height: -3 },
              shadowOpacity: 0.08,
              shadowRadius: 12,
            },
            default: { elevation: 12 },
          }),
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: "600", marginTop: 2, marginBottom: 0 },
        tabBarItemStyle: { paddingTop: 0, minHeight: 48 },
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="explore"
        options={{
          title: t("tab.explore", language),
          tabBarIcon: ({ focused }) => <ExploreTabIcon active={focused} />,
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: t("tab.tasks", language),
          tabBarIcon: ({ focused }) => <TasksTabIcon active={focused} />,
        }}
      />
      <Tabs.Screen
        name="market"
        options={{
          title: t("tab.market", language),
          tabBarIcon: ({ focused }) => <MarketTabIcon active={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t("tab.profile", language),
          tabBarIcon: ({ focused }) => <ProfileTabIcon active={focused} />,
        }}
      />
    </Tabs>
  );
}
