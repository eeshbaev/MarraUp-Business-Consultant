import { Platform } from "react-native";

/** Success feedback — extend with expo-haptics when added to the project. */
export async function hapticSuccess(): Promise<void> {
  if (Platform.OS === "android") {
    try {
      const { Vibration } = await import("react-native");
      Vibration.vibrate(20);
    } catch {
      // no-op
    }
  }
}

export async function hapticLight(): Promise<void> {
  // iOS tactile feedback requires expo-haptics; visual press states cover the gap for now.
}
