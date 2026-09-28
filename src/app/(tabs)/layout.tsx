import { redirect } from "next/navigation";
import BottomTabBar from "@/components/BottomTabBar";
import { getLanguage } from "@/lib/language";
import { getUserProfile } from "@/lib/db";

export default async function TabsLayout({ children }: { children: React.ReactNode }) {
  const language = await getLanguage();
  // First-launch gate: every tab (Discover/Market/Profile) requires a local
  // profile to exist. /onboarding itself lives outside this (tabs) group so
  // it never redirects into itself.
  if (!getUserProfile()) redirect("/onboarding");
  return (
    <div className="pb-20">
      <div className="mx-auto max-w-3xl px-6 py-8">{children}</div>
      <BottomTabBar language={language} />
    </div>
  );
}
