import { Redirect } from "expo-router";
import { getUserProfile } from "@/lib/db";

// First launch (no local profile row yet) goes through onboarding
// (name + country) before landing on Explore, same as the web app's
// onboarding gate — everyone after that lands straight on Explore.
export default function RootIndex() {
  const profile = getUserProfile();
  return <Redirect href={profile ? "/(tabs)/explore" : "/onboarding"} />;
}
