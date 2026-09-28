import NotificationBell from "./NotificationBell";
import SettingsButton from "./SettingsButton";
import type { Language } from "@/lib/types";

export default function TabHeader({ title, subtitle, language }: { title: string; subtitle?: string; language: Language }) {
  return (
    <div className="mb-6 flex items-start justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-neutral-900">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-neutral-500">{subtitle}</p>}
      </div>
      <div className="flex flex-none items-center gap-2">
        <NotificationBell language={language} />
        <SettingsButton language={language} />
      </div>
    </div>
  );
}
