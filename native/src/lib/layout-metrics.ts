import { useMemo } from "react";
import { Platform, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { space } from "./theme";

/** Icon + label row in the bottom tab bar (excludes home-indicator padding). */
export const TAB_BAR_CORE_HEIGHT = Platform.select({ ios: 50, default: 56 }) ?? 56;

export function useTabBarLayout() {
  const insets = useSafeAreaInsets();
  const paddingBottom = Math.max(insets.bottom, Platform.OS === "android" ? 8 : 0);
  const paddingTop = 6;
  const height = TAB_BAR_CORE_HEIGHT + paddingTop + paddingBottom;

  const tabBarStyle: ViewStyle = {
    paddingTop,
    paddingBottom,
    height,
  };

  return { insets, tabBarStyle, tabBarHeight: height };
}

type ScrollVariant = "tab" | "stack";

type ScrollOptions = {
  /** Set when `ScreenScaffold` already pads for the home indicator. */
  scaffoldHandlesBottom?: boolean;
  flexGrow?: boolean;
};

export function useScrollContentStyle(variant: ScrollVariant = "stack", options?: ScrollOptions) {
  const insets = useSafeAreaInsets();
  const flexGrow = options?.flexGrow ?? false;
  const scaffoldHandlesBottom = options?.scaffoldHandlesBottom ?? false;

  return useMemo(() => {
    const base = {
      paddingHorizontal: space.screenX,
      paddingTop: space.screenTop,
      ...(flexGrow ? { flexGrow: 1 as const } : {}),
    };

    if (variant === "tab") {
      return {
        ...base,
        paddingBottom: 28,
      };
    }

    const bottomPad = scaffoldHandlesBottom ? space.section : Math.max(insets.bottom, 16) + space.section;

    return { ...base, paddingBottom: bottomPad };
  }, [variant, flexGrow, scaffoldHandlesBottom, insets.bottom]);
}

export function useStickyFooterPadding() {
  const insets = useSafeAreaInsets();
  return Math.max(insets.bottom, 12) + 12;
}
