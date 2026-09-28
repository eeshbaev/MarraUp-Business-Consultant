import Link from "next/link";
import { getNotifications } from "@/lib/notifications";
import { t, tf } from "@/lib/ui-copy";
import type { Language } from "@/lib/types";

export default function NotificationBell({ language }: { language: Language }) {
  const count = getNotifications().length;

  return (
    <Link
      href="/profile/notifications"
      className="relative flex h-9 w-9 flex-none items-center justify-center rounded-full bg-neutral-100 text-neutral-900"
      aria-label={count > 0 ? tf("notificationBell.countLabel", language, { count }) : t("common.notifications", language)}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      {count > 0 && (
        <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border border-white bg-neutral-900" />
      )}
    </Link>
  );
}
